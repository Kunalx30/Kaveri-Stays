"""
Production middleware for security headers, request timing, and observability.
"""
import time
import logging
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response
from app.config import settings

logger = logging.getLogger("kaveri_stays.access")


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Attaches standard production security headers to all HTTP responses:
    - X-Content-Type-Options: Prevents MIME-sniffing.
    - X-Frame-Options: Prevents clickjacking (DENY for API, allow for Swagger docs).
    - Referrer-Policy: Controls referrer information.
    - X-XSS-Protection: Legacy XSS filtering.
    """
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        response = await call_next(request)
        if settings.ENABLE_SECURITY_HEADERS:
            response.headers["X-Content-Type-Options"] = "nosniff"
            response.headers["X-Frame-Options"] = "DENY"
            response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
            response.headers["X-XSS-Protection"] = "1; mode=block"
        return response


class RequestTimingMiddleware(BaseHTTPMiddleware):
    """
    Measures request processing duration and logs access metrics without exposing sensitive bodies or tokens.
    Attaches X-Process-Time header (in seconds).
    """
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        start_time = time.perf_counter()
        response = await call_next(request)
        process_time = time.perf_counter() - start_time
        response.headers["X-Process-Time"] = f"{process_time:.4f}"
        
        # Lightweight structured access logging (skips sensitive paths/headers)
        if not request.url.path.startswith(("/docs", "/redoc", "/openapi.json")):
            logger.info(
                f"{request.method} {request.url.path} -> status={response.status_code} "
                f"duration={process_time * 1000:.2f}ms"
            )
        return response
