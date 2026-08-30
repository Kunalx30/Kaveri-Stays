from typing import Optional
from pydantic import BaseModel, Field, ConfigDict, field_validator


class RoomBase(BaseModel):
    property_id: int = Field(..., gt=0, description="Property this room belongs to")
    room_number: str = Field(..., min_length=1, max_length=10, description="Room number within the property")
    room_type_id: int = Field(..., gt=0, description="Room type classification")

    @field_validator("room_number", mode="before")
    @classmethod
    def trim_and_reject_blank(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("room_number must not be blank or whitespace-only.")
        return stripped


class RoomCreate(RoomBase):
    pass


class RoomUpdate(BaseModel):
    """
    Partial update schema for rooms.
    property_id is intentionally excluded — reassigning a room to a different
    property is unsafe when bookings exist and would break property-level isolation.
    Only room_number and room_type_id may be updated.
    """
    room_number: Optional[str] = Field(None, min_length=1, max_length=10, description="Updated room number")
    room_type_id: Optional[int] = Field(None, gt=0, description="Updated room type ID")

    @field_validator("room_number", mode="before")
    @classmethod
    def trim_and_reject_blank(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        stripped = v.strip()
        if not stripped:
            raise ValueError("room_number must not be blank or whitespace-only.")
        return stripped


class RoomResponse(BaseModel):
    room_id: int
    property_id: int
    room_number: str
    room_type_id: int

    model_config = ConfigDict(from_attributes=True)
