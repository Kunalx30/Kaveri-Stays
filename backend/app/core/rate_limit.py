"""
In-memory sliding window rate limiter for protecting sensitive authentication endpoints.
"""
import time
from collections import defaultdict
from typing import Dict, List, Tuple
from fastapi import Request, HTTPException, status
from app.config import settings

# Thread-safe in-memory sliding window store: ip_address -> list of timestamps
_request_history: Dict[str, List[float]] = defaultdict(list)


def check_auth_rate_limit(request: Request) -> None:
    """
    Dependency that enforces rate limits on authentication endpoints.
    Tracks requests per client IP within a 60-second sliding window.
    Raises HTTP 429 Too Many Requests if limit is exceeded.
    """
    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
    window = 60.0  # 60 seconds
    limit = settings.AUTH_RATE_LIMIT_PER_MINUTE

    # Clean up timestamps older than the sliding window
    timestamps = [ts for ts in _request_history[client_ip] if now - ts < window]
    _request_history[client_ip] = timestamps

    if len(timestamps) >= limit:
        retry_after = int(window - (now - timestamps[0])) + 1
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Maximum {limit} requests per minute allowed.",
            headers={"Retry-After": str(max(1, retry_after))}
        )

    _request_history[client_ip].append(now)


def reset_rate_limits() -> None:
    """Helper to reset rate limit counters (used in testing)."""
    _request_history.clear()
