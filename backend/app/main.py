from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import IntegrityError

from app.config import settings
from app.database import get_db
from app.core.exceptions import integrity_error_handler
from app.routers import (
    auth_router,
    properties_router,
    room_types_router,
    rooms_router,
    rate_plans_router,
    bookings_router,
    payments_router,
    reviews_router,
    availability_router
)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Kaveri Stays: Full-Stack Hotel Booking and Property Management REST API",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc"
)

# Register custom exception handlers for database constraints
app.add_exception_handler(IntegrityError, integrity_error_handler)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else [settings.CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(properties_router, prefix=settings.API_V1_STR)
app.include_router(room_types_router, prefix=settings.API_V1_STR)
app.include_router(rooms_router, prefix=settings.API_V1_STR)
app.include_router(rate_plans_router, prefix=settings.API_V1_STR)
app.include_router(bookings_router, prefix=settings.API_V1_STR)
app.include_router(payments_router, prefix=settings.API_V1_STR)
app.include_router(reviews_router, prefix=settings.API_V1_STR)
app.include_router(availability_router, prefix=settings.API_V1_STR)


@app.get("/health", tags=["Health"])
def health_check():
    """Health check endpoint to verify backend service status."""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT
    }


@app.get("/health/db", tags=["Health"])
def database_health_check(db = Depends(get_db)):
    """Database connectivity health check."""
    try:
        from sqlalchemy import text
        result = db.execute(text("SELECT current_database(), count(*) FROM properties;")).fetchone()
        return {
            "status": "healthy",
            "database": result[0],
            "properties_count": result[1]
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }


@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Welcome to Kaveri Stays API",
        "docs": f"{settings.API_V1_STR}/docs",
        "version": "1.0.0"
    }
