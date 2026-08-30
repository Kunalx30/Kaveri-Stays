"""
Analytics Service — Hotel Analytics & Dashboard API (Phase 8)

Revenue Rule:
    Revenue = SUM(Payment.amount) from actual payment records.
    Partial payments are supported (multiple payments per booking).
    Cancelled / no-show bookings CAN have payments (prior to cancellation) —
    those payments are real and included in revenue totals.
    Date filter on revenue uses Payment.paid_at.

Booking Status Semantics:
    - confirmed, checked_in, checked_out → active/completed bookings
    - cancelled, no_show → terminated bookings
    - All statuses are included in booking COUNT analytics.
    - Date filter on bookings uses Booking.created_at.

Occupancy Rule:
    occupied_room_nights = sum of (check_out_date - check_in_date).days
    for bookings in status: confirmed, checked_in, checked_out
    whose stay period overlaps the requested date window.
    Cancelled and no_show bookings do NOT contribute to occupancy.
"""
from datetime import date
from decimal import Decimal
from typing import Optional, List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from sqlalchemy.dialects.postgresql import Range

from app.models.booking import Booking, BookingStatus, Payment, Review
from app.models.property import Property, Room
from app.schemas.analytics import (
    DashboardSummaryResponse,
    BookingStatusBreakdown,
    BookingAnalyticsResponse,
    RevenueAnalyticsResponse,
    RevenueByProperty,
    ReviewAnalyticsResponse,
    RatingDistribution,
    OccupancyAnalyticsResponse,
    PropertyPerformanceItem,
    PropertyPerformanceResponse,
)


# ─── Status sets ──────────────────────────────────────────────────────────────
ACTIVE_STATUSES = [BookingStatus.confirmed, BookingStatus.checked_in, BookingStatus.checked_out]


def _validate_property(db: Session, property_id: int) -> Property:
    """Raises 404 if property does not exist."""
    prop = db.query(Property).filter(Property.property_id == property_id).first()
    if not prop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Property with ID {property_id} not found."
        )
    return prop


def _booking_status_breakdown(db: Session, base_query) -> BookingStatusBreakdown:
    """
    Given a base bookings query, compute per-status counts.
    """
    rows = (
        base_query
        .with_entities(Booking.status, func.count(Booking.booking_id).label("cnt"))
        .group_by(Booking.status)
        .all()
    )
    counts = {row.status: row.cnt for row in rows}
    return BookingStatusBreakdown(
        confirmed=counts.get(BookingStatus.confirmed, 0),
        checked_in=counts.get(BookingStatus.checked_in, 0),
        checked_out=counts.get(BookingStatus.checked_out, 0),
        cancelled=counts.get(BookingStatus.cancelled, 0),
        no_show=counts.get(BookingStatus.no_show, 0),
    )


# ─── Dashboard Summary ────────────────────────────────────────────────────────

def get_dashboard_summary(
    db: Session,
    property_id: Optional[int] = None
) -> DashboardSummaryResponse:
    """
    Returns an aggregated summary for a quick hotel dashboard view.
    If property_id is supplied, all metrics are scoped to that property.
    """
    if property_id is not None:
        _validate_property(db, property_id)

    # Property and room counts
    prop_query = db.query(Property)
    room_query = db.query(Room)
    if property_id is not None:
        prop_query = prop_query.filter(Property.property_id == property_id)
        room_query = room_query.filter(Room.property_id == property_id)
    total_properties = prop_query.count()
    total_rooms = room_query.count()

    # Bookings
    booking_query = db.query(Booking).join(Room)
    if property_id is not None:
        booking_query = booking_query.filter(Room.property_id == property_id)
    total_bookings = booking_query.count()
    breakdown = _booking_status_breakdown(db, booking_query)

    # Payments (sum of actual Payment.amount)
    payment_query = db.query(Payment).join(Booking).join(Room)
    if property_id is not None:
        payment_query = payment_query.filter(Room.property_id == property_id)
    total_payment_amount = payment_query.with_entities(
        func.coalesce(func.sum(Payment.amount), Decimal("0.00"))
    ).scalar()
    total_payment_count = payment_query.count()

    # Reviews
    review_query = db.query(Review).join(Booking).join(Room)
    if property_id is not None:
        review_query = review_query.filter(Room.property_id == property_id)
    total_reviews = review_query.count()
    avg_rating_raw = review_query.with_entities(func.avg(Review.rating)).scalar()
    avg_rating = round(float(avg_rating_raw), 2) if avg_rating_raw is not None else None

    return DashboardSummaryResponse(
        total_properties=total_properties,
        total_rooms=total_rooms,
        total_bookings=total_bookings,
        booking_status_breakdown=breakdown,
        total_payments_amount=Decimal(str(total_payment_amount)),
        total_payment_transactions=total_payment_count,
        total_reviews=total_reviews,
        average_review_rating=avg_rating,
    )


