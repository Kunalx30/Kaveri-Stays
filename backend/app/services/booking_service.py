from datetime import date
from decimal import Decimal
from typing import List, Optional, Set
from fastapi import HTTPException, status
from sqlalchemy.dialects.postgresql import Range
from sqlalchemy.orm import Session

from app.models.property import Room, RoomType, RatePlan
from app.models.guest import Guest
from app.models.booking import Booking, BookingStatus, Payment, Review
from app.schemas.booking import BookingCreate, BookingUpdate


# Allowed State Machine Transitions
ALLOWED_TRANSITIONS = {
    BookingStatus.confirmed: {BookingStatus.checked_in, BookingStatus.cancelled, BookingStatus.no_show},
    BookingStatus.checked_in: {BookingStatus.checked_out},
    BookingStatus.checked_out: set(),
    BookingStatus.cancelled: set(),
    BookingStatus.no_show: set()
}


def validate_status_transition(current_status: BookingStatus, new_status: BookingStatus) -> None:
    """
    Validates that transition between booking statuses follows the hotel business lifecycle.
    """
    if current_status == new_status:
        return
    allowed: Set[BookingStatus] = ALLOWED_TRANSITIONS.get(current_status, set())
    if new_status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid booking status transition from '{current_status.value}' to '{new_status.value}'."
        )


def check_room_availability(
    db: Session,
    room_id: int,
    proposed_stay: Range,
    exclude_booking_id: Optional[int] = None
) -> None:
    """
    Checks for overlapping active reservations on the same room.
    Bookings in 'cancelled' or 'no_show' states do not occupy room inventory.
    Raises HTTP 409 Conflict if room is occupied.
    """
    query = db.query(Booking).filter(
        Booking.room_id == room_id,
        Booking.status.notin_([BookingStatus.cancelled, BookingStatus.no_show]),
        Booking.stay.op("&&")(proposed_stay)
    )
    if exclude_booking_id is not None:
        query = query.filter(Booking.booking_id != exclude_booking_id)

    conflict = query.first()
    if conflict:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Double booking conflict: Room {room_id} is already booked for the selected stay dates "
                f"[{proposed_stay.lower} to {proposed_stay.upper}) (Existing Booking #{conflict.booking_id})."
            )
        )


def resolve_nightly_rate(
    db: Session,
    property_id: int,
    room_type_id: int,
    check_in_date: date,
    custom_rate: Optional[Decimal] = None
) -> Decimal:
    """
    Determines the nightly rate snapshot for a booking:
    1. If a valid custom_rate is passed (by Owner/Manager), use it.
    2. Otherwise, look up active seasonal RatePlan covering the check_in_date.
    3. Fallback to any RatePlan configured for that property and room type.
    """
    if custom_rate is not None and custom_rate > 0:
        return custom_rate

    # Active seasonal rate plan
    rate_plan = db.query(RatePlan).filter(
        RatePlan.property_id == property_id,
        RatePlan.room_type_id == room_type_id,
        RatePlan.valid.op("@>")(check_in_date)
    ).first()
    if rate_plan:
        return rate_plan.nightly_rate

    # Fallback to any rate plan for this room type
    fallback = db.query(RatePlan).filter(
        RatePlan.property_id == property_id,
        RatePlan.room_type_id == room_type_id
    ).first()
    if fallback:
        return fallback.nightly_rate

    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail=(
            f"No active RatePlan found for property ID {property_id} and room type ID {room_type_id} "
            f"on check-in date {check_in_date}. Please configure a RatePlan or provide a nightly_rate."
        )
    )


def list_bookings(
    db: Session,
    guest_id: Optional[int] = None,
    property_id: Optional[int] = None,
    room_id: Optional[int] = None,
    booking_status: Optional[BookingStatus] = None,
    assigned_property_id: Optional[int] = None,
    filter_guest_id: Optional[int] = None
) -> List[Booking]:
    """
    List bookings with property-level and guest-level isolation.
    """
    query = db.query(Booking).join(Room)

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

    if room_id is not None:
        query = query.filter(Booking.room_id == room_id)

    if booking_status is not None:
        query = query.filter(Booking.status == booking_status)

    return query.order_by(Booking.booking_id.desc()).all()


def get_booking_by_id(db: Session, booking_id: int) -> Booking:
    """
    Retrieve a single booking by ID.
    Raises HTTP 404 if not found.
    """
    booking = db.query(Booking).filter(Booking.booking_id == booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Booking with ID {booking_id} not found."
        )
    return booking


