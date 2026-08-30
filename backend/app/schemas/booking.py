from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict, field_validator, model_validator

from app.models.booking import BookingStatus


class BookingBase(BaseModel):
    room_id: int = Field(..., gt=0, description="Assigned Room ID")
    check_in_date: date = Field(..., description="Check-in date (inclusive, YYYY-MM-DD)")
    check_out_date: date = Field(..., description="Check-out date (exclusive, YYYY-MM-DD)")
    guests_count: int = Field(..., gt=0, le=20, description="Number of guests staying")
    notes: Optional[str] = Field(None, max_length=500, description="Special requests or booking notes")

    @field_validator("notes", mode="before")
    @classmethod
    def clean_notes(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        stripped = v.strip()
        return stripped if stripped else None

    @model_validator(mode="after")
    def validate_dates(self):
        if self.check_in_date >= self.check_out_date:
            raise ValueError("check_in_date must be strictly earlier than check_out_date.")
        return self


class BookingCreate(BookingBase):
    guest_id: Optional[int] = Field(
        None,
        gt=0,
        description="Guest ID for whom the reservation is booked (auto-inferred for Guest role; selectable by Owner/Manager)"
    )
    nightly_rate: Optional[Decimal] = Field(
        None,
        gt=0,
        decimal_places=2,
        description="Custom nightly rate in INR (optional; if omitted, automatically looked up from active RatePlan)"
    )


class BookingUpdate(BaseModel):
    """
    Partial update schema for bookings.
    """
    check_in_date: Optional[date] = Field(None, description="Updated check-in date")
    check_out_date: Optional[date] = Field(None, description="Updated check-out date")
    guests_count: Optional[int] = Field(None, gt=0, le=20, description="Updated guests count")
    room_id: Optional[int] = Field(None, gt=0, description="Reassigned room ID")
    status: Optional[BookingStatus] = Field(None, description="Updated booking status")
    notes: Optional[str] = Field(None, max_length=500, description="Updated booking notes")

    @field_validator("notes", mode="before")
    @classmethod
    def clean_notes(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        stripped = v.strip()
        return stripped if stripped else None

    @model_validator(mode="after")
    def validate_dates(self):
        if self.check_in_date is not None and self.check_out_date is not None:
            if self.check_in_date >= self.check_out_date:
                raise ValueError("check_in_date must be strictly earlier than check_out_date.")
        return self


class BookingStatusUpdate(BaseModel):
    status: BookingStatus = Field(..., description="New booking status")


class BookingResponse(BaseModel):
    booking_id: int
    guest_id: int
    room_id: int
    property_id: Optional[int] = None
    check_in_date: date
    check_out_date: date
    total_nights: Optional[int] = None
    guests_count: int
    nightly_rate: Decimal
    total_amount: Optional[Decimal] = None
    status: BookingStatus
    notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
