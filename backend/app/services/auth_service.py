import secrets
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.config import settings
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    hash_token
)
from app.models import User, Guest, RefreshToken, UserRole
from app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    TokenResponse,
    UserResponse,
    AuthResponse
)


def _generate_tokens_and_record(db: Session, user: User) -> TokenResponse:
    """Helper to generate JWT access token and store a secure hashed refresh token."""
    # 1. Create Access Token (carries sub=user_id, email, and role)
    access_token = create_access_token(
        subject=user.user_id,
        email=user.email,
        role=user.role.value
    )

    # 2. Create high-entropy Refresh Token
    raw_refresh_token = secrets.token_urlsafe(64)
    hashed_refresh = hash_token(raw_refresh_token)
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    # 3. Store hashed refresh token in database
    db_refresh_token = RefreshToken(
        user_id=user.user_id,
        token_hash=hashed_refresh,
        expires_at=expires_at,
        revoked=False
    )
    db.add(db_refresh_token)
    db.commit()

    return TokenResponse(
        access_token=access_token,
        refresh_token=raw_refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


def register_guest(db: Session, data: UserRegisterRequest) -> AuthResponse:
    """
    Registers a new public Guest user.
    - Strictly assigns role = 'guest'.
    - Checks for existing user with normalized email (409 if exists).
    - Checks for existing guest with normalized email:
        * Links to existing guest if found (prevents duplicate guest records).
        * Creates a new guest if not found.
    - Creates User account linked to guest_id.
    - Returns tokens and user details atomically.
    """
    normalized_email = data.email.strip().lower()

    # 1. Verify user does not already exist
    existing_user = db.query(User).filter(
        func.lower(func.trim(User.email)) == normalized_email
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists."
        )

    # 2. Find or create linked guest record
    existing_guest = db.query(Guest).filter(
        func.lower(func.trim(Guest.email)) == normalized_email
    ).first()

    if existing_guest:
        target_guest_id = existing_guest.guest_id
        # Update phone/city if missing on existing guest record
        if data.phone and not existing_guest.phone:
            existing_guest.phone = data.phone
        if data.city and not existing_guest.city:
            existing_guest.city = data.city
        db.flush()
    else:
        new_guest = Guest(
            full_name=data.full_name.strip(),
            email=normalized_email,
            phone=data.phone.strip() if data.phone else None,
            city=data.city.strip() if data.city else None
        )
        db.add(new_guest)
        db.flush()  # Flush to generate guest_id
        target_guest_id = new_guest.guest_id

    # 3. Create User record
    password_hash = get_password_hash(data.password)
    new_user = User(
        email=normalized_email,
        password_hash=password_hash,
        role=UserRole.guest,
        guest_id=target_guest_id,
        property_id=None,
        full_name=data.full_name.strip(),
        phone=data.phone.strip() if data.phone else None,
        is_active=True
    )
    db.add(new_user)
    db.flush()

    # 4. Generate tokens
    tokens = _generate_tokens_and_record(db, new_user)
    return AuthResponse(user=UserResponse.model_validate(new_user), tokens=tokens)


def authenticate_user(db: Session, data: UserLoginRequest) -> AuthResponse:
    """
    Validates user credentials, ensures active status, and returns tokens + fresh user info.
    """
    normalized_email = data.email.strip().lower()

    user = db.query(User).filter(
        func.lower(func.trim(User.email)) == normalized_email
    ).first()

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact administration."
        )

    tokens = _generate_tokens_and_record(db, user)
    return AuthResponse(user=UserResponse.model_validate(user), tokens=tokens)


def refresh_access_token(db: Session, refresh_token_str: str) -> TokenResponse:
    """
    Validates a refresh token and performs secure token rotation:
    - Verifies token hash exists, is not revoked, and not expired.
    - Invalidates the used refresh token (revoked = True).
    - Issues a brand new access token and a brand new refresh token.
    """
    token_hash = hash_token(refresh_token_str)
    
    db_token = db.query(RefreshToken).filter(
        RefreshToken.token_hash == token_hash,
        RefreshToken.revoked == False
    ).first()

    now_utc = datetime.now(timezone.utc)
    if not db_token or db_token.expires_at < now_utc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    # Invalidate current refresh token (Rotation)
    db_token.revoked = True
    db.commit()

    # Fetch user
    user = db.query(User).filter(User.user_id == db_token.user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account inactive or not found.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    return _generate_tokens_and_record(db, user)


def revoke_refresh_token(db: Session, refresh_token_str: str) -> None:
    """Revokes a refresh token on logout."""
    token_hash = hash_token(refresh_token_str)
    db_token = db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()
    if db_token:
        db_token.revoked = True
        db.commit()
