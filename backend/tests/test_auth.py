"""
Integration test suite for Authentication & Authorization system.
"""
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_auth_full_lifecycle():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test/api/v1") as client:
        # 1. Register a new guest user
        unique_email = "test.guest.auto@kaveristays.com"
        reg_payload = {
            "email": unique_email,
            "password": "StrongPassword@123",
            "full_name": "Automated Test Guest",
            "phone": "+919876543290",
            "city": "Chennai"
        }
        res_reg = await client.post("/auth/register", json=reg_payload)
        # 201 on first creation, 409 if already exists
        if res_reg.status_code == 201:
            data = res_reg.json()
            assert data["user"]["role"] == "guest"
            assert data["user"]["guest_id"] is not None
            assert "access_token" in data["tokens"]
            assert "refresh_token" in data["tokens"]

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

        # 3. Invalid login credentials return 401
        res_bad_login = await client.post("/auth/login", json={
            "email": unique_email,
            "password": "WrongPassword!123"
        })
        assert res_bad_login.status_code == 401

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
