from datetime import date
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.dialects.postgresql import Range
from sqlalchemy.orm import Session

from app.models.property import RatePlan, Property, RoomType
from app.schemas.rate_plan import RatePlanCreate, RatePlanUpdate


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


def check_rate_plan_overlap(
    db: Session,
    property_id: int,
    room_type_id: int,
    proposed_range: Range,
    exclude_rate_plan_id: Optional[int] = None
) -> None:
    """
    Checks for overlapping seasonal rate plans for the same (property_id, room_type_id).
    Raises HTTP 409 Conflict if an overlapping range exists.
    """
    query = db.query(RatePlan).filter(
        RatePlan.property_id == property_id,
        RatePlan.room_type_id == room_type_id,
        RatePlan.valid.op("&&")(proposed_range)
    )
    if exclude_rate_plan_id is not None:
        query = query.filter(RatePlan.rate_plan_id != exclude_rate_plan_id)

    conflict = query.first()
    if conflict:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Rate plan conflict: An overlapping rate plan already exists for property ID {property_id} "
                f"and room type ID {room_type_id} ({conflict.season_name or 'Rate Plan'} "
                f"valid [{conflict.valid.lower} to {conflict.valid.upper}))."
            )
        )


def list_rate_plans(
    db: Session,
    property_id: Optional[int] = None,
    room_type_id: Optional[int] = None,
    active_date: Optional[date] = None,
    assigned_property_id: Optional[int] = None
) -> List[RatePlan]:
    """
    List rate plans.
    - If assigned_property_id is set (Manager/Staff), strictly filter to that property.
    - Owner can filter by property_id, room_type_id, and/or active_date.
    """
    query = db.query(RatePlan)

    if assigned_property_id is not None:
        query = query.filter(RatePlan.property_id == assigned_property_id)
    else:
        if property_id is not None:
            query = query.filter(RatePlan.property_id == property_id)

    if room_type_id is not None:
        query = query.filter(RatePlan.room_type_id == room_type_id)

    if active_date is not None:
        query = query.filter(RatePlan.valid.op("@>")(active_date))

    return query.order_by(RatePlan.rate_plan_id.asc()).all()


def get_rate_plan_by_id(db: Session, rate_plan_id: int) -> RatePlan:
    """
    Retrieve a single rate plan by ID.
    Raises HTTP 404 if not found.
    """
    rate_plan = db.query(RatePlan).filter(RatePlan.rate_plan_id == rate_plan_id).first()
    if not rate_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Rate plan with ID {rate_plan_id} not found."
        )
    return rate_plan


def create_rate_plan(db: Session, data: RatePlanCreate) -> RatePlan:
    """
    Create a new rate plan.
    - Validates property exists (404).
    - Validates room type exists (404).
    - Validates no overlapping date ranges for the same property + room type (409).
    """
    _get_property_or_404(db, data.property_id)
    _get_room_type_or_404(db, data.room_type_id)

    proposed_range = Range(data.valid_from, data.valid_to, bounds="[)")
    check_rate_plan_overlap(db, data.property_id, data.room_type_id, proposed_range)

    clean_season = data.season_name.strip() if data.season_name else None

    new_rate_plan = RatePlan(
        property_id=data.property_id,
        room_type_id=data.room_type_id,
        season_name=clean_season,
        valid=proposed_range,
        nightly_rate=data.nightly_rate
    )
    db.add(new_rate_plan)
    db.commit()
    db.refresh(new_rate_plan)
    return new_rate_plan


def update_rate_plan(db: Session, rate_plan_id: int, data: RatePlanUpdate) -> RatePlan:
    """
    Partially update a rate plan.
    - property_id is immutable after creation.
    - If room_type_id or date range changes, re-runs overlap validation.
    """
    rate_plan = get_rate_plan_by_id(db, rate_plan_id)

    target_room_type_id = rate_plan.room_type_id
    if data.room_type_id is not None:
        _get_room_type_or_404(db, data.room_type_id)
        target_room_type_id = data.room_type_id

    target_from = data.valid_from if data.valid_from is not None else rate_plan.valid.lower
    target_to = data.valid_to if data.valid_to is not None else rate_plan.valid.upper

    if target_from >= target_to:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="valid_from must be strictly earlier than valid_to."
        )

    # Check if dates or room_type changed and re-validate overlap
    proposed_range = Range(target_from, target_to, bounds="[)")
    if (target_room_type_id != rate_plan.room_type_id or
        target_from != rate_plan.valid.lower or
        target_to != rate_plan.valid.upper):
        check_rate_plan_overlap(
            db,
            rate_plan.property_id,
            target_room_type_id,
            proposed_range,
            exclude_rate_plan_id=rate_plan_id
        )

    rate_plan.room_type_id = target_room_type_id
    rate_plan.valid = proposed_range

    if data.season_name is not None:
        rate_plan.season_name = data.season_name.strip() if data.season_name else None

    if data.nightly_rate is not None:
        rate_plan.nightly_rate = data.nightly_rate

    db.commit()
    db.refresh(rate_plan)
    return rate_plan


def delete_rate_plan(db: Session, rate_plan_id: int) -> None:
    """
    Safely delete a rate plan.
    - Checks rate plan existence (404).
    - Deletes rate plan (does not break historical bookings as bookings record snapshot nightly_rate).
    """
    rate_plan = get_rate_plan_by_id(db, rate_plan_id)
    db.delete(rate_plan)
    db.commit()
