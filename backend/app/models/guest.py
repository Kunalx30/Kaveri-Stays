from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base


class Guest(Base):
    __tablename__ = "guests"

    guest_id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(150), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(30), nullable=True)
    city = Column(String(100), nullable=True)

    # Relationships
    bookings = relationship("Booking", back_populates="guest")
    user = relationship("User", back_populates="guest", uselist=False)
