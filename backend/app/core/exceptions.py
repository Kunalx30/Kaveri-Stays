"""Custom exceptions and database error handlers."""
import logging
from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError

logger = logging.getLogger("kaveri_stays.errors")


class DoubleBookingConflictException(HTTPException):
    def __init__(self, detail: str = "Room is already booked for the selected dates."):
        super().__init__(status_code=status.HTTP_409_CONFLICT, detail=detail)


class IdempotencyConflictException(HTTPException):
    def __init__(self, detail: str = "A payment request with this idempotency key is currently in progress."):
        super().__init__(status_code=status.HTTP_409_CONFLICT, detail=detail)


class PropertyForbiddenException(HTTPException):
    def __init__(self, detail: str = "You do not have permission to access this property's resources."):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


async def integrity_error_handler(request: Request, exc: IntegrityError):
    """
    Catch PostgreSQL GiST exclusion / unique / check violations and map to clean HTTP responses.
    """
    orig_msg = str(exc.orig).lower() if exc.orig else str(exc).lower()
    
    if "no_overlapping_bookings" in orig_msg or "exclusion_violation" in orig_msg:
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={"detail": "Double booking conflict: The requested room is unavailable for the specified date range."}
        )
    elif "uq_guests_email_lower" in orig_msg or "uq_users_email_lower" in orig_msg:
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={"detail": "A user or guest with this email address already exists."}
        )
    elif "no_overlapping_rates" in orig_msg:
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={"detail": "Rate plan conflict: Overlapping seasonal rate exists for this room type."}
        )
    elif "unique" in orig_msg or "uq_" in orig_msg:
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={"detail": "A uniqueness constraint was violated."}
        )
    
    logger.error(f"Unhandled Database Integrity Violation on {request.method} {request.url.path}: {exc}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": "Database integrity constraint violation."}
    )


async def global_exception_handler(request: Request, exc: Exception):
    """
    Centralized catch-all handler for unexpected server errors (HTTP 500).
    Logs the full internal error and stacktrace safely without leaking details to clients.
    """
    logger.error(f"Unhandled Server Exception on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Please try again later."}
    )

