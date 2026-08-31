from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import (
    get_current_user,
    get_optional_current_user,
    require_roles,
    check_property_access
)
from app.models import User, UserRole
from app.schemas.property import (
    PropertyCreate,
    PropertyUpdate,
    PropertyResponse
)
from app.services import property_service

router = APIRouter(prefix="/properties", tags=["Properties"])


@router.get("", response_model=List[PropertyResponse])
def list_properties(
    city: Optional[str] = Query(None, description="Filter properties by city name"),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    List properties according to user role:
    - **Owner** & **Public / Guest**: Returns all properties (or filtered by city).
    - **Manager** & **Staff**: Returns strictly their assigned property.
    """
    assigned_property_id = None
    if current_user and current_user.role in (UserRole.manager, UserRole.staff):
        assigned_property_id = current_user.property_id

    return property_service.list_all_properties(
        db,
        city=city,
        assigned_property_id=assigned_property_id
    )


@router.get("/{property_id}", response_model=PropertyResponse)
def get_property(
    property_id: int,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve details for a specific property by ID.
    - Owner & Public & Guests can view any property.
    - Authenticated Manager & Staff are restricted to their assigned property.
    """
    if current_user and current_user.role in (UserRole.manager, UserRole.staff):
        check_property_access(current_user, property_id)

    return property_service.get_property_by_id(db, property_id)


@router.post("", response_model=PropertyResponse, status_code=status.HTTP_201_CREATED)
def create_property(
    data: PropertyCreate,
    current_user: User = Depends(require_roles([UserRole.owner])),
    db: Session = Depends(get_db)
):
    """
    Create a new property.
    - Strictly restricted to **Owner** role.
    """
    return property_service.create_property(db, data)


@router.patch("/{property_id}", response_model=PropertyResponse)
def update_property(
    property_id: int,
    data: PropertyUpdate,
    current_user: User = Depends(require_roles([UserRole.owner, UserRole.manager])),
    db: Session = Depends(get_db)
):
    """
    Update a property.
    - **Owner**: Can update any property.
    - **Manager**: Can only update their assigned property.
    - **Staff** & **Guest**: Access denied (403).
    """
    check_property_access(current_user, property_id)
    return property_service.update_property(db, property_id, data)


@router.delete("/{property_id}", status_code=status.HTTP_200_OK)
def delete_property(
    property_id: int,
    current_user: User = Depends(require_roles([UserRole.owner])),
    db: Session = Depends(get_db)
):
    """
    Delete a property.
    - Strictly restricted to **Owner** role.
    - Prevents deletion (409 Conflict) if the property contains associated rooms.
    """
    property_service.delete_property(db, property_id)
    return {"message": f"Property with ID {property_id} successfully deleted."}
