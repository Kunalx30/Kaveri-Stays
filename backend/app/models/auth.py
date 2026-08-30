import enum
from sqlalchemy import (
    Column, Integer, String, Boolean, ForeignKey, Numeric, 
    DateTime, Enum, func
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.booking import PaymentMethodType


class UserRole(str, enum.Enum):
    guest = "guest"
    staff = "staff"
    manager = "manager"
    owner = "owner"


class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(
        Enum(UserRole, name="user_role", create_type=False),
        nullable=False,
        default=UserRole.guest
    )
    guest_id = Column(Integer, ForeignKey("guests.guest_id", ondelete="SET NULL"), unique=True, nullable=True)
    property_id = Column(Integer, ForeignKey("properties.property_id", ondelete="SET NULL"), nullable=True)
    full_name = Column(String(150), nullable=False)
    phone = Column(String(30), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    guest = relationship("Guest", back_populates="user")
    property = relationship("Property", back_populates="users")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")
    idempotency_keys = relationship("PaymentIdempotency", back_populates="user", cascade="all, delete-orphan")


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    token_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash = Column(String(255), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    revoked = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="refresh_tokens")


class PaymentIdempotency(Base):
    __tablename__ = "payment_idempotency"

    idempotency_key = Column(String(128), primary_key=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    booking_id = Column(Integer, ForeignKey("bookings.booking_id", ondelete="CASCADE"), nullable=False, index=True)
    payment_id = Column(Integer, ForeignKey("payments.payment_id", ondelete="SET NULL"), nullable=True)
    amount = Column(Numeric(10, 2), nullable=False)
    method = Column(
        Enum(PaymentMethodType, name="payment_method_type", create_type=False),
        nullable=False
    )
    status = Column(String(20), nullable=False)  # 'in_flight', 'completed', 'failed'
    response_body = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)

    # Relationships
    user = relationship("User", back_populates="idempotency_keys")
    booking = relationship("Booking", back_populates="idempotency_records")
    payment = relationship("Payment")
