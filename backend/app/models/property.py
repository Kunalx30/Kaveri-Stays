import builtins
from sqlalchemy import Column, Integer, String, SmallInteger, ForeignKey, UniqueConstraint, Numeric
from sqlalchemy.dialects.postgresql import DATERANGE
from sqlalchemy.orm import relationship
from app.database import Base


class Property(Base):
    __tablename__ = "properties"

    property_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    city = Column(String(100), nullable=False)
    star_rating = Column(SmallInteger, nullable=False)

    # Relationships
    rooms = relationship("Room", back_populates="property", cascade="all, delete-orphan")
    rate_plans = relationship("RatePlan", back_populates="property", cascade="all, delete-orphan")
    users = relationship("User", back_populates="property")


class RoomType(Base):
    __tablename__ = "room_types"

    room_type_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    max_occupancy = Column(SmallInteger, nullable=False)

    # Relationships
    rooms = relationship("Room", back_populates="room_type")
    rate_plans = relationship("RatePlan", back_populates="room_type")


class Room(Base):
    __tablename__ = "rooms"

    room_id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.property_id", ondelete="RESTRICT"), nullable=False)
    room_number = Column(String(10), nullable=False)
    room_type_id = Column(Integer, ForeignKey("room_types.room_type_id", ondelete="RESTRICT"), nullable=False)

    __table_args__ = (
        UniqueConstraint("property_id", "room_number", name="uq_property_room_number"),
    )

    # Relationships
    property = relationship("Property", back_populates="rooms")
    room_type = relationship("RoomType", back_populates="rooms")
    bookings = relationship("Booking", back_populates="room")


class RatePlan(Base):
    __tablename__ = "rate_plans"

    rate_plan_id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.property_id", ondelete="CASCADE"), nullable=False)
    room_type_id = Column(Integer, ForeignKey("room_types.room_type_id", ondelete="CASCADE"), nullable=False)
    season_name = Column(String(50), nullable=True)
    valid = Column(DATERANGE, nullable=False)
    nightly_rate = Column(Numeric(10, 2), nullable=False)

    # Relationships
    property = relationship("Property", back_populates="rate_plans")
    room_type = relationship("RoomType", back_populates="rate_plans")

    @builtins.property
    def valid_from(self):
        return self.valid.lower if self.valid else None

    @builtins.property
    def valid_to(self):
        return self.valid.upper if self.valid else None
