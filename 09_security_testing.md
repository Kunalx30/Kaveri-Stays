# Kaveri Stays — Phase 9: Security & Authorization Attack Testing Report

This document records the deliberate penetration, authorization boundary, and security attack tests executed against the **Kaveri-Stays FastAPI Backend** in Phase 9.

All attacks were executed via automated integration tests in [`backend/tests/test_security_attacks.py`](file:///c:/Synycs_Intern/Kaveri-Stays/backend/tests/test_security_attacks.py).

---

## Summary of Attack Results

| # | Attack Scenario | Endpoint / Target | Attacker Role | Expected Status | Actual Status | Result |
|---|---|---|---|---|---|---|
| 1 | Cross-Guest Data Access (IDOR) | `GET /api/v1/bookings/{id}` | Guest 2 | 403 Forbidden | 403 Forbidden | ✅ Blocked |
| 2 | Registration Privilege Escalation | `POST /api/v1/auth/register` | Anonymous | 201 (Role forced to Guest) | 201 (Role: 'guest') | ✅ Neutralized |
| 3 | JWT with Algorithm "none" | `GET /api/v1/auth/me` | Unauthenticated / Forged Token | 401 Unauthorized | 401 Unauthorized | ✅ Blocked |
| 4 | JWT Signed with Wrong Secret | `GET /api/v1/auth/me` | Unauthenticated / Forged Token | 401 Unauthorized | 401 Unauthorized | ✅ Blocked |
| 5 | Expired Access Token | `GET /api/v1/auth/me` | Expired Token User | 401 Unauthorized | 401 Unauthorized | ✅ Blocked |
| 6 | Refresh Token Replay (Rotated Token) | `POST /api/v1/auth/refresh` | Replay Attacker | 401 Unauthorized | 401 Unauthorized | ✅ Blocked |
| 7 | Cross-Property Manager Escalation | `POST /api/v1/rooms`, `/analytics` | Manager (Property 1) | 403 Forbidden | 403 Forbidden | ✅ Blocked |
| 8 | Staff Privilege Escalation | `POST /properties`, `POST /room-types` | Staff (Property 1) | 403 Forbidden | 403 Forbidden | ✅ Blocked |
| 9 | Guest Management Access | `POST /properties`, `POST /rooms`, `/analytics` | Guest | 403 Forbidden | 403 Forbidden | ✅ Blocked |
| 10 | Client Price Manipulation | `POST /api/v1/bookings` | Guest (`nightly_rate=0.50`) | 201 (Server overrides rate) | 201 (Authoritative RatePlan used) | ✅ Neutralized |
| 11 | Review Eligibility Bypass | `POST /api/v1/reviews` | Guest (Confirmed status) | 400 Bad Request | 400 Bad Request | ✅ Blocked |
| 12 | Concurrent Double Booking Race Condition | `POST /api/v1/bookings` (Simultaneous) | 2 Concurrent Guests | One 201, One 409 Conflict | 201 / 409 Conflict | ✅ Blocked (Exclusion Constraint) |
| 13 | SQL Injection via API Inputs | `GET /properties?city=...`, `GET /rooms?property_id=...` | Anonymous / Authenticated | Parameterized / 422 | Parameterized / 422 | ✅ Neutralized |
| 14 | Systematic IDOR / Object Authorization | `GET /payments`, `GET /analytics/properties/{id}` | Guest / Cross-Tenant | 200 (Scoped) / 403 | 200 (0 results) / 403 | ✅ Blocked |
| 15 | Error Information Leakage | `GET /properties/999999999` | Anonymous | 404 Clean JSON | 404 Clean JSON | ✅ Clean (No stack traces) |
| 16 | Sensitive Response Data Inspection | `GET /auth/me`, `/auth/login`, `/bookings` | All Roles | No secret leaks | Clean JSON (No password_hash) | ✅ Clean |

---

## Detailed Attack Test Records

### Attack Test 1 — Cross-Guest Data Access (IDOR)
- **Endpoint**: `GET /api/v1/bookings/{guest1_booking_id}`, `POST /api/v1/bookings/{guest1_booking_id}/cancel`, `POST /api/v1/reviews`
- **Role/User Used**: `Guest 2` (`attacker.guest@kaveristays.com`) attempting access to `Guest 1`'s booking (#238).
- **Attack Payload / Technique**: Injected victim's `booking_id` directly into path and request body.
- **Expected Behavior**: Access denied with `403 Forbidden`.
- **Actual HTTP Status**: `403 Forbidden`.
- **Actual Response**: `{"detail": "Access denied: You can only view your own bookings."}`
- **Security Mechanism**: Application-level guest isolation check (`booking.guest_id == current_user.guest_id`) in router and service layers.
- **Vulnerability Discovered**: None.

---

### Attack Test 2 — Privilege Escalation during Registration
- **Endpoint**: `POST /api/v1/auth/register`
- **Role/User Used**: Anonymous public registration.
- **Attack Payload / Technique**: JSON body containing malicious fields `{"role": "owner", "property_id": 1, "is_active": true, "user_id": 99999}`.
- **Expected Behavior**: Server ignores or strips unauthorized fields; strictly creates a `guest` account with `property_id = NULL`.
- **Actual HTTP Status**: `201 Created`.
- **Actual Response**: Created user has `role = "guest"`, `property_id = null`.
- **Security Mechanism**: Pydantic `UserRegisterRequest` schema isolates permitted registration attributes; `auth_service.register_guest` hardcodes `role=UserRole.guest`.
- **Vulnerability Discovered**: None.

---

### Attack Test 3 — JWT with Algorithm "none"
- **Endpoint**: `GET /api/v1/auth/me`
- **Role/User Used**: Unauthenticated attacker presenting an unsigned forged token (`alg: "none"`).
- **Attack Payload / Technique**: Header `{"alg": "none", "typ": "JWT"}` and forged payload with `role: "owner"`.
- **Expected Behavior**: Rejected with `401 Unauthorized`.
- **Actual HTTP Status**: `401 Unauthorized`.
- **Actual Response**: `{"detail": "Could not validate credentials."}`
- **Security Mechanism**: `python-jose` explicitly validates HMAC signature against configured algorithm (`HS256`).
- **Vulnerability Discovered**: None.

---

### Attack Test 4 — JWT Signed with Wrong Secret
- **Endpoint**: `GET /api/v1/auth/me`
- **Role/User Used**: Attacker crafting a token signed with `"attacker-malicious-fake-secret-key-1234567890"`.
- **Attack Payload / Technique**: Valid claims (`sub: "1"`, `role: "owner"`) signed by external secret.
- **Expected Behavior**: Rejected with `401 Unauthorized`.
- **Actual HTTP Status**: `401 Unauthorized`.
- **Actual Response**: `{"detail": "Could not validate credentials."}`
- **Security Mechanism**: Cryptographic signature validation in `get_current_user`.
- **Vulnerability Discovered**: None.

---

### Attack Test 5 — Expired Access Token
- **Endpoint**: `GET /api/v1/auth/me`
- **Role/User Used**: Token with `exp` timestamp in the past (`now - 2 hours`).
- **Attack Payload / Technique**: Expired valid-signature JWT bearer token.
- **Expected Behavior**: Rejected with `401 Unauthorized`.
- **Actual HTTP Status**: `401 Unauthorized`.
- **Actual Response**: `{"detail": "Could not validate credentials."}`
- **Security Mechanism**: JWT standard `exp` claim validation in `jose.jwt.decode`.
- **Vulnerability Discovered**: None.

---

### Attack Test 6 — Refresh Token Replay
- **Endpoint**: `POST /api/v1/auth/refresh`
- **Role/User Used**: Attacker re-submitting an already-used Refresh Token A after rotation.
- **Attack Payload / Technique**: Replay of `raw_refresh_token` that was revoked during a prior refresh exchange.
- **Expected Behavior**: Rejected with `401 Unauthorized`.
- **Actual HTTP Status**: `401 Unauthorized`.
- **Actual Response**: `{"detail": "Refresh token is invalid or has been revoked."}`
- **Security Mechanism**: Single-use rotation token tracking (`RefreshToken.revoked = True` upon consumption).
- **Vulnerability Discovered**: None.

---

### Attack Test 7 — Cross-Property Manager Access
- **Endpoint**: `POST /api/v1/rooms`, `GET /api/v1/analytics/dashboard?property_id=2`, `POST /api/v1/rate-plans`
- **Role/User Used**: Manager of Property 1 (`manager.riverside@kaveristays.com`).
- **Attack Payload / Technique**: Injected `property_id: 2` (Kaveri Hilltop) in path and query parameters.
- **Expected Behavior**: Access denied with `403 Forbidden`.
- **Actual HTTP Status**: `403 Forbidden`.
- **Actual Response**: `{"detail": "Access denied: You are assigned to property ID 1, not 2."}`
- **Security Mechanism**: Centralized `check_property_access(current_user, property_id)` validation.
- **Vulnerability Discovered**: None.

---

### Attack Test 8 — Staff Privilege Escalation
- **Endpoint**: `POST /api/v1/properties`, `POST /api/v1/room-types`, `GET /api/v1/analytics/dashboard`, `DELETE /api/v1/reviews/{id}`
- **Role/User Used**: Staff Member (`staff.riverside@kaveristays.com`).
- **Attack Payload / Technique**: Attempted management/financial actions reserved for Owner or Manager.
- **Expected Behavior**: Access denied with `403 Forbidden`.
- **Actual HTTP Status**: `403 Forbidden`.
- **Actual Response**: `{"detail": "Operation not permitted for role 'staff'."}`
- **Security Mechanism**: `require_roles([UserRole.owner, UserRole.manager])` dependency enforcement.
- **Vulnerability Discovered**: None.

---

### Attack Test 9 — Guest Management Access
- **Endpoint**: `POST /api/v1/properties`, `POST /api/v1/rooms`, `POST /api/v1/rate-plans`, `GET /api/v1/analytics/dashboard`
- **Role/User Used**: Authenticated Guest (`guest.demo@kaveristays.com`).
- **Attack Payload / Technique**: Accessing internal hotel inventory and management endpoints.
- **Expected Behavior**: Access denied with `403 Forbidden`.
- **Actual HTTP Status**: `403 Forbidden`.
- **Actual Response**: `{"detail": "Operation not permitted for role 'guest'."}`
- **Security Mechanism**: Strict role checking on all administrative routers.
- **Vulnerability Discovered**: None.

---

### Attack Test 10 — Client Price Manipulation
- **Endpoint**: `POST /api/v1/bookings`
- **Role/User Used**: Authenticated Guest.
- **Attack Payload / Technique**: Sending `"nightly_rate": 0.50` in booking creation JSON.
- **Expected Behavior**: Server disregards client-provided rate and computes price from DB `RatePlan`.
- **Actual HTTP Status**: `201 Created`.
- **Actual Response**: Booking created with authoritative DB rate (`nightly_rate = 3500.00`).
- **Security Mechanism**: Router enforces `custom_rate = None` for `UserRole.guest`, invoking `booking_service.resolve_nightly_rate`.
- **Vulnerability Discovered**: None.

---

### Attack Test 11 — Review Eligibility Bypass
- **Endpoint**: `POST /api/v1/reviews`
- **Role/User Used**: Authenticated Guest.
- **Attack Payload / Technique**: Submitting a review for a booking that is currently in `confirmed` status (stay not completed).
- **Expected Behavior**: Rejected with `400 Bad Request`.
- **Actual HTTP Status**: `400 Bad Request`.
- **Actual Response**: `{"detail": "Reviews can only be submitted for completed (checked-out) stays. Current status: 'confirmed'."}`
- **Security Mechanism**: Booking status lifecycle check in `review_service.create_review`.
- **Vulnerability Discovered**: None.

---

### Attack Test 12 — Concurrent Double Booking Race Condition
- **Endpoint**: `POST /api/v1/bookings`
- **Role/User Used**: Two distinct guests firing simultaneous POST requests via `asyncio.gather` for Room 2 on identical dates `[2042-05-10, 2042-05-15)`.
- **Attack Payload / Technique**: High-speed race condition attempting to bypass application-level pre-checks.
- **Expected Behavior**: Exactly one booking succeeds (`201 Created`), the other is rejected (`409 Conflict`).
- **Actual HTTP Status**: `201 Created` / `409 Conflict`.
- **Actual Response**: Conflict booking returned `{"detail": "Double booking conflict: Room 2 is already booked for the selected stay dates..."}`
- **Security Mechanism**: PostgreSQL GiST exclusion constraint (`no_overlapping_bookings`) backed by `integrity_error_handler` converting DB constraint violations into clean 409 Conflict responses.
- **Vulnerability Discovered**: None.

---

### Attack Test 13 — SQL Injection via API Inputs
- **Endpoint**: `GET /api/v1/properties?city=' OR '1'='1`, `GET /api/v1/rooms?property_id=1; DROP TABLE properties;--`, `GET /api/v1/reviews?rating=5' OR '1'='1`
- **Role/User Used**: Anonymous / Owner.
- **Attack Payload / Technique**: Classic SQL injection fragments and destructive SQL injection payloads.
- **Expected Behavior**: Safe handling via SQLAlchemy parameterized queries or Pydantic type validation rejecting with `422`.
- **Actual HTTP Status**: `200 OK` (safely parameterized search for literal string) / `422 Unprocessable Entity`.
- **Actual Response**: No unintended records returned; tables intact.
- **Security Mechanism**: SQLAlchemy Core parameter binding and FastAPI Pydantic type coercion.
- **Vulnerability Discovered**: None.

---

### Attack Test 14 — Systematic IDOR on Resource Endpoints
- **Endpoint**: `GET /api/v1/payments?booking_id=...`, `GET /api/v1/analytics/properties/1`
- **Role/User Used**: Guest 2 attempting to view Guest 1's payments.
- **Attack Payload / Technique**: ID tampering on query parameters and path parameters.
- **Expected Behavior**: Cross-tenant data filtered out (empty list) or rejected with `403 Forbidden`.
- **Actual HTTP Status**: `200 OK` (0 results returned) / `403 Forbidden`.
- **Actual Response**: Empty list `[]` (payments automatically scoped to authenticated `guest_id`).
- **Security Mechanism**: Server-side filtering using authenticated user identity context (`current_user.guest_id`).
- **Vulnerability Discovered**: None.

---

### Attack Test 15 — Error Information Leakage
- **Endpoint**: `GET /api/v1/properties/999999999`
- **Role/User Used**: Anonymous.
- **Attack Payload / Technique**: Requesting non-existent entity and malformed parameters.
- **Expected Behavior**: Clean JSON response with no Python stacktraces, file paths, or SQL queries.
- **Actual HTTP Status**: `404 Not Found`.
- **Actual Response**: `{"detail": "Property with ID 999999999 not found."}`
- **Security Mechanism**: Controlled HTTPException raising and custom exception handlers.
- **Vulnerability Discovered**: None.

---

### Attack Test 16 — Sensitive Response Data Inspection
- **Endpoint**: `GET /api/v1/auth/me`, `POST /api/v1/auth/login`, `GET /api/v1/bookings`
- **Role/User Used**: Owner / Guest.
- **Attack Payload / Technique**: Inspecting returned JSON schemas for credential leaks.
- **Expected Behavior**: No `password_hash`, `token_hash`, or internal secrets in response payloads.
- **Actual HTTP Status**: `200 OK`.
- **Actual Response**: Response models strictly contain public fields defined in Pydantic schemas.
- **Security Mechanism**: Strict Pydantic response models (`response_model=UserResponse`, etc.).
- **Vulnerability Discovered**: None.

---

## Conclusion
All 16 security and attack scenarios were successfully tested against the live backend API. The defensive measures (real-time JWT authentication, RBAC authorization factories, PostgreSQL exclusion constraints, parameter binding, Pydantic type validation, and refresh token rotation) prevented all unauthorized actions and data leakage.
