import enum
from sqlalchemy import (
    Column, Integer, String, SmallInteger, ForeignKey, Numeric, 
    Text, DateTime, Enum, func
)
from sqlalchemy.dialects.postgresql import DATERANGE
from sqlalchemy.orm import relationship
from app.database import Base


class BookingStatus(str, enum.Enum):
    confirmed = "confirmed"
    checked_in = "checked_in"
    checked_out = "checked_out"
    cancelled = "cancelled"
    no_show = "no_show"


class PaymentMethodType(str, enum.Enum):
    card = "card"
    upi = "upi"
    bank_transfer = "bank_transfer"
    cash = "cash"


class Booking(Base):
    __tablename__ = "bookings"

    booking_id = Column(Integer, primary_key=True, index=True)
    guest_id = Column(Integer, ForeignKey("guests.guest_id", ondelete="RESTRICT"), nullable=False)
    room_id = Column(Integer, ForeignKey("rooms.room_id", ondelete="RESTRICT"), nullable=False)
    stay = Column(DATERANGE, nullable=False)
    guests_count = Column(SmallInteger, nullable=False)
    nightly_rate = Column(Numeric(10, 2), nullable=False)
    status = Column(
        Enum(BookingStatus, name="booking_status", create_type=False),
        nullable=False,
        default=BookingStatus.confirmed
    )
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    guest = relationship("Guest", back_populates="bookings")
    room = relationship("Room", back_populates="bookings")
    payments = relationship("Payment", back_populates="booking", cascade="all, delete-orphan")
    review = relationship("Review", back_populates="booking", uselist=False, cascade="all, delete-orphan")
    idempotency_records = relationship("PaymentIdempotency", back_populates="booking", cascade="all, delete-orphan")


class Payment(Base):
    __tablename__ = "payments"

    payment_id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.booking_id", ondelete="CASCADE"), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    method = Column(
        Enum(PaymentMethodType, name="payment_method_type", create_type=False),
        nullable=False
    )
    paid_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    booking = relationship("Booking", back_populates="payments")


class Review(Base):
    __tablename__ = "reviews"

    review_id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.booking_id", ondelete="CASCADE"), unique=True, nullable=False)
    rating = Column(SmallInteger, nullable=False)
    comments = Column(Text, nullable=True)
    reviewed_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    booking = relationship("Booking", back_populates="review")
