"""
Integration test suite for Authentication & Authorization system.
"""
import uuid
from datetime import date
from decimal import Decimal

import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.dialects.postgresql import Range
from sqlalchemy import func
from app.main import app
from app.database import SessionLocal
from app.config import settings
from app.models import Booking, BookingStatus, Guest, Payment, RefreshToken, Review, Room, User
from app.core.security import verify_password


@pytest.mark.asyncio
async def test_auth_full_lifecycle():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test/api/v1") as client:
        # 1. Register a new guest user
        unique_email = f"test.guest.{uuid.uuid4().hex}@kaveristays.com"
        reg_payload = {
            "email": unique_email,
            "password": "StrongPassword@123",
            "full_name": "Automated Test Guest",
            "phone": "+919876543290",
            "city": "Chennai"
        }
        res_reg = await client.post("/auth/register", json=reg_payload)
        assert res_reg.status_code == 201
        data = res_reg.json()
        assert data["user"]["role"] == "guest"
        assert data["user"]["guest_id"] is not None
        assert "access_token" in data["tokens"]
        assert "refresh_token" in data["tokens"]

        db = SessionLocal()
        try:
            user = db.query(User).filter(
                func.lower(func.trim(User.email)) == unique_email
            ).first()
            assert user is not None
            assert user.password_hash
            assert verify_password("StrongPassword@123", user.password_hash) is True
        finally:
            db.close()

        # Duplicate registration should return 409
        res_dup = await client.post("/auth/register", json=reg_payload)
        assert res_dup.status_code == 409

        # 2. Login with valid credentials
        res_login = await client.post("/auth/login", json={
            "email": unique_email,
            "password": "StrongPassword@123"
        })
        assert res_login.status_code == 200
        access_token = res_login.json()["tokens"]["access_token"]
        refresh_token = res_login.json()["tokens"]["refresh_token"]

        # 2b. OAuth2 Password Flow used by Swagger UI
        res_token = await client.post(
            "/auth/token",
            data={
                "grant_type": "password",
                "username": unique_email,
                "password": "StrongPassword@123",
                "scope": "",
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        assert res_token.status_code == 200
        assert "access_token" in res_token.json()
        assert res_token.json()["token_type"] == "bearer"

        # 3. Invalid login credentials return 401
        res_bad_login = await client.post("/auth/login", json={
            "email": unique_email,
            "password": "WrongPassword!123"
        })
        assert res_bad_login.status_code == 401

        res_bad_token = await client.post(
            "/auth/token",
            data={
                "grant_type": "password",
                "username": unique_email,
                "password": "WrongPassword!123",
                "scope": "",
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        assert res_bad_token.status_code == 401

        res_missing_user = await client.post("/auth/login", json={
            "email": "missing.user@kaveristays.com",
            "password": "StrongPassword@123"
        })
        assert res_missing_user.status_code == 401

        # 4. Access protected /auth/me with Bearer token
        res_me = await client.get("/auth/me", headers={"Authorization": f"Bearer {access_token}"})
        assert res_me.status_code == 200
        assert res_me.json()["email"] == unique_email
        assert res_me.json()["role"] == "guest"

        # 5. Token refresh with rotation
        res_refresh = await client.post("/auth/refresh", json={"refresh_token": refresh_token})
        assert res_refresh.status_code == 200
        new_access_token = res_refresh.json()["access_token"]
        new_refresh_token = res_refresh.json()["refresh_token"]
        assert new_refresh_token != refresh_token

        # Reusing the old refresh token must fail (401)
        res_reuse = await client.post("/auth/refresh", json={"refresh_token": refresh_token})
        assert res_reuse.status_code == 401

        # 6. Logout / Revoke token
        res_logout = await client.post(
            "/auth/logout",
            json={"refresh_token": new_refresh_token},
            headers={"Authorization": f"Bearer {new_access_token}"}
        )
        assert res_logout.status_code == 200

        # After logout, the revoked refresh token must fail (401)
        res_revoked = await client.post("/auth/refresh", json={"refresh_token": new_refresh_token})
        assert res_revoked.status_code == 401


@pytest.mark.asyncio
async def test_dev_auth_utils_are_disabled_by_default():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test/api/v1") as client:
        res = await client.post("/auth/dev/test-users/reset-password", json={
            "admin_token": "local-test-token-123",
            "email": "missing.dev.user@kaveristays.com",
            "new_password": "NewPassword@123",
        })
        assert res.status_code == 404


@pytest.mark.asyncio
async def test_dev_password_reset_revokes_refresh_tokens_and_duplicate_email_is_case_insensitive():
    original_enabled = settings.ENABLE_DEV_AUTH_UTILS
    original_token = settings.DEV_AUTH_UTILS_TOKEN
    original_environment = settings.ENVIRONMENT
    settings.ENABLE_DEV_AUTH_UTILS = True
    settings.DEV_AUTH_UTILS_TOKEN = "local-test-token-123"
    settings.ENVIRONMENT = "testing"

    unique_email = f"dev.reset.{uuid.uuid4().hex}@kaveristays.com"
    new_password = "ResetPassword@123"

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test/api/v1") as client:
            reg_payload = {
                "email": unique_email,
                "password": "OriginalPassword@123",
                "full_name": "Dev Reset Guest",
                "phone": "+919876543291",
                "city": "Mysuru",
            }
            res_reg = await client.post("/auth/register", json=reg_payload)
            assert res_reg.status_code == 201
            old_refresh_token = res_reg.json()["tokens"]["refresh_token"]

            res_dup = await client.post("/auth/register", json={
                **reg_payload,
                "email": f"  {unique_email.upper()}  ",
            })
            assert res_dup.status_code == 409

            res_reset = await client.post("/auth/dev/test-users/reset-password", json={
                "admin_token": "local-test-token-123",
                "email": unique_email,
                "new_password": new_password,
            })
            assert res_reset.status_code == 200, res_reset.text
            reset_body = res_reset.json()
            assert reset_body["email"] == unique_email
            assert reset_body["refresh_tokens_revoked"] >= 1
            assert "password_hash" not in res_reset.text
            assert "token_hash" not in res_reset.text

            old_login = await client.post("/auth/login", json={
                "email": unique_email,
                "password": "OriginalPassword@123",
            })
            assert old_login.status_code == 401

            new_login = await client.post("/auth/login", json={
                "email": unique_email,
                "password": new_password,
            })
            assert new_login.status_code == 200

            revoked_refresh = await client.post("/auth/refresh", json={"refresh_token": old_refresh_token})
            assert revoked_refresh.status_code == 401

        db = SessionLocal()
        try:
            user = db.query(User).filter(func.lower(func.trim(User.email)) == unique_email).first()
            assert user is not None
            assert verify_password(new_password, user.password_hash) is True
            db.query(RefreshToken).filter(RefreshToken.user_id == user.user_id).delete()
            guest_id = user.guest_id
            db.delete(user)
            db.commit()
            if guest_id:
                db.query(Guest).filter(Guest.guest_id == guest_id).delete()
            db.commit()
        finally:
            db.close()
    finally:
        settings.ENABLE_DEV_AUTH_UTILS = original_enabled
        settings.DEV_AUTH_UTILS_TOKEN = original_token
        settings.ENVIRONMENT = original_environment


@pytest.mark.asyncio
async def test_dev_delete_test_user_preserves_guest_booking_payment_and_review_records():
    original_enabled = settings.ENABLE_DEV_AUTH_UTILS
    original_token = settings.DEV_AUTH_UTILS_TOKEN
    original_environment = settings.ENVIRONMENT
    settings.ENABLE_DEV_AUTH_UTILS = True
    settings.DEV_AUTH_UTILS_TOKEN = "local-test-token-123"
    settings.ENVIRONMENT = "testing"

    unique_email = f"dev.delete.{uuid.uuid4().hex}@kaveristays.com"

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test/api/v1") as client:
            res_reg = await client.post("/auth/register", json={
                "email": unique_email,
                "password": "OriginalPassword@123",
                "full_name": "Dev Delete Guest",
                "phone": "+919876543292",
                "city": "Mangaluru",
            })
            assert res_reg.status_code == 201
            user_id = res_reg.json()["user"]["user_id"]
            guest_id = res_reg.json()["user"]["guest_id"]

        db = SessionLocal()
        booking_id = None
        try:
            room = db.query(Room).first()
            assert room is not None
            booking = Booking(
                guest_id=guest_id,
                room_id=room.room_id,
                stay=Range(date(2041, 1, 10), date(2041, 1, 12), bounds="[)"),
                guests_count=1,
                nightly_rate=Decimal("1000.00"),
                status=BookingStatus.checked_out,
                notes="Dev cleanup preservation test",
            )
            db.add(booking)
            db.flush()
            booking_id = booking.booking_id

            payment = Payment(
                booking_id=booking_id,
                amount=Decimal("2000.00"),
                method="card",
            )
            review = Review(
                booking_id=booking_id,
                rating=5,
                comments="Preserved review",
            )
            db.add_all([payment, review])
            db.commit()
        finally:
            db.close()

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test/api/v1") as client:
            bad_confirm = await client.request("DELETE", "/auth/dev/test-users", json={
                "admin_token": "local-test-token-123",
                "email": unique_email,
                "confirm_email": "different@example.com",
            })
            assert bad_confirm.status_code == 400

            res_delete = await client.request("DELETE", "/auth/dev/test-users", json={
                "admin_token": "local-test-token-123",
                "email": unique_email,
                "confirm_email": unique_email,
            })
            assert res_delete.status_code == 200, res_delete.text
            body = res_delete.json()
            assert body["user_id"] == user_id
            assert body["guest_id"] == guest_id
            assert body["bookings_preserved"] >= 1
            assert body["payments_preserved"] >= 1
            assert body["reviews_preserved"] >= 1
            assert "password_hash" not in res_delete.text
            assert "token_hash" not in res_delete.text

        db = SessionLocal()
        try:
            assert db.query(User).filter(User.user_id == user_id).first() is None
            assert db.query(Guest).filter(Guest.guest_id == guest_id).first() is not None
            assert db.query(Booking).filter(Booking.booking_id == booking_id).first() is not None
            assert db.query(Payment).filter(Payment.booking_id == booking_id).count() == 1
            assert db.query(Review).filter(Review.booking_id == booking_id).count() == 1
            db.query(Review).filter(Review.booking_id == booking_id).delete()
            db.query(Payment).filter(Payment.booking_id == booking_id).delete()
            db.query(Booking).filter(Booking.booking_id == booking_id).delete()
            db.query(Guest).filter(Guest.guest_id == guest_id).delete()
            db.commit()
        finally:
            db.close()
    finally:
        settings.ENABLE_DEV_AUTH_UTILS = original_enabled
        settings.DEV_AUTH_UTILS_TOKEN = original_token
        settings.ENVIRONMENT = original_environment
