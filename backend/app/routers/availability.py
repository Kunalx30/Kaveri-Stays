from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_optional_current_user, check_property_access
from app.models import User, UserRole
from app.schemas.availability import AvailabilityResponse
from app.services import availability_service

router = APIRouter(prefix="/availability", tags=["Availability"])


@router.get("", response_model=AvailabilityResponse)
def search_availability(
    check_in: date = Query(..., description="Check-in date (YYYY-MM-DD)"),
    check_out: date = Query(..., description="Check-out date (YYYY-MM-DD)"),
    guests_count: int = Query(..., ge=1, le=20, description="Number of guests"),
    property_id: Optional[int] = Query(None, gt=0, description="Filter by property ID"),
    room_type_id: Optional[int] = Query(None, gt=0, description="Filter by room type ID"),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Search for available rooms across all properties (or within a specific property).

    **Public / Guest**: Can search all properties to discover bookable rooms.

    **Manager / Staff**: Results are automatically restricted to their assigned property.
    Any `property_id` filter they supply is ignored — only their own property is returned.

    **Owner**: Can search across all properties, or filter by any specific property.

    **Date Rules**:
    - `check_out` must be strictly after `check_in`.
    - A room is considered available only if it has no conflicting active booking
      (confirmed, checked_in, or checked_out) for the requested period.
    - Cancelled and no-show bookings do NOT block availability.

    **Occupancy Rule**:
    - Only rooms whose room type supports at least `guests_count` guests are returned.
    """
    if check_in >= check_out:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=422,
            detail="check_out must be strictly after check_in."
        )

    # Manager/Staff: enforce their property — ignore client-supplied property_id
    assigned_property_id = None
    if current_user and current_user.role in (UserRole.manager, UserRole.staff):
        assigned_property_id = current_user.property_id

    return availability_service.search_available_rooms(
        db,
        check_in=check_in,
        check_out=check_out,
        guests_count=guests_count,
        property_id=property_id,
        room_type_id=room_type_id,
        assigned_property_id=assigned_property_id
    )


@router.get("/property/{property_id}", response_model=AvailabilityResponse)
def search_property_availability(
    property_id: int,
    check_in: date = Query(..., description="Check-in date (YYYY-MM-DD)"),
    check_out: date = Query(..., description="Check-out date (YYYY-MM-DD)"),
    guests_count: int = Query(..., ge=1, le=20, description="Number of guests"),
    room_type_id: Optional[int] = Query(None, gt=0, description="Filter by room type ID"),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Search available rooms within a specific property.

    **Manager / Staff**: Must belong to the requested property — otherwise returns 403 Forbidden.

    **Owner / Public**: Can query any property.
    """
    if check_in >= check_out:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=422,
            detail="check_out must be strictly after check_in."
        )

    # Property-level access for authenticated Manager/Staff
    if current_user and current_user.role in (UserRole.manager, UserRole.staff):
        check_property_access(current_user, property_id)

    return availability_service.search_available_rooms(
        db,
        check_in=check_in,
        check_out=check_out,
        guests_count=guests_count,
        property_id=property_id,
        room_type_id=room_type_id,
        assigned_property_id=None   # property_id in path is already validated above
    )