# ─── Booking Analytics ────────────────────────────────────────────────────────

def get_booking_analytics(
    db: Session,
    property_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
) -> BookingAnalyticsResponse:
    """
    Booking count statistics, filterable by property and creation-date window.
    Date filter applies to Booking.created_at.
    """
    if property_id is not None:
        _validate_property(db, property_id)

    query = db.query(Booking).join(Room)
    if property_id is not None:
        query = query.filter(Room.property_id == property_id)
    if start_date is not None:
        query = query.filter(func.date(Booking.created_at) >= start_date)
    if end_date is not None:
        query = query.filter(func.date(Booking.created_at) <= end_date)

    total = query.count()
    breakdown = _booking_status_breakdown(db, query)

    return BookingAnalyticsResponse(
        total_bookings=total,
        booking_status_breakdown=breakdown,
        filter_start_date=start_date,
        filter_end_date=end_date,
        filter_property_id=property_id,
    )


# ─── Revenue Analytics ────────────────────────────────────────────────────────

def get_revenue_analytics(
    db: Session,
    property_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
) -> RevenueAnalyticsResponse:
    """
    Revenue based on actual Payment.amount records.
    Date filter applies to Payment.paid_at.
    Multiple payments per booking are all included.
    """
    if property_id is not None:
        _validate_property(db, property_id)

    # Base payment query scoped by property if needed
    payment_query = db.query(Payment).join(Booking).join(Room)
    if property_id is not None:
        payment_query = payment_query.filter(Room.property_id == property_id)
    if start_date is not None:
        payment_query = payment_query.filter(func.date(Payment.paid_at) >= start_date)
    if end_date is not None:
        payment_query = payment_query.filter(func.date(Payment.paid_at) <= end_date)

    total_amount = payment_query.with_entities(
        func.coalesce(func.sum(Payment.amount), Decimal("0.00"))
    ).scalar()
    payment_count = payment_query.count()

    # Revenue grouped by property (using direct aggregation query)
    rev_query = (
        db.query(
            Room.property_id,
            Property.name.label("property_name"),
            func.coalesce(func.sum(Payment.amount), Decimal("0.00")).label("total"),
            func.count(Payment.payment_id).label("cnt"),
        )
        .join(Booking, Booking.booking_id == Payment.booking_id)
        .join(Room, Room.room_id == Booking.room_id)
        .join(Property, Property.property_id == Room.property_id)
    )
    if property_id is not None:
        rev_query = rev_query.filter(Room.property_id == property_id)
    if start_date is not None:
        rev_query = rev_query.filter(func.date(Payment.paid_at) >= start_date)
    if end_date is not None:
        rev_query = rev_query.filter(func.date(Payment.paid_at) <= end_date)
    rev_query = rev_query.group_by(Room.property_id, Property.name).order_by(Room.property_id)

    revenue_by_property = [
        RevenueByProperty(
            property_id=row.property_id,
            property_name=row.property_name,
            total_payment_amount=Decimal(str(row.total)),
            payment_count=row.cnt,
        )
        for row in rev_query.all()
    ]

    return RevenueAnalyticsResponse(
        total_payment_amount=Decimal(str(total_amount)),
        payment_count=payment_count,
        revenue_by_property=revenue_by_property,
        filter_start_date=start_date,
        filter_end_date=end_date,
    )


# ─── Review Analytics ────────────────────────────────────────────────────────

def get_review_analytics(
    db: Session,
    property_id: Optional[int] = None
) -> ReviewAnalyticsResponse:
    """
    Review summary: total, average rating, and per-star distribution.
    Ratings are integers 1–5 as enforced by the DB CHECK constraint.
    """
    if property_id is not None:
        _validate_property(db, property_id)

    review_query = db.query(Review).join(Booking).join(Room)
    if property_id is not None:
        review_query = review_query.filter(Room.property_id == property_id)

    total = review_query.count()
    avg_raw = review_query.with_entities(func.avg(Review.rating)).scalar()
    avg_rating = round(float(avg_raw), 2) if avg_raw is not None else None

    # Rating distribution using a single aggregation query
    dist_rows = (
        review_query
        .with_entities(Review.rating, func.count(Review.review_id).label("cnt"))
        .group_by(Review.rating)
        .all()
    )
    dist_map = {row.rating: row.cnt for row in dist_rows}
    distribution = RatingDistribution(
        one_star=dist_map.get(1, 0),
        two_stars=dist_map.get(2, 0),
        three_stars=dist_map.get(3, 0),
        four_stars=dist_map.get(4, 0),
        five_stars=dist_map.get(5, 0),
    )

    return ReviewAnalyticsResponse(
        total_reviews=total,
        average_rating=avg_rating,
        rating_distribution=distribution,
        filter_property_id=property_id,
    )


