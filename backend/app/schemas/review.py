from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict, field_validator


class ReviewBase(BaseModel):
    rating: int = Field(..., ge=1, le=5, description="Star rating between 1 and 5")
    comments: Optional[str] = Field(None, max_length=2000, description="Feedback or review commentary")

    @field_validator("comments", mode="before")
    @classmethod
    def clean_comments(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        stripped = v.strip()
        return stripped if stripped else None


class ReviewCreate(ReviewBase):
    booking_id: int = Field(..., gt=0, description="Completed booking ID to review")


class ReviewUpdate(BaseModel):
    """
    Partial update schema for reviews.
    """
    rating: Optional[int] = Field(None, ge=1, le=5, description="Updated star rating between 1 and 5")
    comments: Optional[str] = Field(None, max_length=2000, description="Updated feedback")

    @field_validator("comments", mode="before")
    @classmethod
    def clean_comments(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        stripped = v.strip()
        return stripped if stripped else None


class ReviewResponse(BaseModel):
    review_id: int
    booking_id: int
    rating: int
    comments: Optional[str] = None
    reviewed_at: datetime
    property_id: Optional[int] = None
    guest_id: Optional[int] = None
    guest_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
