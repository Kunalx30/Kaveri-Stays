from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class PropertyBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Unique name of the property")
    city: str = Field(..., min_length=2, max_length=100, description="City where property is located")
    star_rating: int = Field(..., ge=1, le=5, description="Star rating between 1 and 5")


class PropertyCreate(PropertyBase):
    pass


class PropertyUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100, description="Updated property name")
    city: Optional[str] = Field(None, min_length=2, max_length=100, description="Updated city")
    star_rating: Optional[int] = Field(None, ge=1, le=5, description="Updated star rating between 1 and 5")


class PropertyResponse(PropertyBase):
    property_id: int

    model_config = ConfigDict(from_attributes=True)
