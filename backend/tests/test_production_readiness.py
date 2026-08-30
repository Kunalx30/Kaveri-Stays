"""
Phase 10: Production Readiness, API Quality, Observability & Security Headers Test Suite

Tests all required Phase 10 verification items:
  1.  Liveness health probe (GET /health) returns 200 OK
  2.  Database health probe (GET /health/db) returns 200 OK without secret leakage
  3.  Readiness health probe (GET /health/ready) returns 200 OK with latency_ms
  4.  Security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, X-XSS-Protection) are present
  5.  Request timing header (X-Process-Time) is present on responses
  6.  Authentication rate limiter tracks requests and triggers 429 Too Many Requests when limit exceeded
  7.  Rate limit response includes Retry-After header
  8.  Rate limits can be reset cleanly
  9.  Swagger UI (/api/v1/docs) loads successfully (200 OK)
  10. ReDoc (/api/v1/redoc) loads successfully (200 OK)
  11. OpenAPI JSON schema (/api/v1/openapi.json) loads with complete tag metadata
  12. CORS preflight OPTIONS request returns configured CORS headers
  13. Centralized error handling returns clean sanitized JSON
"""
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.rate_limit import reset_rate_limits, _request_history
from app.config import settings

BASE = "/api/v1"


@pytest.mark.asyncio
async def test_production_readiness_suite():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:

        # ── TEST 1: Liveness Health Probe ───────────────────────────────────
        res_live = await client.get("/health")
        assert res_live.status_code == 200
        live_json = res_live.json()
        assert live_json["status"] == "healthy"
        assert "environment" in live_json
        print(f"[PASSED] Test 1: Liveness check /health returned status='{live_json['status']}'.")

        # ── TEST 2: Database Health Probe ────────────────────────────────────
        res_db = await client.get("/health/db")
        assert res_db.status_code == 200
        db_json = res_db.json()
        assert db_json["status"] == "healthy"
        assert db_json["properties_count"] >= 3
        # Ensure credentials/passwords are NOT leaked in response
        assert "password" not in res_db.text.lower()
        assert "secret" not in res_db.text.lower()
        print(f"[PASSED] Test 2: Database health check /health/db returned status='{db_json['status']}' (Properties: {db_json['properties_count']}).")

        # ── TEST 3: Readiness Health Probe ───────────────────────────────────
        res_ready = await client.get("/health/ready")
        assert res_ready.status_code == 200
        ready_json = res_ready.json()
        assert ready_json["status"] == "ready"
        assert ready_json["database"] == "connected"
        assert "latency_ms" in ready_json
        assert ready_json["latency_ms"] >= 0
        print(f"[PASSED] Test 3: Readiness check /health/ready returned status='{ready_json['status']}' (Latency: {ready_json['latency_ms']}ms).")

        # ── TEST 4: Security Headers Middleware ──────────────────────────────
        res_sec = await client.get(f"{BASE}/properties")
        assert res_sec.status_code == 200
        headers = res_sec.headers
        assert headers.get("X-Content-Type-Options") == "nosniff"
        assert headers.get("X-Frame-Options") == "DENY"
        assert headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"
        assert headers.get("X-XSS-Protection") == "1; mode=block"
        print("[PASSED] Test 4: Security response headers attached (nosniff, DENY, strict-origin, XSS-Protection).")

        # ── TEST 5: Request Timing Header ────────────────────────────────────
        assert "X-Process-Time" in headers
        process_time = float(headers["X-Process-Time"])
        assert process_time >= 0
        print(f"[PASSED] Test 5: Request timing header X-Process-Time present ({process_time * 1000:.2f}ms).")

        # ── TEST 6 & 7: Authentication Rate Limiting ─────────────────────────
        reset_rate_limits()
        original_limit = settings.AUTH_RATE_LIMIT_PER_MINUTE
        # Temporarily lower limit to test 429 threshold quickly
        settings.AUTH_RATE_LIMIT_PER_MINUTE = 5
        try:
            responses = []
            for _ in range(6):
                r = await client.post(f"{BASE}/auth/login", json={"email": "wrong@test.com", "password": "wrong"})
                responses.append(r.status_code)
            
            # The 6th request must be rejected with 429 Too Many Requests
            assert 429 in responses, f"Expected 429 in rate-limited responses, got: {responses}"
            last_resp = await client.post(f"{BASE}/auth/login", json={"email": "wrong@test.com", "password": "wrong"})
            assert last_resp.status_code == 429
            assert "Retry-After" in last_resp.headers
            assert "rate limit exceeded" in last_resp.json()["detail"].lower()
            print("[PASSED] Tests 6 & 7: Auth rate limiter triggered HTTP 429 with Retry-After header.")
        finally:
            settings.AUTH_RATE_LIMIT_PER_MINUTE = original_limit
            reset_rate_limits()

        # ── TEST 8: Rate Limit Reset Helper ──────────────────────────────────
        reset_rate_limits()
        res_after_reset = await client.post(f"{BASE}/auth/login", json={"email": "owner@kaveristays.com", "password": "Password@123"})
        assert res_after_reset.status_code == 200
        print("[PASSED] Test 8: Rate limit counters reset cleanly.")

        # ── TEST 9, 10 & 11: Documentation & OpenAPI Schema ──────────────────
        res_docs = await client.get(f"{BASE}/docs")
        assert res_docs.status_code == 200
        res_redoc = await client.get(f"{BASE}/redoc")
        assert res_redoc.status_code == 200
        res_openapi = await client.get(f"{BASE}/openapi.json")
        assert res_openapi.status_code == 200
        openapi_data = res_openapi.json()
        assert "paths" in openapi_data
        assert "openapi_tags" in str(openapi_data) or "tags" in openapi_data
        print(f"[PASSED] Tests 9, 10 & 11: Swagger Docs, ReDoc, and OpenAPI Schema ({len(openapi_data['paths'])} endpoints) verified.")

        # ── TEST 12: CORS Configuration ──────────────────────────────────────
        cors_headers = {
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET"
        }
        res_cors = await client.options(f"{BASE}/properties", headers=cors_headers)
        assert res_cors.status_code == 200
        assert res_cors.headers.get("access-control-allow-origin") == "http://localhost:5173"
        print("[PASSED] Test 12: CORS preflight headers correctly served for allowed origin.")

        # ── TEST 13: Clean Validation Responses ──────────────────────────────
        res_val = await client.get(f"{BASE}/availability?check_in=2025-01-01")
        assert res_val.status_code == 422
        val_body = res_val.json()
        assert "detail" in val_body
        assert isinstance(val_body["detail"], list)
        print("[PASSED] Test 13: Parameter validation errors formatted cleanly (422 Unprocessable Entity).")

        print("\n[ALL PASSED] All Production Readiness & API Quality tests passed!")
