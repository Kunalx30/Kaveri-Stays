from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class RoomTypeBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=50, description="Unique name of the room type")
    max_occupancy: int = Field(..., ge=1, le=20, description="Maximum guest occupancy (1 to 20)")


class RoomTypeCreate(RoomTypeBase):
    pass


class RoomTypeUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=50, description="Updated room type name")
    max_occupancy: Optional[int] = Field(None, ge=1, le=20, description="Updated maximum guest occupancy (1 to 20)")


class RoomTypeResponse(RoomTypeBase):
    room_type_id: int

    model_config = ConfigDict(from_attributes=True)
