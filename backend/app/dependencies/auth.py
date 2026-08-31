from typing import List, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import User, UserRole


oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/token"
)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Decodes the JWT token and loads the User from the database in REAL-TIME.
    This guarantees that role modifications, property reassignments, or
    account deactivations take effect immediately without relying on stale claims.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        user_id_str: Optional[str] = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
        user_id = int(user_id_str)
    except (JWTError, ValueError):
        raise credentials_exception

    # Load fresh user state directly from DB
    user = db.query(User).filter(User.user_id == user_id).first()
    if user is None:
        raise credentials_exception
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account."
        )

    return user


def get_optional_current_user(
    db: Session = Depends(get_db),
    token: Optional[str] = Depends(OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/token", auto_error=False))
) -> Optional[User]:
    """
    Optional authentication dependency.
    Returns the User object if a valid Bearer token is provided, or None if anonymous.
    """
    if not token:
        return None
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        user_id_str = payload.get("sub")
        if user_id_str is None:
            return None
        user = db.query(User).filter(User.user_id == int(user_id_str)).first()
        if user and user.is_active:
            return user
    except Exception:
        return None
    return None


def require_roles(allowed_roles: List[UserRole]):
    """
    Role-based authorization dependency factory.
    Verifies that the current user's database role is in the allowed roles list.
    """
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted for role '{current_user.role.value}'."
            )
        return current_user
    return role_checker


def check_property_access(current_user: User, property_id: int) -> bool:
    """
    Helper function to verify if the user has access to a specific property.
    - Owner: Unrestricted access to all properties.
    - Manager / Staff: Strictly limited to their assigned property_id.
    - Guest: No management access to any property.
    """
    if current_user.role == UserRole.owner:
        return True
    elif current_user.role in (UserRole.manager, UserRole.staff):
        if current_user.property_id == property_id:
            return True
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied: You are assigned to property ID {current_user.property_id}, not {property_id}."
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Guests do not have property management access."
        )