def create_booking(
    db: Session,
    data: BookingCreate,
    target_guest_id: int,
    custom_nightly_rate: Optional[Decimal] = None
) -> Booking:
    """
    Create a new booking:
    1. Validates room exists (404).
    2. Validates guest exists (404).
    3. Validates occupancy limit (422).
    4. Validates room availability without overlaps (409).
    5. Resolves nightly rate snapshot.
    6. Persists booking.
    """
    # 1. Validate Room
    room = db.query(Room).filter(Room.room_id == data.room_id).first()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Room with ID {data.room_id} not found."
        )

    # 2. Validate Guest
    guest = db.query(Guest).filter(Guest.guest_id == target_guest_id).first()
    if not guest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Guest with ID {target_guest_id} not found."
        )

    # 3. Validate Room Occupancy
    room_type = db.query(RoomType).filter(RoomType.room_type_id == room.room_type_id).first()
    if room_type and data.guests_count > room_type.max_occupancy:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                f"Guest count ({data.guests_count}) exceeds maximum occupancy "
                f"of {room_type.max_occupancy} for '{room_type.name}' room."
            )
        )

    # 4. Check Availability
    proposed_stay = Range(data.check_in_date, data.check_out_date, bounds="[)")
    check_room_availability(db, data.room_id, proposed_stay)

    # 5. Resolve Nightly Rate Snapshot
    resolved_rate = resolve_nightly_rate(
        db,
        property_id=room.property_id,
        room_type_id=room.room_type_id,
        check_in_date=data.check_in_date,
        custom_rate=custom_nightly_rate
    )

    new_booking = Booking(
        guest_id=target_guest_id,
        room_id=data.room_id,
        stay=proposed_stay,
        guests_count=data.guests_count,
        nightly_rate=resolved_rate,
        status=BookingStatus.confirmed,
        notes=data.notes
    )
    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)
    return new_booking


def update_booking(
    db: Session,
    booking_id: int,
    data: BookingUpdate
) -> Booking:
    """
    Partially update a booking.
    - Validates status transition if status is updated.
    - Re-validates room availability if stay dates or room_id change.
    - Re-validates occupancy limits.
    """
    booking = get_booking_by_id(db, booking_id)

    # Status transition check
    if data.status is not None:
        validate_status_transition(booking.status, data.status)
        booking.status = data.status

    # Block stay/room modification on terminal statuses
    if booking.status in (BookingStatus.checked_out, BookingStatus.cancelled, BookingStatus.no_show):
        if (data.check_in_date is not None or 
            data.check_out_date is not None or 
            data.room_id is not None):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot modify dates or room for a {booking.status.value} booking."
            )

    # Target Room
    target_room_id = data.room_id if data.room_id is not None else booking.room_id
    target_room = db.query(Room).filter(Room.room_id == target_room_id).first()
    if not target_room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Room with ID {target_room_id} not found."
        )

    # Target Occupancy
    target_guests_count = data.guests_count if data.guests_count is not None else booking.guests_count
    room_type = db.query(RoomType).filter(RoomType.room_type_id == target_room.room_type_id).first()
    if room_type and target_guests_count > room_type.max_occupancy:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Guest count ({target_guests_count}) exceeds maximum occupancy of {room_type.max_occupancy}."
        )

    target_from = data.check_in_date if data.check_in_date is not None else booking.stay.lower
    target_to = data.check_out_date if data.check_out_date is not None else booking.stay.upper

    if target_from >= target_to:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="check_in_date must be strictly earlier than check_out_date."
        )

    proposed_stay = Range(target_from, target_to, bounds="[)")

    # If dates or room changed, check availability
    if (target_room_id != booking.room_id or
        target_from != booking.stay.lower or
        target_to != booking.stay.upper):
        if booking.status not in (BookingStatus.cancelled, BookingStatus.no_show):
            check_room_availability(db, target_room_id, proposed_stay, exclude_booking_id=booking_id)

    booking.room_id = target_room_id
    booking.stay = proposed_stay
    booking.guests_count = target_guests_count

    if data.notes is not None:
        booking.notes = data.notes

    db.commit()
    db.refresh(booking)
    return booking


def cancel_booking(db: Session, booking_id: int) -> Booking:
    """
    Cancel an active booking (confirmed -> cancelled).
    Releases room inventory without deleting historical payment/booking records.
    """
    booking = get_booking_by_id(db, booking_id)
    validate_status_transition(booking.status, BookingStatus.cancelled)
    booking.status = BookingStatus.cancelled
    db.commit()
    db.refresh(booking)
    return booking


def delete_booking(db: Session, booking_id: int) -> None:
    """
    Safely deletes an unpaid, unreviewed booking (e.g. test booking).
    Blocks deletion (409 Conflict) if payment or review records exist.
    """
    booking = get_booking_by_id(db, booking_id)

    payment_count = db.query(Payment).filter(Payment.booking_id == booking_id).count()
    if payment_count > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Cannot delete booking ID {booking_id} because it has {payment_count} associated payment(s). "
                "Cancel the reservation instead to preserve financial audit trail."
            )
        )

    review_count = db.query(Review).filter(Review.booking_id == booking_id).count()
    if review_count > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot delete booking ID {booking_id} because it has an associated guest review."
        )

    db.delete(booking)
    db.commit()
