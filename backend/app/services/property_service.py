from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.property import Property, Room
from app.schemas.property import PropertyCreate, PropertyUpdate


def list_all_properties(
    db: Session,
    city: Optional[str] = None,
    assigned_property_id: Optional[int] = None
) -> List[Property]:
    """
    Retrieve properties:
    - If assigned_property_id is set (for Manager/Staff), restricts to that assigned property.
    - Otherwise returns all properties, optionally filtered by city (case-insensitive).
    """
    query = db.query(Property)
    if assigned_property_id is not None:
        query = query.filter(Property.property_id == assigned_property_id)
    elif city and city.strip():
        query = query.filter(func.lower(Property.city) == city.strip().lower())
    return query.order_by(Property.property_id.asc()).all()


def get_property_by_id(db: Session, property_id: int) -> Property:
    """
    Retrieve a single property by its ID.
    Raises HTTP 404 if the property does not exist.
    """
    property_obj = db.query(Property).filter(Property.property_id == property_id).first()
    if not property_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Property with ID {property_id} not found."
        )
    return property_obj


def create_property(db: Session, data: PropertyCreate) -> Property:
    """
    Creates a new hotel property.
    - Validates that property name is unique (case-insensitive).
    - Returns the created property.
    """
    clean_name = data.name.strip()
    clean_city = data.city.strip()

    # Check for name uniqueness
    existing = db.query(Property).filter(
        func.lower(func.trim(Property.name)) == clean_name.lower()
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A property named '{clean_name}' already exists."
        )

    new_property = Property(
        name=clean_name,
        city=clean_city,
        star_rating=data.star_rating
    )
    db.add(new_property)
    db.commit()
    db.refresh(new_property)
    return new_property


def update_property(db: Session, property_id: int, data: PropertyUpdate) -> Property:
    """
    Updates an existing property.
    - Checks property existence (404).
    - Checks name uniqueness if name is modified (409).
    - Modifies and commits changes.
    """
    property_obj = get_property_by_id(db, property_id)

    if data.name is not None:
        clean_name = data.name.strip()
        if clean_name.lower() != property_obj.name.lower():
            # Check for conflict with other properties
            existing = db.query(Property).filter(
                func.lower(func.trim(Property.name)) == clean_name.lower(),
                Property.property_id != property_id
            ).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Another property named '{clean_name}' already exists."
                )
        property_obj.name = clean_name

    if data.city is not None:
        property_obj.city = data.city.strip()

    if data.star_rating is not None:
        property_obj.star_rating = data.star_rating

    db.commit()
    db.refresh(property_obj)
    return property_obj


def delete_property(db: Session, property_id: int) -> None:
    """
    Deletes a property if safe.
    - Checks property existence (404).
    - Prevents deletion if rooms are associated (409 Conflict due to foreign key RESTRICT constraint).
    """
    property_obj = get_property_by_id(db, property_id)

    # Check for associated rooms
    room_count = db.query(Room).filter(Room.property_id == property_id).count()
    if room_count > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot delete property '{property_obj.name}' (ID: {property_id}) because it has {room_count} associated room(s). Delete rooms first."
        )

    db.delete(property_obj)
    db.commit()
