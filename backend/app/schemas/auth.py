from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from app.models.auth import UserRole


class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, description="Password with minimum 6 characters")
    full_name: str = Field(..., min_length=2, max_length=150)
    phone: Optional[str] = Field(None, max_length=30)
    city: Optional[str] = Field(None, max_length=100)


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class DevAuthAdminBase(BaseModel):
    admin_token: str = Field(..., min_length=16, description="Local development admin token")


class DevResetPasswordRequest(DevAuthAdminBase):
    email: EmailStr
    new_password: str = Field(..., min_length=6, description="New password with minimum 6 characters")


class DevDeleteTestUserRequest(DevAuthAdminBase):
    email: EmailStr
    confirm_email: EmailStr = Field(..., description="Must exactly match email")


class DevTestUserOperationResponse(BaseModel):
    message: str
    user_id: int
    email: str
    guest_id: Optional[int] = None
    bookings_preserved: int = 0
    payments_preserved: int = 0
    reviews_preserved: int = 0
    refresh_tokens_revoked: int = 0
    idempotency_records_removed: int = 0


class UserResponse(BaseModel):
    user_id: int
    email: str
    role: UserRole
    guest_id: Optional[int] = None
    property_id: Optional[int] = None
    full_name: str
    phone: Optional[str] = None
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AuthResponse(BaseModel):
    user: UserResponse
    tokens: TokenResponse
