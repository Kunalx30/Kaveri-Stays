from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import (
    get_current_user,
    require_roles,
    check_property_access
)
from app.models import User, UserRole
from app.schemas.rate_plan import (
    RatePlanCreate,
    RatePlanUpdate,
    RatePlanResponse
)
from app.services import rate_plan_service

router = APIRouter(prefix="/rate-plans", tags=["Rate Plans"])


@router.get("", response_model=List[RatePlanResponse])
def list_rate_plans(
    property_id: Optional[int] = Query(None, gt=0, description="Filter by property ID"),
    room_type_id: Optional[int] = Query(None, gt=0, description="Filter by room type ID"),
    active_date: Optional[date] = Query(None, description="Find rate plans active on this date (YYYY-MM-DD)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List rate plans. Rate plan management is an internal pricing system.

    - **Owner**: Can list all rate plans; supports property_id, room_type_id, and active_date filters.
    - **Manager**: Strictly restricted to rate plans for their assigned property.
    - **Staff**: Strictly restricted to rate plans for their assigned property.
    - **Guest**: Access denied (403 Forbidden).
    """
    if current_user.role == UserRole.guest:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Guests do not have rate plan management access."
        )

    assigned_property_id = None
    if current_user.role in (UserRole.manager, UserRole.staff):
        assigned_property_id = current_user.property_id

    return rate_plan_service.list_rate_plans(
        db,
        property_id=property_id,
        room_type_id=room_type_id,
        active_date=active_date,
        assigned_property_id=assigned_property_id
    )


@router.get("/{rate_plan_id}", response_model=RatePlanResponse)
def get_rate_plan(
    rate_plan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a single rate plan by ID.

    - **Owner**: Can access any rate plan.
    - **Manager / Staff**: Can only access rate plans belonging to their assigned property.
    - **Guest**: Access denied (403 Forbidden).
    """
    if current_user.role == UserRole.guest:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Guests do not have rate plan management access."
        )

    rate_plan = rate_plan_service.get_rate_plan_by_id(db, rate_plan_id)

    if current_user.role in (UserRole.manager, UserRole.staff):
        check_property_access(current_user, rate_plan.property_id)

    return rate_plan


@router.post("", response_model=RatePlanResponse, status_code=status.HTTP_201_CREATED)
def create_rate_plan(
    data: RatePlanCreate,
    current_user: User = Depends(require_roles([UserRole.owner, UserRole.manager])),
    db: Session = Depends(get_db)
):
    """
    Create a new seasonal rate plan.

    - **Owner**: Can create rate plans for any property.
    - **Manager**: Can only create rate plans for their assigned property.
    - **Staff / Guest**: Access denied (403 Forbidden).
    """
    if current_user.role == UserRole.manager:
        check_property_access(current_user, data.property_id)

    return rate_plan_service.create_rate_plan(db, data)


@router.patch("/{rate_plan_id}", response_model=RatePlanResponse)
def update_rate_plan(
    rate_plan_id: int,
    data: RatePlanUpdate,
    current_user: User = Depends(require_roles([UserRole.owner, UserRole.manager])),
    db: Session = Depends(get_db)
):
    """
    Partially update a rate plan.
    property_id is immutable after creation.

    - **Owner**: Can update any rate plan.
    - **Manager**: Can only update rate plans for their assigned property.
    - **Staff / Guest**: Access denied (403 Forbidden).
    """
    rate_plan = rate_plan_service.get_rate_plan_by_id(db, rate_plan_id)

    if current_user.role == UserRole.manager:
        check_property_access(current_user, rate_plan.property_id)

    return rate_plan_service.update_rate_plan(db, rate_plan_id, data)


@router.delete("/{rate_plan_id}", status_code=status.HTTP_200_OK)
def delete_rate_plan(
    rate_plan_id: int,
    current_user: User = Depends(require_roles([UserRole.owner, UserRole.manager])),
    db: Session = Depends(get_db)
):
    """
    Delete a rate plan.

    - **Owner**: Can delete any rate plan.
    - **Manager**: Can only delete rate plans belonging to their assigned property.
    - **Staff / Guest**: Access denied (403 Forbidden).
    """
    rate_plan = rate_plan_service.get_rate_plan_by_id(db, rate_plan_id)

    if current_user.role == UserRole.manager:
        check_property_access(current_user, rate_plan.property_id)

    rate_plan_service.delete_rate_plan(db, rate_plan_id)
    return {"message": f"Rate plan with ID {rate_plan_id} successfully deleted."}
