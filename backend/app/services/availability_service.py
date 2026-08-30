from datetime import date
from decimal import Decimal
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.dialects.postgresql import Range
from sqlalchemy.orm import Session

from app.models.booking import Booking, BookingStatus
from app.models.property import Property, Room, RoomType, RatePlan
from app.schemas.availability import AvailabilityResponse, AvailableRoomResponse


def _resolve_rate_for_room(
    db: Session,
    property_id: int,
    room_type_id: int,
    check_in: date
) -> Optional[Decimal]:
    """
    Look up the applicable nightly rate for the given property/room-type/check-in date.
    Uses the same @> containment logic as booking_service.resolve_nightly_rate,
    but returns None instead of raising an error when no rate plan is found.
    """
    # Try to find a rate plan that covers the check-in date
    rate_plan = db.query(RatePlan).filter(
        RatePlan.property_id == property_id,
        RatePlan.room_type_id == room_type_id,
        RatePlan.valid.op("@>")(check_in)
    ).first()
    if rate_plan:
        return rate_plan.nightly_rate

    # Fallback: return any rate plan for this property + room type (most recent or first)
    fallback = db.query(RatePlan).filter(
        RatePlan.property_id == property_id,
        RatePlan.room_type_id == room_type_id
    ).first()
    return fallback.nightly_rate if fallback else None


def search_available_rooms(
    db: Session,
    check_in: date,
    check_out: date,
    guests_count: int,
    property_id: Optional[int] = None,
    room_type_id: Optional[int] = None,
    assigned_property_id: Optional[int] = None
) -> AvailabilityResponse:
    """
    Return all rooms that are available for the requested stay period.

    Availability Rules:
    1. Room must belong to the requested property (if specified).
    2. Room's room_type.max_occupancy must be >= guests_count.
    3. Room must not have an existing ACTIVE booking that overlaps with the requested dates.
       Active = any status except 'cancelled' and 'no_show'.
       This mirrors the same logic used in booking_service.check_room_availability.

    Property isolation:
    - If assigned_property_id is set (Manager/Staff), all results are restricted to that property.
    - This takes precedence over any client-supplied property_id filter.
    """
    # Validate property exists if requested
    effective_property_id = property_id
    if assigned_property_id is not None:
        # Manager/Staff: override any client-supplied property_id with their assigned one
        effective_property_id = assigned_property_id

    if effective_property_id is not None:
        prop = db.query(Property).filter(Property.property_id == effective_property_id).first()
        if not prop:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Property with ID {effective_property_id} not found."
            )

    # Validate room_type exists if requested
    if room_type_id is not None:
        rt = db.query(RoomType).filter(RoomType.room_type_id == room_type_id).first()
        if not rt:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Room type with ID {room_type_id} not found."
            )

    # Build base room query with joins for property and room_type data
    query = db.query(Room).join(RoomType, Room.room_type_id == RoomType.room_type_id).join(
        Property, Room.property_id == Property.property_id
    )

    # Property filter
    if effective_property_id is not None:
        query = query.filter(Room.property_id == effective_property_id)

    # Room type filter
    if room_type_id is not None:
        query = query.filter(Room.room_type_id == room_type_id)

    # Occupancy filter: room must accommodate the requested guest count
    query = query.filter(RoomType.max_occupancy >= guests_count)

    all_candidate_rooms = query.all()

    # Build the proposed stay Range (half-open [check_in, check_out))
    proposed_stay = Range(check_in, check_out, bounds="[)")

    # Find rooms that have a conflicting active booking
    # (same logic as booking_service.check_room_availability)
    conflicting_room_ids = set(
        row[0] for row in db.query(Booking.room_id).filter(
            Booking.room_id.in_([r.room_id for r in all_candidate_rooms]),
            Booking.status.notin_([BookingStatus.cancelled, BookingStatus.no_show]),
            Booking.stay.op("&&")(proposed_stay)
        ).all()
    )

    # Build response for each available room
    available_rooms: List[AvailableRoomResponse] = []
    for room in all_candidate_rooms:
        if room.room_id in conflicting_room_ids:
            continue   # Room is occupied for the requested period

        nightly_rate = _resolve_rate_for_room(
            db,
            property_id=room.property_id,
            room_type_id=room.room_type_id,
            check_in=check_in
        )

        available_rooms.append(AvailableRoomResponse(
            room_id=room.room_id,
            room_number=room.room_number,
            property_id=room.property_id,
            property_name=room.property.name,
            property_city=room.property.city,
            property_star_rating=room.property.star_rating,
            room_type_id=room.room_type_id,
            room_type_name=room.room_type.name,
            max_occupancy=room.room_type.max_occupancy,
            nightly_rate=nightly_rate
        ))

    # Sort: by property, then by room_type, then by room_number
    available_rooms.sort(key=lambda r: (r.property_id, r.room_type_id, r.room_number))

    return AvailabilityResponse(
        check_in=check_in,
        check_out=check_out,
        guests_count=guests_count,
        total_available=len(available_rooms),
        rooms=available_rooms
    )
