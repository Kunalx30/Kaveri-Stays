from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.booking import Booking, BookingStatus, Payment
from app.models.property import Room
from app.models.auth import PaymentIdempotency
from app.schemas.payment import PaymentCreate, PaymentSummaryResponse, PaymentResponse


def calculate_booking_balance(db: Session, booking: Booking):
    """
    Computes total booking amount, total payments made, and remaining balance.
    """
    total_amount = booking.total_amount
    total_paid = db.query(
        func.coalesce(func.sum(Payment.amount), Decimal("0.00"))
    ).filter(Payment.booking_id == booking.booking_id).scalar()
    
    # Cast to Decimal
    total_paid = Decimal(str(total_paid))
    remaining = total_amount - total_paid
    is_fully_paid = remaining <= Decimal("0.00")

    return total_amount, total_paid, remaining, is_fully_paid


def get_payment_summary(db: Session, booking_id: int) -> PaymentSummaryResponse:
    """
    Retrieve payment breakdown and balance for a booking.
    """
    booking = db.query(Booking).filter(Booking.booking_id == booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Booking with ID {booking_id} not found."
        )

    total_amount, total_paid, remaining, is_fully_paid = calculate_booking_balance(db, booking)
    payments = db.query(Payment).filter(Payment.booking_id == booking_id).order_by(Payment.paid_at.asc()).all()

    return PaymentSummaryResponse(
        booking_id=booking_id,
        total_booking_amount=total_amount,
        total_paid=total_paid,
        remaining_balance=max(Decimal("0.00"), remaining),
        is_fully_paid=is_fully_paid,
        payments=[PaymentResponse.model_validate(p) for p in payments]
    )


def get_payment_by_id(db: Session, payment_id: int) -> Payment:
    """
    Retrieve a single payment by ID.
    Raises HTTP 404 if not found.
    """
    payment = db.query(Payment).filter(Payment.payment_id == payment_id).first()
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payment with ID {payment_id} not found."
        )
    return payment


def list_payments(
    db: Session,
    booking_id: Optional[int] = None,
    property_id: Optional[int] = None,
    guest_id: Optional[int] = None,
    assigned_property_id: Optional[int] = None,
    filter_guest_id: Optional[int] = None
) -> List[Payment]:
    """
    List payments with property-level and guest-level isolation.
    """
    query = db.query(Payment).join(Booking).join(Room)

    # Manager / Staff property isolation
    if assigned_property_id is not None:
        query = query.filter(Room.property_id == assigned_property_id)
    elif property_id is not None:
        query = query.filter(Room.property_id == property_id)

    # Guest isolation
    if filter_guest_id is not None:
        query = query.filter(Booking.guest_id == filter_guest_id)
    elif guest_id is not None:
        query = query.filter(Booking.guest_id == guest_id)

    if booking_id is not None:
        query = query.filter(Payment.booking_id == booking_id)

    return query.order_by(Payment.payment_id.desc()).all()


def create_payment(
    db: Session,
    data: PaymentCreate,
    user_id: int,
    idempotency_key: Optional[str] = None
) -> Payment:
    """
    Creates a new payment record with idempotency handling and balance validation.
    """
    clean_idemp_key = (idempotency_key or data.idempotency_key or "").strip() or None

    # 1. Idempotency Check
    if clean_idemp_key:
        existing_idemp = db.query(PaymentIdempotency).filter(
            PaymentIdempotency.idempotency_key == clean_idemp_key
        ).first()

        if existing_idemp:
            # Check for parameter conflict
            if (existing_idemp.booking_id != data.booking_id or
                Decimal(str(existing_idemp.amount)) != data.amount or
                existing_idemp.method != data.method):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Idempotency key was previously used with conflicting payment parameters."
                )

            if existing_idemp.status == "completed" and existing_idemp.payment_id:
                existing_payment = db.query(Payment).filter(
                    Payment.payment_id == existing_idemp.payment_id
                ).first()
                if existing_payment:
                    return existing_payment

            if existing_idemp.status == "in_flight":
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="A payment with this idempotency key is currently in progress."
                )

    # 2. Validate Booking Existence
    booking = db.query(Booking).filter(Booking.booking_id == data.booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Booking with ID {data.booking_id} not found."
        )

    # 3. Check Booking Status
    if booking.status in (BookingStatus.cancelled, BookingStatus.no_show):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot process payment for a reservation in '{booking.status.value}' status."
        )

    # 4. Check Balance and Prevent Overpayment
    total_amount, total_paid, remaining, is_fully_paid = calculate_booking_balance(db, booking)

    if is_fully_paid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Booking #{data.booking_id} is already fully paid (Total: INR {total_amount:.2f}, Paid: INR {total_paid:.2f})."
        )

    if data.amount > remaining:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Payment amount INR {data.amount:.2f} exceeds remaining balance of INR {remaining:.2f} "
                f"(Booking Total: INR {total_amount:.2f}, Already Paid: INR {total_paid:.2f})."
            )
        )

    # 5. Insert Payment Record
    new_payment = Payment(
        booking_id=data.booking_id,
        amount=data.amount,
        method=data.method
    )
    db.add(new_payment)
    db.flush()  # Populates new_payment.payment_id

    # 6. Save Idempotency Record if key provided
    if clean_idemp_key:
        expires_at = datetime.now(timezone.utc) + timedelta(days=1)
        new_idemp = PaymentIdempotency(
            idempotency_key=clean_idemp_key,
            user_id=user_id,
            booking_id=data.booking_id,
            payment_id=new_payment.payment_id,
            amount=data.amount,
            method=data.method,
            status="completed",
            expires_at=expires_at
        )
        db.add(new_idemp)

    db.commit()
    db.refresh(new_payment)
    return new_payment
