from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm

from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models import User
from app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    TokenResponse,
    RefreshTokenRequest,
    UserResponse,
    AuthResponse
)
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(
    data: UserRegisterRequest,
    db: Session = Depends(get_db)
):
    """
    Public registration endpoint.
    - Strictly creates a **Guest** account.
    - Normalizes email and checks for existing guest record to link or create cleanly.
    - Prevents duplicate guest creation.
    - Returns JWT tokens and user profile.
    """
    return auth_service.register_guest(db, data)


@router.post("/login", response_model=AuthResponse)
def login(
    data: UserLoginRequest,
    db: Session = Depends(get_db)
):
    """
    Authenticates user with email and password.
    Returns access token, refresh token, and user profile with real-time role & property assignment.
    """
    return auth_service.authenticate_user(db, data)


@router.post("/token", response_model=TokenResponse)
def swagger_login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    OAuth2 Password Flow endpoint used by Swagger UI.
    Swagger sends username (email) and password as form data.
    """
    login_data = UserLoginRequest(
        email=form_data.username,
        password=form_data.password
    )

    auth_response = auth_service.authenticate_user(db, login_data)

    return auth_response.tokens


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(
    data: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """
    Refreshes access token using a valid refresh token.
    Implements **refresh token rotation** by revoking the used token and generating a fresh pair.
    """
    return auth_service.refresh_access_token(db, data.refresh_token)


@router.post("/logout", status_code=status.HTTP_200_OK)
def logout(
    data: RefreshTokenRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Logs out the authenticated user by revoking their refresh token.
    """
    auth_service.revoke_refresh_token(db, data.refresh_token)
    return {"message": "Successfully logged out."}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Returns current authenticated user profile.
    Role and property assignment are loaded live from the database.
    """
    return current_user
