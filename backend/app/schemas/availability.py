from datetime import date
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict, model_validator


class AvailabilityRequest(BaseModel):
    """
    Query parameters for searching available rooms.
    All fields are validated before querying the database.
    """
    check_in: date = Field(..., description="Check-in date (inclusive, YYYY-MM-DD)")
    check_out: date = Field(..., description="Check-out date (exclusive, YYYY-MM-DD)")
    guests_count: int = Field(..., ge=1, le=20, description="Number of guests")
    property_id: Optional[int] = Field(None, gt=0, description="Filter by property ID")
    room_type_id: Optional[int] = Field(None, gt=0, description="Filter by room type ID")

    @model_validator(mode="after")
    def validate_dates(self):
        if self.check_in >= self.check_out:
            raise ValueError("check_out must be strictly after check_in.")
        return self


class AvailableRoomResponse(BaseModel):
    """
    A single available room result returned by the availability search.
    Exposes only the information relevant to booking decisions.
    """
    room_id: int
    room_number: str
    property_id: int
    property_name: str
    property_city: str
    property_star_rating: int
    room_type_id: int
    room_type_name: str
    max_occupancy: int
    nightly_rate: Optional[Decimal] = Field(
        None,
        description="Applicable nightly rate (INR) from active RatePlan for check-in date. "
                    "None if no rate plan covers this period."
    )

    model_config = ConfigDict(from_attributes=False)


class AvailabilityResponse(BaseModel):
    """
    Full availability search result with metadata.
    """
    check_in: date
    check_out: date
    guests_count: int
    total_available: int
    rooms: List[AvailableRoomResponse]
