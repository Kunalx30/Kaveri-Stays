# 🏞️ Kaveri Stays

**A full-stack hotel booking and property management system** — built for public property discovery, guest reservations, payments, reviews, staff operations, management CRUD, and analytics reporting.

🔗 **Live App:** [https://kaveri-stays.nyrvexa.in/](https://kaveri-stays.nyrvexa.in/)

![React](https://img.shields.io/badge/React-Vite-61DAFB?logo=react&logoColor=black)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?logo=fastapi&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1?logo=postgresql&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-lightgrey)

---

## 📸 Screenshots

| | |
|---|---|
| ![Screenshot 1](./Screenshots/Screenshot%202026-09-04%20165647.png) | ![Screenshot 2](./Screenshots/Screenshot%202026-09-04%20165719.png) |

---

## 📖 Overview

Kaveri Stays is an end-to-end riverside villa/hotel booking platform that supports the complete guest journey — from browsing properties and checking availability, to booking, paying, and reviewing a stay — alongside the operational tooling staff, managers, and owners need to run properties day to day.

## ✨ Features

- 🏨 **Public Discovery** — property listings, property details, room type display, and availability search.
- 🔐 **Guest Authentication** — JWT access tokens with refresh token rotation, protected routes, booking history, payments, and reviews.
- 📅 **Booking Lifecycle** — creation, details, cancellation, check-in, check-out, and no-show handling.
- 💳 **Payments** — checkout flow, payment details, payment history, and strict ownership isolation.
- ⭐ **Verified Reviews** — rating display, submission, edit, and delete flows.
- 🧑‍💼 **Staff Portal** — arrivals, departures, in-house guests, overdue check-ins, and booking operations.
- 🛠️ **Management Tools** — properties, room types, rooms, and rate plans.
- 📊 **Analytics Dashboard** — KPIs, booking status, revenue, occupancy, ratings, and property performance.

## 👥 User Roles

| Role | Access |
|---|---|
| **Guest** | Browse properties, search availability, create bookings, manage own bookings, make payments, manage own reviews |
| **Staff** | Staff operations for authorized property bookings |
| **Manager** | Staff operations, assigned-property management functions, analytics where permitted |
| **Owner** | Staff operations, cross-property management, and full analytics |

## 🧰 Technology Stack

**Frontend:** React, Vite, React Router, Axios, Tailwind CSS, lucide-react
**Backend:** FastAPI, SQLAlchemy, PostgreSQL, Pydantic, JWT authentication
**Testing:** pytest (backend regression tests), Vite production build (frontend verification)

## 🏗️ Architecture

The frontend reads `VITE_API_BASE_URL` and expects the backend's `v1` API prefix. The backend reads environment configuration via Pydantic settings from `backend/.env` when present.

## 📁 Project Structure

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

## ⚙️ Environment Variables

### Backend — `backend/.env.example`

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

### Frontend — `frontend/.env.example`

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

> ⚠️ Do not commit real `.env` files or production secrets.

## 🧪 Development Test Users

Unknown existing passwords cannot be recovered from bcrypt hashes. For local development/testing, enable guarded utilities only in `backend/.env`:

```env
ENVIRONMENT=development
ENABLE_DEV_AUTH_UTILS=true
DEV_AUTH_UTILS_TOKEN=choose_a_local_secret_at_least_16_chars
```

Then use Swagger at `/api/v1/docs`:

- `POST /api/v1/auth/dev/test-users/reset-password` — resets an explicitly identified user's password and revokes existing refresh tokens.
- `DELETE /api/v1/auth/dev/test-users` — deletes only the explicitly identified login user after `confirm_email` matches. The linked guest profile, bookings, payments, and reviews are preserved.

These endpoints return `404` unless the utilities are enabled, a dev/test environment is active, and the admin token matches.

## 🗄️ PostgreSQL Setup

Create a PostgreSQL database named `kaveri_stays`, or update `DATABASE_URL` to match your local database. Apply the SQL scripts in `database/` according to the current schema/migration needs, then seed demo data if desired.

## 🚀 Backend Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```

Backend API documentation is available at:

- **Swagger UI:** `http://localhost:8000/api/v1/docs`
- **ReDoc:** `http://localhost:8000/api/v1/redoc`
- **Health check:** `http://localhost:8000/health`
- **Readiness check:** `http://localhost:8000/health/ready`

## 💻 Frontend Setup

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

The frontend runs at `http://localhost:5173` by default.

## 🗺️ Major Frontend Routes

| Route | Description |
|---|---|
| `/` | Landing page |
| `/properties` | Property listings |
| `/properties/:propertyId` | Property details |
| `/properties/:propertyId/availability` | Property-specific availability |
| `/availability` | Availability search |
| `/login` | Guest login |
| `/register` | Guest registration |
| `/dashboard` | Guest dashboard |
| `/my-bookings` | Guest booking history |
| `/bookings/create` | Create a booking |
| `/bookings/:bookingId` | Booking details |
| `/bookings/:bookingId/payment` | Booking payment |
| `/my-payments` | Payment history |
| `/payments/:paymentId` | Payment details |
| `/my-reviews` | Guest reviews |
| `/bookings/:bookingId/review` | Submit a review |
| `/reviews/:reviewId/edit` | Edit a review |
| `/staff` | Staff portal |
| `/staff/bookings` | Staff booking operations |
| `/staff/bookings/:bookingId` | Staff booking details |
| `/management` | Management hub |
| `/management/properties` | Manage properties |
| `/management/room-types` | Manage room types |
| `/management/rooms` | Manage rooms |
| `/management/rate-plans` | Manage rate plans |
| `/analytics` | Analytics dashboard |
| `/unauthorized` | Unauthorized access page |

## ✅ Testing

**Frontend production build:**

```bash
cd frontend
npm run build
```

**Backend regression tests:**

```bash
cd backend
pytest tests/ -v --show-capture=no
```

## 🌐 Deployment

Recommended production shape:

```text
React/Vite static frontend
  → HTTPS
FastAPI backend
  → private PostgreSQL database
```

For deployment, set:

- A production `VITE_API_BASE_URL`
- A secure `JWT_SECRET_KEY`
- A production `DATABASE_URL`
- Explicit `CORS_ORIGINS` for the frontend domain

Keep PostgreSQL private and do not deploy with development fallback secrets.

**Live deployment:** [https://kaveri-stays.nyrvexa.in/](https://kaveri-stays.nyrvexa.in/)

## 🔮 Future Improvements

- [ ] Add browser-based end-to-end test automation for the main guest, staff, manager, and owner journeys.
- [ ] Add frontend lint rules once the current UI stabilizes.
- [ ] Add CI for `npm run build` and backend pytest.
- [ ] Add production deployment manifests after the hosting target is selected.

## 📄 License

This project is licensed under the MIT License.

---

<p align="center">Built by <a href="https://kunalx30.vercel.app">Kunal Chandelkar</a></p>
