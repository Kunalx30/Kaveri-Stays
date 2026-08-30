from typing import List, Optional
from fastapi import APIRouter, Depends, Header, Query, status, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import (
    get_current_user,
    check_property_access
)
from app.models import User, UserRole
from app.models.booking import Booking
from app.schemas.payment import (
    PaymentCreate,
    PaymentResponse,
    PaymentSummaryResponse
)
from app.services import payment_service

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.get("", response_model=List[PaymentResponse])
def list_payments(
    booking_id: Optional[int] = Query(None, gt=0, description="Filter payments by booking ID"),
    property_id: Optional[int] = Query(None, gt=0, description="Filter payments by property ID"),
    guest_id: Optional[int] = Query(None, gt=0, description="Filter payments by guest ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List payments with role-based and property/guest isolation:
    - **Guest**: Can only list payments for their own bookings.
    - **Manager / Staff**: Can only list payments for bookings within their assigned property.
    - **Owner**: Can list all payments across all properties.
    """
    assigned_property_id = None
    filter_guest_id = None

    if current_user.role == UserRole.guest:
        if not current_user.guest_id:
            return []
        filter_guest_id = current_user.guest_id
    elif current_user.role in (UserRole.manager, UserRole.staff):
        assigned_property_id = current_user.property_id

    return payment_service.list_payments(
        db,
        booking_id=booking_id,
        property_id=property_id,
        guest_id=guest_id,
        assigned_property_id=assigned_property_id,
        filter_guest_id=filter_guest_id
    )


@router.get("/booking/{booking_id}/summary", response_model=PaymentSummaryResponse)
def get_booking_payment_summary(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve payment breakdown and remaining balance for a specific booking.
    """
    booking = db.query(Booking).filter(Booking.booking_id == booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Booking with ID {booking_id} not found."
        )

    if current_user.role == UserRole.guest:
        if booking.guest_id != current_user.guest_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You can only view payments for your own bookings."
            )
    elif current_user.role in (UserRole.manager, UserRole.staff):
        check_property_access(current_user, booking.room.property_id)

    return payment_service.get_payment_summary(db, booking_id)


@router.get("/{payment_id}", response_model=PaymentResponse)
def get_payment(
    payment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve a single payment record by ID:
    - **Guest**: Can only access payments for their own bookings.
    - **Manager / Staff**: Can only access payments for their assigned property's bookings.
    - **Owner**: Can access any payment record.
    """
    payment = payment_service.get_payment_by_id(db, payment_id)

    if current_user.role == UserRole.guest:
        if payment.booking.guest_id != current_user.guest_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You can only view payments for your own bookings."
            )
    elif current_user.role in (UserRole.manager, UserRole.staff):
        check_property_access(current_user, payment.booking.room.property_id)

    return payment


@router.post("", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def create_payment(
    data: PaymentCreate,
    idempotency_key_header: Optional[str] = Header(None, alias="Idempotency-Key"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Process a payment for a booking with idempotency support and balance validation:
    - **Guest**: Can only pay for their own booking.
    - **Manager / Staff**: Can record payments for bookings in their assigned property.
    - **Owner**: Can record payments for any booking.
    """
    # 1. Authorize booking access
    booking = db.query(Booking).filter(Booking.booking_id == data.booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Booking with ID {data.booking_id} not found."
        )

    if current_user.role == UserRole.guest:
        if booking.guest_id != current_user.guest_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You can only make payments for your own bookings."
            )
    elif current_user.role in (UserRole.manager, UserRole.staff):
        check_property_access(current_user, booking.room.property_id)

    effective_idemp_key = idempotency_key_header or data.idempotency_key

    return payment_service.create_payment(
        db=db,
        data=data,
        user_id=current_user.user_id,
        idempotency_key=effective_idemp_key
    )
