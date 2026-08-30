from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import require_roles
from app.models import User, UserRole
from app.schemas.room_type import (
    RoomTypeCreate,
    RoomTypeUpdate,
    RoomTypeResponse
)
from app.services import room_type_service

router = APIRouter(prefix="/room-types", tags=["Room Types"])


@router.get("", response_model=List[RoomTypeResponse])
def list_room_types(db: Session = Depends(get_db)):
    """
    List all room types across the system.
    Public endpoint.
    """
    return room_type_service.list_all_room_types(db)


@router.get("/{room_type_id}", response_model=RoomTypeResponse)
def get_room_type(
    room_type_id: int,
    db: Session = Depends(get_db)
):
    """
    Retrieve details for a single room type by ID.
    Public endpoint.
    """
    return room_type_service.get_room_type_by_id(db, room_type_id)


@router.post("", response_model=RoomTypeResponse, status_code=status.HTTP_201_CREATED)
def create_room_type(
    data: RoomTypeCreate,
    current_user: User = Depends(require_roles([UserRole.owner])),
    db: Session = Depends(get_db)
):
    """
    Create a new global room type.
    - Strictly restricted to **Owner** role.
    """
    return room_type_service.create_room_type(db, data)


@router.patch("/{room_type_id}", response_model=RoomTypeResponse)
def update_room_type(
    room_type_id: int,
    data: RoomTypeUpdate,
    current_user: User = Depends(require_roles([UserRole.owner])),
    db: Session = Depends(get_db)
):
    """
    Update an existing room type.
    - Strictly restricted to **Owner** role.
    """
    return room_type_service.update_room_type(db, room_type_id, data)


@router.delete("/{room_type_id}", status_code=status.HTTP_200_OK)
def delete_room_type(
    room_type_id: int,
    current_user: User = Depends(require_roles([UserRole.owner])),
    db: Session = Depends(get_db)
):
    """
    Delete a room type.
    - Strictly restricted to **Owner** role.
    - Blocked (409 Conflict) if referenced by existing rooms or rate plans.
    """
    room_type_service.delete_room_type(db, room_type_id)
    return {"message": f"Room type with ID {room_type_id} successfully deleted."}
