from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import (
    get_current_user,
    require_roles,
    check_property_access
)
from app.models import User, UserRole, BookingStatus
from app.models.property import Room
from app.schemas.booking import (
    BookingCreate,
    BookingUpdate,
    BookingResponse
)
from app.services import booking_service

router = APIRouter(prefix="/bookings", tags=["Bookings"])


@router.get("", response_model=List[BookingResponse])
def list_bookings(
    property_id: Optional[int] = Query(None, gt=0, description="Filter by property ID"),
    guest_id: Optional[int] = Query(None, gt=0, description="Filter by guest ID"),
    room_id: Optional[int] = Query(None, gt=0, description="Filter by room ID"),
    booking_status: Optional[BookingStatus] = Query(None, alias="status", description="Filter by status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List bookings with property-level and guest-level isolation:
    - **Guest**: Strictly limited to their own bookings.
    - **Manager / Staff**: Strictly limited to bookings within their assigned property.
    - **Owner**: Can list all bookings across all properties.
    """
    assigned_property_id = None
    filter_guest_id = None

    if current_user.role == UserRole.guest:
        if not current_user.guest_id:
            return []
        filter_guest_id = current_user.guest_id
    elif current_user.role in (UserRole.manager, UserRole.staff):
        assigned_property_id = current_user.property_id

    return booking_service.list_bookings(
        db,
        guest_id=guest_id,
        property_id=property_id,
        room_id=room_id,
        booking_status=booking_status,
        assigned_property_id=assigned_property_id,
        filter_guest_id=filter_guest_id
    )


@router.get("/{booking_id}", response_model=BookingResponse)
def get_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve a single booking by ID:
    - **Guest**: Can only access their own booking (403 Forbidden otherwise).
    - **Manager / Staff**: Can only access bookings belonging to their assigned property (403 Forbidden otherwise).
    - **Owner**: Can access any booking.
    """
    booking = booking_service.get_booking_by_id(db, booking_id)

    if current_user.role == UserRole.guest:
        if booking.guest_id != current_user.guest_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You can only view your own bookings."
            )
    elif current_user.role in (UserRole.manager, UserRole.staff):
        check_property_access(current_user, booking.room.property_id)

    return booking


@router.post("", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def create_booking(
    data: BookingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new booking:
    - **Guest**: Automatically assigned their own guest_id. Cannot create for others.
    - **Manager**: Can create bookings for rooms within their assigned property.
    - **Owner**: Can create bookings for any property and any guest.
    """
    # 1. Determine target guest_id
    if current_user.role == UserRole.guest:
        if not current_user.guest_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User account has no associated guest profile."
            )
        if data.guest_id and data.guest_id != current_user.guest_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Guests cannot create bookings for other guests."
            )
        target_guest_id = current_user.guest_id
        custom_rate = None  # Guests cannot override pricing
    else:
        if not data.guest_id:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="guest_id is required when creating a booking as staff, manager, or owner."
            )
        target_guest_id = data.guest_id
        custom_rate = data.nightly_rate

    # 2. Check property access if Manager / Staff
    if current_user.role in (UserRole.manager, UserRole.staff):
        room = db.query(Room).filter(Room.room_id == data.room_id).first()
        if not room:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Room with ID {data.room_id} not found.")
        check_property_access(current_user, room.property_id)

    return booking_service.create_booking(
        db,
        data=data,
        target_guest_id=target_guest_id,
        custom_nightly_rate=custom_rate
    )


@router.patch("/{booking_id}", response_model=BookingResponse)
def update_booking(
    booking_id: int,
    data: BookingUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Partially update a booking:
    - **Guest**: Can update notes or status to 'cancelled' for their own booking.
    - **Manager**: Can update bookings within their assigned property.
    - **Owner**: Can update any booking.
    """
    booking = booking_service.get_booking_by_id(db, booking_id)

    if current_user.role == UserRole.guest:
        if booking.guest_id != current_user.guest_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You can only update your own bookings."
            )
        # Guests cannot execute operational status transitions like checked_in or checked_out
        if data.status and data.status not in (BookingStatus.cancelled,):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Guests can only cancel bookings, not change operational status."
            )
        # Guests cannot reassign room
        if data.room_id and data.room_id != booking.room_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Guests cannot reassign rooms directly."
            )
    elif current_user.role in (UserRole.manager, UserRole.staff):
        check_property_access(current_user, booking.room.property_id)
        # If room_id change requested, verify new room belongs to same property
        if data.room_id and data.room_id != booking.room_id:
            new_room = db.query(Room).filter(Room.room_id == data.room_id).first()
            if not new_room:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Room with ID {data.room_id} not found.")
            check_property_access(current_user, new_room.property_id)

    return booking_service.update_booking(db, booking_id, data)


@router.post("/{booking_id}/cancel", response_model=BookingResponse)
def cancel_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Cancel an active booking.
    - Releases room inventory for the stay dates.
    - Preserves historical booking record.
    """
    booking = booking_service.get_booking_by_id(db, booking_id)

    if current_user.role == UserRole.guest:
        if booking.guest_id != current_user.guest_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You can only cancel your own bookings."
            )
    elif current_user.role in (UserRole.manager, UserRole.staff):
        check_property_access(current_user, booking.room.property_id)

    return booking_service.cancel_booking(db, booking_id)


@router.delete("/{booking_id}", status_code=status.HTTP_200_OK)
def delete_booking(
    booking_id: int,
    current_user: User = Depends(require_roles([UserRole.owner])),
    db: Session = Depends(get_db)
):
    """
    Safely delete an unpaid, unreviewed booking.
    - Owner only.
    - Returns 409 Conflict if payments or reviews exist.
    """
    booking_service.delete_booking(db, booking_id)
    return {"message": f"Booking with ID {booking_id} successfully deleted."}