# ─── Occupancy Analytics ─────────────────────────────────────────────────────

def get_occupancy_analytics(
    db: Session,
    period_start: date,
    period_end: date,
    property_id: Optional[int] = None
) -> OccupancyAnalyticsResponse:
    """
    Occupancy rate for a given period.

    Definitions:
    - total_available_room_nights = room_count × period_days
    - occupied_room_nights = sum of (clamped_check_out - clamped_check_in).days
      for active bookings (confirmed, checked_in, checked_out) whose stay
      overlaps the requested period.
    - Clamping: the overlap with [period_start, period_end] is used so only
      nights within the window count.
    """
    if property_id is not None:
        _validate_property(db, property_id)

    period_days = (period_end - period_start).days
    if period_days <= 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="period_end must be strictly after period_start."
        )

    # Count rooms in scope
    room_query = db.query(func.count(Room.room_id))
    if property_id is not None:
        room_query = room_query.filter(Room.property_id == property_id)
    total_rooms = room_query.scalar() or 0
    total_available = total_rooms * period_days

    # Find overlapping active bookings (same && operator as booking service)
    window = Range(period_start, period_end, bounds="[)")
    booking_query = (
        db.query(Booking)
        .join(Room)
        .filter(
            Booking.status.in_(ACTIVE_STATUSES),
            Booking.stay.op("&&")(window)
        )
    )
    if property_id is not None:
        booking_query = booking_query.filter(Room.property_id == property_id)

    # Calculate clipped occupied nights in Python (stay may extend beyond period)
    occupied_nights = 0
    for booking in booking_query.all():
        ci = max(booking.check_in_date, period_start)
        co = min(booking.check_out_date, period_end)
        nights = (co - ci).days
        if nights > 0:
            occupied_nights += nights

    occupancy_rate = None
    if total_available > 0:
        occupancy_rate = round((occupied_nights / total_available) * 100, 2)

    return OccupancyAnalyticsResponse(
        total_rooms=total_rooms,
        period_start=period_start,
        period_end=period_end,
        total_available_room_nights=total_available,
        occupied_room_nights=occupied_nights,
        occupancy_rate_percent=occupancy_rate,
        filter_property_id=property_id,
    )


# ─── Property Performance ─────────────────────────────────────────────────────

def get_property_performance(
    db: Session,
    property_id: Optional[int] = None
) -> PropertyPerformanceResponse:
    """
    Per-property performance comparison for Owner use.
    If property_id is supplied, returns a single-property result.
    """
    prop_query = db.query(Property)
    if property_id is not None:
        _validate_property(db, property_id)
        prop_query = prop_query.filter(Property.property_id == property_id)

    properties = prop_query.order_by(Property.property_id).all()

    items: List[PropertyPerformanceItem] = []
    for prop in properties:
        # Room count
        room_count = db.query(func.count(Room.room_id)).filter(
            Room.property_id == prop.property_id
        ).scalar() or 0

        # Booking count
        booking_count = (
            db.query(func.count(Booking.booking_id))
            .join(Room)
            .filter(Room.property_id == prop.property_id)
            .scalar() or 0
        )

        # Payment aggregation
        pay_row = (
            db.query(
                func.coalesce(func.sum(Payment.amount), Decimal("0.00")).label("total"),
                func.count(Payment.payment_id).label("cnt"),
            )
            .join(Booking)
            .join(Room)
            .filter(Room.property_id == prop.property_id)
            .first()
        )
        total_pay = Decimal(str(pay_row.total)) if pay_row else Decimal("0.00")
        pay_count = pay_row.cnt if pay_row else 0

        # Review stats
        rev_row = (
            db.query(
                func.count(Review.review_id).label("cnt"),
                func.avg(Review.rating).label("avg"),
            )
            .join(Booking)
            .join(Room)
            .filter(Room.property_id == prop.property_id)
            .first()
        )
        review_count = rev_row.cnt if rev_row else 0
        avg_rev = round(float(rev_row.avg), 2) if (rev_row and rev_row.avg is not None) else None

        items.append(PropertyPerformanceItem(
            property_id=prop.property_id,
            property_name=prop.name,
            room_count=room_count,
            total_bookings=booking_count,
            total_payment_amount=total_pay,
            payment_count=pay_count,
            review_count=review_count,
            average_review_rating=avg_rev,
        ))

    return PropertyPerformanceResponse(
        properties=items,
        total_properties=len(items),
    )
