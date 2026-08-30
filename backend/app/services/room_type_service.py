from typing import List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.property import RoomType, Room, RatePlan
from app.schemas.room_type import RoomTypeCreate, RoomTypeUpdate


def list_all_room_types(db: Session) -> List[RoomType]:
    """
    Retrieve all global room types.
    """
    return db.query(RoomType).order_by(RoomType.room_type_id.asc()).all()


def get_room_type_by_id(db: Session, room_type_id: int) -> RoomType:
    """
    Retrieve a single room type by its ID.
    Raises HTTP 404 if the room type does not exist.
    """
    room_type_obj = db.query(RoomType).filter(RoomType.room_type_id == room_type_id).first()
    if not room_type_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Room type with ID {room_type_id} not found."
        )
    return room_type_obj


def create_room_type(db: Session, data: RoomTypeCreate) -> RoomType:
    """
    Creates a new global room type.
    - Validates that room type name is unique (case-insensitive).
    - Returns the created room type.
    """
    clean_name = data.name.strip()

    # Check for name uniqueness
    existing = db.query(RoomType).filter(
        func.lower(func.trim(RoomType.name)) == clean_name.lower()
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A room type named '{clean_name}' already exists."
        )

    new_room_type = RoomType(
        name=clean_name,
        max_occupancy=data.max_occupancy
    )
    db.add(new_room_type)
    db.commit()
    db.refresh(new_room_type)
    return new_room_type


def update_room_type(db: Session, room_type_id: int, data: RoomTypeUpdate) -> RoomType:
    """
    Updates an existing room type.
    - Checks room type existence (404).
    - Checks name uniqueness if name is modified (409).
    - Modifies and commits changes.
    """
    room_type_obj = get_room_type_by_id(db, room_type_id)

    if data.name is not None:
        clean_name = data.name.strip()
        if clean_name.lower() != room_type_obj.name.lower():
            # Check for conflict with other room types
            existing = db.query(RoomType).filter(
                func.lower(func.trim(RoomType.name)) == clean_name.lower(),
                RoomType.room_type_id != room_type_id
            ).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Another room type named '{clean_name}' already exists."
                )
        room_type_obj.name = clean_name

    if data.max_occupancy is not None:
        room_type_obj.max_occupancy = data.max_occupancy

    db.commit()
    db.refresh(room_type_obj)
    return room_type_obj


def delete_room_type(db: Session, room_type_id: int) -> None:
    """
    Safely deletes a room type only if no dependent records exist.
    - Checks room type existence (404).
    - Prevents deletion if rooms are associated (409 Conflict).
    - Prevents deletion if rate plans are associated (409 Conflict).
    """
    room_type_obj = get_room_type_by_id(db, room_type_id)

    # 1. Check for associated rooms
    room_count = db.query(Room).filter(Room.room_type_id == room_type_id).count()
    if room_count > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot delete room type '{room_type_obj.name}' (ID: {room_type_id}) because it is referenced by {room_count} existing room(s)."
        )

    # 2. Check for associated rate plans
    rate_plan_count = db.query(RatePlan).filter(RatePlan.room_type_id == room_type_id).count()
    if rate_plan_count > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot delete room type '{room_type_obj.name}' (ID: {room_type_id}) because it is referenced by {rate_plan_count} existing rate plan(s)."
        )

    db.delete(room_type_obj)
    db.commit()
