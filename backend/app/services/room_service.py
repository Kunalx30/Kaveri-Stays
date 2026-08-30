from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.property import Room, Property, RoomType
from app.models.booking import Booking
from app.schemas.room import RoomCreate, RoomUpdate


def _get_property_or_404(db: Session, property_id: int) -> Property:
    prop = db.query(Property).filter(Property.property_id == property_id).first()
    if not prop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Property with ID {property_id} not found."
        )
    return prop


def _get_room_type_or_404(db: Session, room_type_id: int) -> RoomType:
    rt = db.query(RoomType).filter(RoomType.room_type_id == room_type_id).first()
    if not rt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Room type with ID {room_type_id} not found."
        )
    return rt


def list_rooms(
    db: Session,
    property_id: Optional[int] = None,
    room_type_id: Optional[int] = None,
    assigned_property_id: Optional[int] = None
) -> List[Room]:
    """
    List rooms.
    - If assigned_property_id is set (Manager/Staff), restrict to that property only.
    - Otherwise apply optional property_id / room_type_id filters for Owner.
    """
    query = db.query(Room)

    if assigned_property_id is not None:
        # Manager/Staff: strict property isolation
        query = query.filter(Room.property_id == assigned_property_id)
    else:
        # Owner: optional filters
        if property_id is not None:
            query = query.filter(Room.property_id == property_id)
        if room_type_id is not None:
            query = query.filter(Room.room_type_id == room_type_id)

    return query.order_by(Room.room_id.asc()).all()


def get_room_by_id(db: Session, room_id: int) -> Room:
    """
    Retrieve a single room by ID.
    Raises HTTP 404 if not found.
    """
    room = db.query(Room).filter(Room.room_id == room_id).first()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Room with ID {room_id} not found."
        )
    return room


def create_room(db: Session, data: RoomCreate) -> Room:
    """
    Create a new room.
    - Validates property exists (404).
    - Validates room type exists (404).
    - Validates room_number uniqueness within the property (409).
    """
    # FK existence checks
    _get_property_or_404(db, data.property_id)
    _get_room_type_or_404(db, data.room_type_id)

    clean_number = data.room_number.strip()

    # Application-level duplicate check (database also has a UNIQUE constraint as backup)
    existing = db.query(Room).filter(
        Room.property_id == data.property_id,
        func.trim(Room.room_number) == clean_number
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Room number '{clean_number}' already exists in property ID {data.property_id}."
        )

    new_room = Room(
        property_id=data.property_id,
        room_number=clean_number,
        room_type_id=data.room_type_id
    )
    db.add(new_room)
    db.commit()
    db.refresh(new_room)
    return new_room


def update_room(db: Session, room_id: int, data: RoomUpdate) -> Room:
    """
    Partially update a room.
    - property_id cannot be changed (excluded from schema).
    - room_number uniqueness is validated within the existing property.
    - room_type_id is validated to exist.
    """
    room = get_room_by_id(db, room_id)

    if data.room_number is not None:
        clean_number = data.room_number.strip()
        if clean_number != room.room_number:
            # Check uniqueness within the same property
            conflict = db.query(Room).filter(
                Room.property_id == room.property_id,
                func.trim(Room.room_number) == clean_number,
                Room.room_id != room_id
            ).first()
            if conflict:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Room number '{clean_number}' already exists in property ID {room.property_id}."
                )
        room.room_number = clean_number

    if data.room_type_id is not None:
        _get_room_type_or_404(db, data.room_type_id)
        room.room_type_id = data.room_type_id

    db.commit()
    db.refresh(room)
    return room


def delete_room(db: Session, room_id: int) -> None:
    """
    Safely delete a room.
    - Raises 404 if room not found.
    - Raises 409 Conflict if any bookings reference this room
      (bookings.room_id has ON DELETE RESTRICT in PostgreSQL).
    """
    room = get_room_by_id(db, room_id)

    booking_count = db.query(Booking).filter(Booking.room_id == room_id).count()
    if booking_count > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Cannot delete room '{room.room_number}' (ID: {room_id}) because "
                f"it is referenced by {booking_count} existing booking(s). "
                "Historical booking data must not be destroyed."
            )
        )

    db.delete(room)
    db.commit()
