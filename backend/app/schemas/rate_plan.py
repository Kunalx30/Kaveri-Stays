from datetime import date
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict, field_validator, model_validator


class RatePlanBase(BaseModel):
    property_id: int = Field(..., gt=0, description="Property this rate plan belongs to")
    room_type_id: int = Field(..., gt=0, description="Room Type classification")
    season_name: Optional[str] = Field(None, min_length=2, max_length=50, description="Seasonal name or label")
    valid_from: date = Field(..., description="Start date (inclusive, YYYY-MM-DD)")
    valid_to: date = Field(..., description="End date (exclusive, YYYY-MM-DD)")
    nightly_rate: Decimal = Field(..., gt=0, decimal_places=2, description="Nightly price in INR")

    @field_validator("season_name", mode="before")
    @classmethod
    def clean_season_name(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        stripped = v.strip()
        if not stripped:
            raise ValueError("season_name cannot be blank or whitespace-only.")
        return stripped

    @model_validator(mode="after")
    def validate_date_range(self):
        if self.valid_from >= self.valid_to:
            raise ValueError("valid_from must be strictly earlier than valid_to.")
        return self


class RatePlanCreate(RatePlanBase):
    pass


class RatePlanUpdate(BaseModel):
    """
    Partial update schema for rate plans.
    property_id is immutable after creation to preserve historical integrity.
    """
    season_name: Optional[str] = Field(None, min_length=2, max_length=50, description="Updated seasonal label")
    valid_from: Optional[date] = Field(None, description="Updated start date (inclusive)")
    valid_to: Optional[date] = Field(None, description="Updated end date (exclusive)")
    nightly_rate: Optional[Decimal] = Field(None, gt=0, decimal_places=2, description="Updated nightly rate in INR")
    room_type_id: Optional[int] = Field(None, gt=0, description="Updated room type ID")

    @field_validator("season_name", mode="before")
    @classmethod
    def clean_season_name(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        stripped = v.strip()
        if not stripped:
            raise ValueError("season_name cannot be blank or whitespace-only.")
        return stripped

    @model_validator(mode="after")
    def validate_date_range(self):
        if self.valid_from is not None and self.valid_to is not None:
            if self.valid_from >= self.valid_to:
                raise ValueError("valid_from must be strictly earlier than valid_to.")
        return self


class RatePlanResponse(BaseModel):
    rate_plan_id: int
    property_id: int
    room_type_id: int
    season_name: Optional[str]
    valid_from: date
    valid_to: date
    nightly_rate: Decimal

    model_config = ConfigDict(from_attributes=True)
