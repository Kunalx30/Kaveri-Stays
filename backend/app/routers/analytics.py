from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user, require_roles, check_property_access
from app.models import User, UserRole
from app.schemas.analytics import (
    DashboardSummaryResponse,
    BookingAnalyticsResponse,
    RevenueAnalyticsResponse,
    ReviewAnalyticsResponse,
    OccupancyAnalyticsResponse,
    PropertyPerformanceResponse,
)
from app.services import analytics_service

router = APIRouter(prefix="/analytics", tags=["Analytics"])

# Analytics is restricted to Hotel Owners and Managers
ALLOWED_ANALYTICS_ROLES = [UserRole.owner, UserRole.manager]


def resolve_effective_property_id(current_user: User, requested_property_id: Optional[int]) -> Optional[int]:
    """
    Enforces property-level isolation for analytics:
    - Owner: Can access all properties (requested_property_id=None) or filter by any property.
    - Manager: Automatically restricted to current_user.property_id.
      If a different property_id is requested, raises 403 Forbidden.
    """
    if current_user.role == UserRole.manager:
        if requested_property_id is not None:
            check_property_access(current_user, requested_property_id)
        return current_user.property_id
    return requested_property_id


@router.get("/dashboard", response_model=DashboardSummaryResponse)
def get_dashboard_summary(
    property_id: Optional[int] = Query(None, gt=0, description="Filter summary by property ID (Owner only for cross-property)"),
    current_user: User = Depends(require_roles(ALLOWED_ANALYTICS_ROLES)),
    db: Session = Depends(get_db)
):
    """
    High-level dashboard summary providing overall statistics:
    - Total properties & rooms
    - Total bookings & breakdown by status
    - Total payments amount & transaction count (based on actual Payment records)
    - Total reviews & average rating
    """
    eff_property_id = resolve_effective_property_id(current_user, property_id)
    return analytics_service.get_dashboard_summary(db, property_id=eff_property_id)


@router.get("/bookings", response_model=BookingAnalyticsResponse)
def get_booking_analytics(
    property_id: Optional[int] = Query(None, gt=0, description="Filter by property ID"),
    start_date: Optional[date] = Query(None, description="Start date (inclusive) for booking creation"),
    end_date: Optional[date] = Query(None, description="End date (inclusive) for booking creation"),
    current_user: User = Depends(require_roles(ALLOWED_ANALYTICS_ROLES)),
    db: Session = Depends(get_db)
):
    """
    Booking volume and status breakdown analytics.
    Date filters apply to booking creation timestamps (`bookings.created_at`).
    """
    if start_date and end_date and start_date > end_date:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="end_date must be on or after start_date."
        )

    eff_property_id = resolve_effective_property_id(current_user, property_id)
    return analytics_service.get_booking_analytics(
        db,
        property_id=eff_property_id,
        start_date=start_date,
        end_date=end_date
    )


@router.get("/revenue", response_model=RevenueAnalyticsResponse)
def get_revenue_analytics(
    property_id: Optional[int] = Query(None, gt=0, description="Filter by property ID"),
    start_date: Optional[date] = Query(None, description="Start date (inclusive) for payment timestamps"),
    end_date: Optional[date] = Query(None, description="End date (inclusive) for payment timestamps"),
    current_user: User = Depends(require_roles(ALLOWED_ANALYTICS_ROLES)),
    db: Session = Depends(get_db)
):
    """
    Financial analytics based on actual payment transactions (`payments.amount`).
    Partial payments are accurately aggregated without double-counting.
    Date filters apply to payment timestamps (`payments.paid_at`).
    """
    if start_date and end_date and start_date > end_date:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="end_date must be on or after start_date."
        )

    eff_property_id = resolve_effective_property_id(current_user, property_id)
    return analytics_service.get_revenue_analytics(
        db,
        property_id=eff_property_id,
        start_date=start_date,
        end_date=end_date
    )


@router.get("/occupancy", response_model=OccupancyAnalyticsResponse)
def get_occupancy_analytics(
    period_start: date = Query(..., description="Start date (inclusive) for occupancy measurement"),
    period_end: date = Query(..., description="End date (exclusive) for occupancy measurement"),
    property_id: Optional[int] = Query(None, gt=0, description="Filter by property ID"),
    current_user: User = Depends(require_roles(ALLOWED_ANALYTICS_ROLES)),
    db: Session = Depends(get_db)
):
    """
    Occupancy rate measurement over a specified date range.
    - Occupied room nights: Active bookings (`confirmed`, `checked_in`, `checked_out`) overlapping the window.
    - Available room nights: Total rooms in scope × days in period.
    - Excludes `cancelled` and `no_show` reservations.
    """
    if period_start >= period_end:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="period_end must be strictly after period_start."
        )

    eff_property_id = resolve_effective_property_id(current_user, property_id)
    return analytics_service.get_occupancy_analytics(
        db,
        period_start=period_start,
        period_end=period_end,
        property_id=eff_property_id
    )


@router.get("/reviews", response_model=ReviewAnalyticsResponse)
def get_review_analytics(
    property_id: Optional[int] = Query(None, gt=0, description="Filter by property ID"),
    current_user: User = Depends(require_roles(ALLOWED_ANALYTICS_ROLES)),
    db: Session = Depends(get_db)
):
    """
    Customer feedback and rating distribution analytics (1 to 5 stars).
    """
    eff_property_id = resolve_effective_property_id(current_user, property_id)
    return analytics_service.get_review_analytics(db, property_id=eff_property_id)


@router.get("/properties", response_model=PropertyPerformanceResponse)
def get_property_performance_list(
    current_user: User = Depends(require_roles(ALLOWED_ANALYTICS_ROLES)),
    db: Session = Depends(get_db)
):
    """
    Comparative performance summary across all properties (Owner) or assigned property (Manager).
    """
    eff_property_id = current_user.property_id if current_user.role == UserRole.manager else None
    return analytics_service.get_property_performance(db, property_id=eff_property_id)


@router.get("/properties/{property_id}", response_model=PropertyPerformanceResponse)
def get_single_property_performance(
    property_id: int,
    current_user: User = Depends(require_roles(ALLOWED_ANALYTICS_ROLES)),
    db: Session = Depends(get_db)
):
    """
    Performance analytics for a single property.
    """
    check_property_access(current_user, property_id)
    return analytics_service.get_property_performance(db, property_id=property_id)
