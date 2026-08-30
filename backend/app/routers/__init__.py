from app.routers.auth import router as auth_router
from app.routers.properties import router as properties_router
from app.routers.room_types import router as room_types_router
from app.routers.rooms import router as rooms_router
from app.routers.rate_plans import router as rate_plans_router
from app.routers.bookings import router as bookings_router
from app.routers.payments import router as payments_router
from app.routers.reviews import router as reviews_router

__all__ = [
    "auth_router",
    "properties_router",
    "room_types_router",
    "rooms_router",
    "rate_plans_router",
    "bookings_router",
    "payments_router",
    "reviews_router"
]
