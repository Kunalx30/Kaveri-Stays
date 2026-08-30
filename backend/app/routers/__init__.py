from app.routers.auth import router as auth_router
from app.routers.properties import router as properties_router
from app.routers.room_types import router as room_types_router

__all__ = [
    "auth_router",
    "properties_router",
    "room_types_router"
]
