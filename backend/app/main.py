import time
import logging
from fastapi import FastAPI, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError
from sqlalchemy import text

from app.config import settings
from app.database import get_db
from app.core.exceptions import integrity_error_handler, global_exception_handler
from app.core.middleware import SecurityHeadersMiddleware, RequestTimingMiddleware
from app.routers import (
    auth_router,
    properties_router,
    room_types_router,
    rooms_router,
    rate_plans_router,
    bookings_router,
    payments_router,
    reviews_router,
    availability_router,
    analytics_router
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("kaveri_stays.app")

# OpenAPI Tags Metadata for documentation clarity
openapi_tags = [
    {"name": "Authentication", "description": "User registration, JWT login, OAuth2 token, token refresh, and profile endpoints."},
    {"name": "Properties", "description": "Multi-property hotel management with Star Ratings and property isolation."},
    {"name": "Room Types", "description": "Room category definitions and maximum occupancy constraints."},
    {"name": "Rooms", "description": "Physical room inventory linked to properties and room types."},
    {"name": "Rate Plans", "description": "Seasonal dynamic pricing with PostgreSQL DATERANGE validity intervals."},
    {"name": "Bookings", "description": "Reservation lifecycle management, double-booking prevention, and state transitions."},
    {"name": "Payments", "description": "Payment processing, multi-payment support, balance verification, and idempotency keys."},
    {"name": "Reviews", "description": "Verified guest reviews and ratings (1-5 stars) on completed stays."},
    {"name": "Availability", "description": "Real-time room search and occupancy-based discovery with rate lookups."},
    {"name": "Analytics", "description": "Aggregated business metrics, revenue summaries, occupancy rates, and property comparisons."},
    {"name": "Health", "description": "Liveness, readiness, and database operational health check endpoints."}
]

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="**Kaveri Stays**: Full-Stack Hotel Booking and Property Management REST API built with FastAPI, PostgreSQL, and SQLAlchemy.",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    openapi_tags=openapi_tags
)

# 1. Custom Exception Handlers
app.add_exception_handler(IntegrityError, integrity_error_handler)
app.add_exception_handler(Exception, global_exception_handler)

# 2. Security Headers & Request Timing Middleware
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestTimingMiddleware)

# 3. CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else [settings.CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. Mount API Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(properties_router, prefix=settings.API_V1_STR)
app.include_router(room_types_router, prefix=settings.API_V1_STR)
app.include_router(rooms_router, prefix=settings.API_V1_STR)
app.include_router(rate_plans_router, prefix=settings.API_V1_STR)
app.include_router(bookings_router, prefix=settings.API_V1_STR)
app.include_router(payments_router, prefix=settings.API_V1_STR)
app.include_router(reviews_router, prefix=settings.API_V1_STR)
app.include_router(availability_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix=settings.API_V1_STR)


# ── Operational Health & Readiness Probes ──────────────────────────────────────

@app.get("/health", tags=["Health"])
def health_check():
    """
    Liveness probe: Verifies that the FastAPI process is running.
    """
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "timestamp": time.time()
    }


@app.get("/health/db", tags=["Health"])
def database_health_check(db = Depends(get_db)):
    """
    Database connectivity probe: Verifies active database connection.
    """
    try:
        result = db.execute(text("SELECT current_database(), count(*) FROM properties;")).fetchone()
        return {
            "status": "healthy",
            "database": result[0],
            "properties_count": result[1]
        }
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "unhealthy", "error": "Database connectivity failed."}
        )


@app.get("/health/ready", tags=["Health"])
def readiness_check(db = Depends(get_db)):
    """
    Readiness probe: Verifies that the service is ready to accept incoming traffic.
    Checks application state and database round-trip latency without exposing credentials.
    """
    start_t = time.perf_counter()
    try:
        db.execute(text("SELECT 1;")).fetchone()
        latency_ms = round((time.perf_counter() - start_t) * 1000, 2)
        return {
            "status": "ready",
            "database": "connected",
            "latency_ms": latency_ms,
            "environment": settings.ENVIRONMENT
        }
    except Exception as e:
        logger.error(f"Readiness check failed: {e}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "not_ready", "database": "disconnected"}
        )


@app.get("/", tags=["Health"])
def root():
    return {
        "message": "Welcome to Kaveri Stays API",
        "docs": f"{settings.API_V1_STR}/docs",
        "version": "1.0.0"
    }
