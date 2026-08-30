
from datetime import date
from decimal import Decimal
from typing import Optional, List, Dict
from pydantic import BaseModel, Field, ConfigDict, model_validator


# ─── Shared Filter Schema ─────────────────────────────────────────────────────

class AnalyticsFilter(BaseModel):
    """Common optional filters for all analytics endpoints."""
    start_date: Optional[date] = Field(None, description="Filter from this date (inclusive), based on booking creation date")
    end_date: Optional[date] = Field(None, description="Filter to this date (inclusive), based on booking creation date")
    property_id: Optional[int] = Field(None, gt=0, description="Filter by property ID (Owner only for cross-property)")

    @model_validator(mode="after")
    def validate_date_range(self):
        if self.start_date and self.end_date:
            if self.start_date > self.end_date:
                raise ValueError("end_date must be on or after start_date.")
        return self


# ─── Dashboard Summary ────────────────────────────────────────────────────────

class BookingStatusBreakdown(BaseModel):
    confirmed: int = 0
    checked_in: int = 0
    checked_out: int = 0
    cancelled: int = 0
    no_show: int = 0


class DashboardSummaryResponse(BaseModel):
    total_properties: int
    total_rooms: int
    total_bookings: int
    booking_status_breakdown: BookingStatusBreakdown
    total_payments_amount: Decimal = Field(description="Sum of all actual Payment.amount records")
    total_payment_transactions: int
    total_reviews: int
    average_review_rating: Optional[float] = Field(None, description="Mean rating across all reviews (1-5 scale)")

    model_config = ConfigDict(from_attributes=False)


# ─── Booking Analytics ────────────────────────────────────────────────────────

class BookingAnalyticsResponse(BaseModel):
    total_bookings: int
    booking_status_breakdown: BookingStatusBreakdown
    filter_start_date: Optional[date] = None
    filter_end_date: Optional[date] = None
    filter_property_id: Optional[int] = None
    note: str = "Date filters apply to booking creation date (bookings.created_at)."

    model_config = ConfigDict(from_attributes=False)


# ─── Revenue Analytics ────────────────────────────────────────────────────────

class RevenueByProperty(BaseModel):
    property_id: int
    property_name: str
    total_payment_amount: Decimal
    payment_count: int


class RevenueAnalyticsResponse(BaseModel):
    total_payment_amount: Decimal = Field(description="Total sum of all Payment.amount records in the filter period")
    payment_count: int
    revenue_by_property: List[RevenueByProperty]
    filter_start_date: Optional[date] = None
    filter_end_date: Optional[date] = None
    note: str = (
        "Revenue is the sum of actual Payment.amount records. "
        "Partial payments are supported — a booking may have multiple payment transactions. "
        "Date filters apply to Payment.paid_at."
    )

    model_config = ConfigDict(from_attributes=False)


# ─── Review Analytics ────────────────────────────────────────────────────────

class RatingDistribution(BaseModel):
    one_star: int = Field(0, description="Number of 1-star reviews")
    two_stars: int = Field(0, description="Number of 2-star reviews")
    three_stars: int = Field(0, description="Number of 3-star reviews")
    four_stars: int = Field(0, description="Number of 4-star reviews")
    five_stars: int = Field(0, description="Number of 5-star reviews")


class ReviewAnalyticsResponse(BaseModel):
    total_reviews: int
    average_rating: Optional[float] = Field(None, description="Mean rating (1-5 scale). None if no reviews.")
    rating_distribution: RatingDistribution
    filter_property_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=False)


# ─── Occupancy Analytics ─────────────────────────────────────────────────────

class OccupancyAnalyticsResponse(BaseModel):
    total_rooms: int
    period_start: date
    period_end: date
    total_available_room_nights: int = Field(
        description="total_rooms × number of days in the period"
    )
    occupied_room_nights: int = Field(
        description="Sum of booked night-days for confirmed, checked_in, checked_out bookings"
    )
    occupancy_rate_percent: Optional[float] = Field(
        None,
        description="occupied_room_nights / total_available_room_nights × 100. None if period is zero-length."
    )
    filter_property_id: Optional[int] = None
    note: str = (
        "Occupied nights count confirmed, checked_in, and checked_out bookings "
        "whose stay overlaps the requested period. Cancelled and no_show bookings are excluded."
    )

    model_config = ConfigDict(from_attributes=False)


# ─── Property Performance ─────────────────────────────────────────────────────

class PropertyPerformanceItem(BaseModel):
    property_id: int
    property_name: str
    room_count: int
    total_bookings: int
    total_payment_amount: Decimal
    payment_count: int
    review_count: int
    average_review_rating: Optional[float]


class PropertyPerformanceResponse(BaseModel):
    properties: List[PropertyPerformanceItem]
    total_properties: int

    model_config = ConfigDict(from_attributes=False)
