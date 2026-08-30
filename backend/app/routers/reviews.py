from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import (
    get_current_user,
    get_optional_current_user,
    check_property_access
)
from app.models import User, UserRole
from app.models.booking import Booking
from app.schemas.review import (
    ReviewCreate,
    ReviewUpdate,
    ReviewResponse
)
from app.services import review_service

router = APIRouter(prefix="/reviews", tags=["Reviews"])


@router.get("", response_model=List[ReviewResponse])
def list_reviews(
    property_id: Optional[int] = Query(None, gt=0, description="Filter reviews by property ID"),
    booking_id: Optional[int] = Query(None, gt=0, description="Filter reviews by booking ID"),
    rating: Optional[int] = Query(None, ge=1, le=5, description="Filter reviews by rating (1-5)"),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    List hotel reviews:
    - **Public & Guests**: Can browse all public reviews (or filter by property, booking, rating).
    - **Manager & Staff**: Strictly scoped to reviews for their assigned property.
    - **Owner**: Can view all reviews across all properties.
    """
    assigned_property_id = None
    if current_user and current_user.role in (UserRole.manager, UserRole.staff):
        assigned_property_id = current_user.property_id

    return review_service.list_reviews(
        db,
        property_id=property_id,
        booking_id=booking_id,
        rating=rating,
        assigned_property_id=assigned_property_id
    )


@router.get("/{review_id}", response_model=ReviewResponse)
def get_review(
    review_id: int,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve a single review by ID.
    - If accessed by authenticated Manager/Staff, strictly enforces property isolation.
    """
    review = review_service.get_review_by_id(db, review_id)

    if current_user and current_user.role in (UserRole.manager, UserRole.staff):
        check_property_access(current_user, review.property_id)

    return review


@router.post("", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def create_review(
    data: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submit a guest review for a completed stay (checked-out booking):
    - **Guest**: Can only review their own completed booking.
    - **Owner / Manager**: Can submit reviews for bookings in their authorized scope.
    """
    booking = db.query(Booking).filter(Booking.booking_id == data.booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Booking with ID {data.booking_id} not found."
        )

    target_guest_id = None
    if current_user.role == UserRole.guest:
        target_guest_id = current_user.guest_id
    elif current_user.role in (UserRole.manager, UserRole.staff):
        check_property_access(current_user, booking.room.property_id)

    return review_service.create_review(
        db,
        data=data,
        current_guest_id=target_guest_id
    )


@router.patch("/{review_id}", response_model=ReviewResponse)
def update_review(
    review_id: int,
    data: ReviewUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update an existing review:
    - **Guest**: Can update their own review.
    - **Manager**: Can update reviews belonging to their assigned property.
    - **Staff**: Forbidden (403).
    - **Owner**: Unrestricted.
    """
    review = review_service.get_review_by_id(db, review_id)

    if current_user.role == UserRole.guest:
        if review.guest_id != current_user.guest_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You can only update your own reviews."
            )
    elif current_user.role == UserRole.manager:
        check_property_access(current_user, review.property_id)
    elif current_user.role == UserRole.staff:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Staff cannot modify guest reviews."
        )

    return review_service.update_review(db, review_id, data)


@router.delete("/{review_id}", status_code=status.HTTP_200_OK)
def delete_review(
    review_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a review:
    - **Guest**: Can delete their own review.
    - **Manager**: Can delete reviews for their assigned property.
    - **Staff**: Forbidden (403).
    - **Owner**: Unrestricted.
    """
    review = review_service.get_review_by_id(db, review_id)

    if current_user.role == UserRole.guest:
        if review.guest_id != current_user.guest_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You can only delete your own reviews."
            )
    elif current_user.role == UserRole.manager:
        check_property_access(current_user, review.property_id)
    elif current_user.role == UserRole.staff:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Staff cannot delete guest reviews."
        )

    review_service.delete_review(db, review_id)
    return {"message": f"Review with ID {review_id} successfully deleted."}
