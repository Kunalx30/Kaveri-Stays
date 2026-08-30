from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import (
    get_current_user,
    require_roles,
    check_property_access
)
from app.models import User, UserRole
from app.schemas.room import RoomCreate, RoomUpdate, RoomResponse
from app.services import room_service

router = APIRouter(prefix="/rooms", tags=["Rooms"])


@router.get("", response_model=List[RoomResponse])
def list_rooms(
    property_id: Optional[int] = Query(None, gt=0, description="Filter by property ID"),
    room_type_id: Optional[int] = Query(None, gt=0, description="Filter by room type ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List rooms. Room management is not a public/guest-facing feature.

    - **Owner**: Can see all rooms; optionally filter by property_id or room_type_id.
    - **Manager**: Sees only rooms belonging to their assigned property.
    - **Staff**: Sees only rooms belonging to their assigned property.
    - **Guest**: Access denied (403).
    """
    if current_user.role == UserRole.guest:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Guests do not have room management access."
        )

    # Manager/Staff: strictly scoped to their assigned property
    assigned_property_id = None
    if current_user.role in (UserRole.manager, UserRole.staff):
        assigned_property_id = current_user.property_id

    return room_service.list_rooms(
        db,
        property_id=property_id,
        room_type_id=room_type_id,
        assigned_property_id=assigned_property_id
    )


@router.get("/{room_id}", response_model=RoomResponse)
def get_room(
    room_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a single room by ID.

    - **Owner**: Can access any room.
    - **Manager / Staff**: Can only access rooms belonging to their assigned property.
    - **Guest**: Access denied (403).
    """
    if current_user.role == UserRole.guest:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Guests do not have room management access."
        )

    room = room_service.get_room_by_id(db, room_id)

    # Property-level isolation for Manager/Staff
    if current_user.role in (UserRole.manager, UserRole.staff):
        check_property_access(current_user, room.property_id)

    return room


@router.post("", response_model=RoomResponse, status_code=status.HTTP_201_CREATED)
def create_room(
    data: RoomCreate,
    current_user: User = Depends(require_roles([UserRole.owner, UserRole.manager])),
    db: Session = Depends(get_db)
):
    """
    Create a new room.

    - **Owner**: Can create rooms for any property.
    - **Manager**: Can only create rooms for their assigned property.
    - **Staff / Guest**: Access denied (403).
    """
    # Manager: enforce property isolation on the target property_id in the request body
    if current_user.role == UserRole.manager:
        check_property_access(current_user, data.property_id)

    return room_service.create_room(db, data)


@router.patch("/{room_id}", response_model=RoomResponse)
def update_room(
    room_id: int,
    data: RoomUpdate,
    current_user: User = Depends(require_roles([UserRole.owner, UserRole.manager])),
    db: Session = Depends(get_db)
):
    """
    Partially update a room (room_number and/or room_type_id).
    property_id cannot be changed to prevent data integrity issues with bookings.

    - **Owner**: Can update any room.
    - **Manager**: Can only update rooms in their assigned property.
    - **Staff / Guest**: Access denied (403).
    """
    room = room_service.get_room_by_id(db, room_id)

    # Manager: enforce property-level isolation
    if current_user.role == UserRole.manager:
        check_property_access(current_user, room.property_id)

    return room_service.update_room(db, room_id, data)


@router.delete("/{room_id}", status_code=status.HTTP_200_OK)
def delete_room(
    room_id: int,
    current_user: User = Depends(require_roles([UserRole.owner])),
    db: Session = Depends(get_db)
):
    """
    Delete a room. Strictly restricted to **Owner** role.
    Returns 409 Conflict if the room has any associated bookings.
    """
    room_service.delete_room(db, room_id)
    return {"message": f"Room with ID {room_id} successfully deleted."}
