from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.booking import Booking, BookingStatus, Review
from app.models.property import Room
from app.schemas.review import ReviewCreate, ReviewUpdate


def get_review_by_id(db: Session, review_id: int) -> Review:
    """
    Retrieve a single review by ID.
    Raises HTTP 404 if not found.
    """
    review = db.query(Review).filter(Review.review_id == review_id).first()
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Review with ID {review_id} not found."
        )
    return review


def list_reviews(
    db: Session,
    property_id: Optional[int] = None,
    booking_id: Optional[int] = None,
    rating: Optional[int] = None,
    assigned_property_id: Optional[int] = None
) -> List[Review]:
    """
    List reviews with property-level scoping and optional filters.
    """
    query = db.query(Review).join(Booking).join(Room)

    # Manager / Staff property isolation
    if assigned_property_id is not None:
        query = query.filter(Room.property_id == assigned_property_id)
    elif property_id is not None:
        query = query.filter(Room.property_id == property_id)

    if booking_id is not None:
        query = query.filter(Review.booking_id == booking_id)

    if rating is not None:
        query = query.filter(Review.rating == rating)

    return query.order_by(Review.review_id.desc()).all()


def create_review(
    db: Session,
    data: ReviewCreate,
    current_guest_id: Optional[int] = None
) -> Review:
    """
    Create a new guest review:
    1. Validates booking existence (404).
    2. Validates guest ownership if submitted by a Guest (403).
    3. Validates booking status is 'checked_out' (400).
    4. Validates uniqueness (one review per booking) (409).
    5. Persists review.
    """
    booking = db.query(Booking).filter(Booking.booking_id == data.booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Booking with ID {data.booking_id} not found."
        )

    # Guest ownership validation
    if current_guest_id is not None and booking.guest_id != current_guest_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You can only submit reviews for your own bookings."
        )

    # Status eligibility: must be completed (checked_out)
    if booking.status != BookingStatus.checked_out:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Reviews can only be submitted for completed stays (checked-out reservations). "
                f"Current booking status is '{booking.status.value}'."
            )
        )

    # Check for duplicate review
    existing = db.query(Review).filter(Review.booking_id == data.booking_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A review already exists for booking #{data.booking_id} (Review #{existing.review_id})."
        )

    clean_comments = data.comments.strip() if data.comments else None

    new_review = Review(
        booking_id=data.booking_id,
        rating=data.rating,
        comments=clean_comments
    )
    db.add(new_review)
    db.commit()
    db.refresh(new_review)
    return new_review


def update_review(
    db: Session,
    review_id: int,
    data: ReviewUpdate
) -> Review:
    """
    Partially update an existing review.
    """
    review = get_review_by_id(db, review_id)

    if data.rating is not None:
        review.rating = data.rating

    if data.comments is not None:
        review.comments = data.comments.strip() if data.comments else None

    db.commit()
    db.refresh(review)
    return review


def delete_review(db: Session, review_id: int) -> None:
    """
    Delete a review.
    """
    review = get_review_by_id(db, review_id)
    db.delete(review)
    db.commit()
