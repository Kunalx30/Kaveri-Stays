# Kaveri Stays Hotel Booking Management System

Kaveri Stays is a full-stack hotel booking and property management system for public property discovery, guest reservations, payments, reviews, staff operations, management CRUD, and analytics reporting.

## Features

- Public property listing, property details, room type display, and availability search.
- Guest authentication with JWT access tokens, refresh token rotation, protected routes, booking history, payments, and reviews.
- Booking lifecycle support for creation, details, cancellation, check-in, check-out, and no-show operations.
- Payment checkout, payment details, payment history, and ownership isolation.
- Verified reviews with rating display, submission, edit, and delete flows.
- Staff portal for arrivals, departures, in-house guests, overdue check-ins, and booking operations.
- Management tools for properties, room types, rooms, and rate plans.
- Analytics dashboard for KPIs, booking status, revenue, occupancy, ratings, and property performance.

## User Roles

- Guest: browse properties, search availability, create bookings, manage own bookings, make payments, and manage own reviews.
- Staff: access staff operations for authorized property bookings.
- Manager: access staff operations, assigned-property management functions, and analytics where permitted by the backend.
- Owner: access staff operations, cross-property management, and analytics.

## Technology Stack

- Frontend: React, Vite, React Router, Axios, Tailwind CSS, lucide-react.
- Backend: FastAPI, SQLAlchemy, PostgreSQL, Pydantic, JWT authentication.
- Testing: pytest for backend regression tests, Vite production build for frontend verification.

## Architecture

React/Vite frontend -> Axios API client -> FastAPI backend -> SQLAlchemy -> PostgreSQL database.

The frontend reads `VITE_API_BASE_URL` and expects the backend v1 API prefix. The backend reads environment configuration with Pydantic settings from `backend/.env` when present.

## Project Structure

```text
backend/
  app/
    core/            Security, middleware, exception handling
    dependencies/    Authentication dependencies
    models/          SQLAlchemy models
    routers/         FastAPI route modules
    schemas/         Pydantic schemas
    services/        Business logic services
    main.py          FastAPI application entrypoint
  tests/             Backend regression tests
  requirements.txt
  .env.example
database/
  *.sql              Schema, seed, migration, and query scripts
frontend/
  src/
    api/             Axios client and API modules
    components/      Shared and feature components
    context/         Auth context
    layouts/         App layouts
    pages/           Route pages
    routes/          React Router configuration
  package.json
  .env.example
README.md
```

## Environment Variables

Backend example: `backend/.env.example`

```env
DATABASE_URL=postgresql+psycopg://postgres:your_password@localhost:5432/kaveri_stays
JWT_SECRET_KEY=replace_with_a_secure_random_64_char_hex_secret_key_here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=14
ENVIRONMENT=development
CORS_ORIGINS=["http://localhost:5173", "http://127.0.0.1:5173"]
HOST=0.0.0.0
PORT=8000
AUTH_RATE_LIMIT_PER_MINUTE=120
ENABLE_SECURITY_HEADERS=true
ENABLE_DEV_AUTH_UTILS=false
DEV_AUTH_UTILS_TOKEN=replace_with_local_dev_only_token_at_least_16_chars
```

Frontend example: `frontend/.env.example`

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

Do not commit real `.env` files or production secrets.

## Development Test Users

Unknown existing passwords cannot be recovered from bcrypt hashes. For local development/testing, enable guarded utilities only in `backend/.env`:

```env
ENVIRONMENT=development
ENABLE_DEV_AUTH_UTILS=true
DEV_AUTH_UTILS_TOKEN=choose_a_local_secret_at_least_16_chars
```

Then use Swagger at `/api/v1/docs`:

- `POST /api/v1/auth/dev/test-users/reset-password` resets an explicitly identified user's password and revokes existing refresh tokens.
- `DELETE /api/v1/auth/dev/test-users` deletes only the explicitly identified login user after `confirm_email` matches. The linked guest profile, bookings, payments, and reviews are preserved.

These endpoints return 404 unless the utilities are enabled, a dev/test environment is active, and the admin token matches.

## PostgreSQL Setup

Create a PostgreSQL database named `kaveri_stays` or update `DATABASE_URL` to match your local database. Apply the SQL scripts in `database/` according to the current schema/migration needs, then seed demo data if desired.

## Backend Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```

Backend API documentation is available at:

- Swagger UI: `http://localhost:8000/api/v1/docs`
- ReDoc: `http://localhost:8000/api/v1/redoc`
- Health check: `http://localhost:8000/health`
- Readiness check: `http://localhost:8000/health/ready`

## Frontend Setup

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

The frontend runs at `http://localhost:5173` by default.

## Major Frontend Routes

- `/`
- `/properties`
- `/properties/:propertyId`
- `/properties/:propertyId/availability`
- `/availability`
- `/login`
- `/register`
- `/dashboard`
- `/my-bookings`
- `/bookings/create`
- `/bookings/:bookingId`
- `/bookings/:bookingId/payment`
- `/my-payments`
- `/payments/:paymentId`
- `/my-reviews`
- `/bookings/:bookingId/review`
- `/reviews/:reviewId/edit`
- `/staff`
- `/staff/bookings`
- `/staff/bookings/:bookingId`
- `/management`
- `/management/properties`
- `/management/room-types`
- `/management/rooms`
- `/management/rate-plans`
- `/analytics`
- `/unauthorized`

## Testing

Frontend production build:

```bash
cd frontend
npm run build
```

Backend regression tests:

```bash
cd backend
pytest tests/ -v --show-capture=no
```

## Deployment Preparation

Recommended production shape:

```text
React/Vite static frontend
  -> HTTPS
FastAPI backend
  -> private PostgreSQL database
```

For deployment, set a production `VITE_API_BASE_URL`, a secure `JWT_SECRET_KEY`, a production `DATABASE_URL`, and explicit `CORS_ORIGINS` for the frontend domain. Keep PostgreSQL private and do not deploy with development fallback secrets.

## Future Improvements

- Add browser-based end-to-end test automation for the main guest, staff, manager, and owner journeys.
- Add frontend lint rules once the current UI stabilizes.
- Add CI for `npm run build` and backend pytest.
- Add production deployment manifests after the hosting target is selected.
