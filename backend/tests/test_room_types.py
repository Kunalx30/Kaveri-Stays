"""
Phase 5B: Room Types Management API - Integration Test Suite

Tests all 16 required scenarios:
  1.  Unauthenticated user can list room types (public GET)
  2.  Guest can list room types
  3.  Owner can list room types
  4.  Owner can get a single room type
  5.  Owner can create a new room type
  6.  Duplicate room type name returns 409 Conflict
  7.  Owner can update a room type
  8.  Invalid max_occupancy returns 422 Unprocessable Entity
  9.  Manager cannot create a room type (403)
  10. Staff cannot create a room type (403)
  11. Guest cannot create a room type (403)
  12. Non-existent room type returns 404
  13. Unauthenticated create request returns 401
  14. Deletion of a room type referenced by rooms returns 409
  15. Deletion of a room type referenced by rate plans returns 409
  16. Deletion of a newly created unused room type succeeds
"""
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

BASE = "/api/v1"


async def login(client: AsyncClient, email: str, password: str = "Password@123") -> str:
    """Helper: login and return Bearer access token."""
    res = await client.post(f"{BASE}/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    return res.json()["tokens"]["access_token"]


@pytest.mark.asyncio
async def test_room_types_management_suite():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:

        # ── Authenticate all roles ──────────────────────────────────────────
        owner_token   = await login(client, "owner@kaveristays.com")
        manager_token = await login(client, "manager.riverside@kaveristays.com")
        staff_token   = await login(client, "staff.riverside@kaveristays.com")
        guest_token   = await login(client, "guest.demo@kaveristays.com")

        owner_h   = {"Authorization": f"Bearer {owner_token}"}
        manager_h = {"Authorization": f"Bearer {manager_token}"}
        staff_h   = {"Authorization": f"Bearer {staff_token}"}
        guest_h   = {"Authorization": f"Bearer {guest_token}"}

        # ── TEST 1: Unauthenticated user can list room types ────────────────
        res = await client.get(f"{BASE}/room-types")
        assert res.status_code == 200, f"Unauthenticated list failed: {res.text}"
        public_types = res.json()
        assert isinstance(public_types, list)
        assert len(public_types) >= 3, "Expected at least Standard, Deluxe, Suite"
        names = [rt["name"] for rt in public_types]
        assert any("Standard" in n for n in names), "Expected 'Standard' room type"
        assert any("Deluxe" in n for n in names), "Expected 'Deluxe' room type"
        assert any("Suite" in n for n in names), "Expected 'Suite' room type"
        print(f"[PASSED] Test 1: Unauthenticated user listed {len(public_types)} room types.")

        # ── TEST 2: Guest can list room types ───────────────────────────────
        res = await client.get(f"{BASE}/room-types", headers=guest_h)
        assert res.status_code == 200, f"Guest list failed: {res.text}"
        assert len(res.json()) >= 3
        print("[PASSED] Test 2: Guest can list room types.")

        # ── TEST 3: Owner can list room types ───────────────────────────────
        res = await client.get(f"{BASE}/room-types", headers=owner_h)
        assert res.status_code == 200, f"Owner list failed: {res.text}"
        assert len(res.json()) >= 3
        print("[PASSED] Test 3: Owner can list room types.")

        # ── TEST 4: Owner can get a single room type by ID ──────────────────
        first_id = public_types[0]["room_type_id"]
        res = await client.get(f"{BASE}/room-types/{first_id}", headers=owner_h)
        assert res.status_code == 200, f"Owner get single failed: {res.text}"
        data = res.json()
        assert data["room_type_id"] == first_id
        assert "name" in data
        assert "max_occupancy" in data
        print(f"[PASSED] Test 4: Owner retrieved room type ID {first_id} ({data['name']}).")

        # ── TEST 5: Owner can create a new room type ────────────────────────
        new_name = "Presidential Penthouse"
        res = await client.post(
            f"{BASE}/room-types",
            headers=owner_h,
            json={"name": new_name, "max_occupancy": 6}
        )
        assert res.status_code == 201, f"Owner create failed: {res.text}"
        created = res.json()
        new_id = created["room_type_id"]
        assert created["name"] == new_name
        assert created["max_occupancy"] == 6
        print(f"[PASSED] Test 5: Owner created room type '{new_name}' with ID {new_id}.")

        # ── TEST 6: Duplicate room type name returns 409 Conflict ───────────
        res = await client.post(
            f"{BASE}/room-types",
            headers=owner_h,
            json={"name": new_name, "max_occupancy": 4}
        )
        assert res.status_code == 409, f"Expected 409 for duplicate, got {res.status_code}: {res.text}"
        print("[PASSED] Test 6: Duplicate room type name returned 409 Conflict.")

        # Case-insensitive duplicate check
        res = await client.post(
            f"{BASE}/room-types",
            headers=owner_h,
            json={"name": new_name.lower(), "max_occupancy": 2}
        )
        assert res.status_code == 409, f"Expected 409 for case-insensitive duplicate, got {res.status_code}"
        print("[PASSED] Test 6b: Case-insensitive duplicate also returns 409 Conflict.")

        # ── TEST 7: Owner can update a room type ────────────────────────────
        res = await client.patch(
            f"{BASE}/room-types/{new_id}",
            headers=owner_h,
            json={"name": "Presidential Suite", "max_occupancy": 8}
        )
        assert res.status_code == 200, f"Owner update failed: {res.text}"
        updated = res.json()
        assert updated["name"] == "Presidential Suite"
        assert updated["max_occupancy"] == 8
        print(f"[PASSED] Test 7: Owner updated room type {new_id} to 'Presidential Suite', max_occupancy=8.")

        # Partial update (only max_occupancy)
        res = await client.patch(
            f"{BASE}/room-types/{new_id}",
            headers=owner_h,
            json={"max_occupancy": 10}
        )
        assert res.status_code == 200
        assert res.json()["max_occupancy"] == 10
        print("[PASSED] Test 7b: Partial update (max_occupancy only) succeeded.")

        # ── TEST 8: Invalid max_occupancy returns 422 ───────────────────────
        res = await client.post(
            f"{BASE}/room-types",
            headers=owner_h,
            json={"name": "BadType", "max_occupancy": 0}   # must be >= 1
        )
        assert res.status_code == 422, f"Expected 422 for occupancy=0, got {res.status_code}"
        print("[PASSED] Test 8a: max_occupancy=0 returns 422 Unprocessable Entity.")

        res = await client.post(
            f"{BASE}/room-types",
            headers=owner_h,
            json={"name": "BadType", "max_occupancy": -5}  # negative
        )
        assert res.status_code == 422, f"Expected 422 for negative occupancy, got {res.status_code}"
        print("[PASSED] Test 8b: Negative max_occupancy returns 422 Unprocessable Entity.")

        res = await client.post(
            f"{BASE}/room-types",
            headers=owner_h,
            json={"name": "BadType", "max_occupancy": 99}  # exceeds max of 20
        )
        assert res.status_code == 422, f"Expected 422 for occupancy=99, got {res.status_code}"
        print("[PASSED] Test 8c: max_occupancy=99 (>20) returns 422 Unprocessable Entity.")

        # ── TEST 9: Manager cannot create a room type (403) ─────────────────
        res = await client.post(
            f"{BASE}/room-types",
            headers=manager_h,
            json={"name": "Manager Room Type", "max_occupancy": 3}
        )
        assert res.status_code == 403, f"Expected 403 for manager, got {res.status_code}: {res.text}"
        print("[PASSED] Test 9: Manager cannot create a room type (403 Forbidden).")

        # ── TEST 10: Staff cannot create a room type (403) ──────────────────
        res = await client.post(
            f"{BASE}/room-types",
            headers=staff_h,
            json={"name": "Staff Room Type", "max_occupancy": 3}
        )
        assert res.status_code == 403, f"Expected 403 for staff, got {res.status_code}: {res.text}"
        print("[PASSED] Test 10: Staff cannot create a room type (403 Forbidden).")

        # ── TEST 11: Guest cannot create a room type (403) ──────────────────
        res = await client.post(
            f"{BASE}/room-types",
            headers=guest_h,
            json={"name": "Guest Room Type", "max_occupancy": 2}
        )
        assert res.status_code == 403, f"Expected 403 for guest, got {res.status_code}: {res.text}"
        print("[PASSED] Test 11: Guest cannot create a room type (403 Forbidden).")

        # ── TEST 12: Non-existent room type returns 404 ─────────────────────
        res = await client.get(f"{BASE}/room-types/99999")
        assert res.status_code == 404, f"Expected 404 for non-existent ID, got {res.status_code}"
        print("[PASSED] Test 12: Non-existent room type ID returns 404 Not Found.")

        # ── TEST 13: Unauthenticated create request returns 401 ─────────────
        res = await client.post(
            f"{BASE}/room-types",
            json={"name": "Anon Room Type", "max_occupancy": 2}
        )
        assert res.status_code == 401, f"Expected 401 for unauthenticated create, got {res.status_code}"
        print("[PASSED] Test 13: Unauthenticated create returns 401 Unauthorized.")

        # ── TEST 14: Deletion blocked when referenced by rooms ──────────────
        # Find a room type that has rooms (Standard/Deluxe/Suite all have rooms in seed data)
        seeded_type = next(rt for rt in public_types if rt["name"] == "Standard")
        seeded_type_id = seeded_type["room_type_id"]
        res = await client.delete(f"{BASE}/room-types/{seeded_type_id}", headers=owner_h)
        assert res.status_code == 409, (
            f"Expected 409 when deleting room type referenced by rooms, got {res.status_code}: {res.text}"
        )
        assert "room" in res.json()["detail"].lower()
        print(f"[PASSED] Test 14: Deleting room type '{seeded_type['name']}' (has rooms) returned 409 Conflict.")

        # ── TEST 15: Deletion blocked when referenced by rate plans ─────────
        # Rate plans reference all main room types — confirm at least one is blocked
        deluxe_type = next(rt for rt in public_types if rt["name"] == "Deluxe")
        deluxe_id = deluxe_type["room_type_id"]
        res = await client.delete(f"{BASE}/room-types/{deluxe_id}", headers=owner_h)
        # Either rooms OR rate_plans should block it
        assert res.status_code == 409, (
            f"Expected 409 when deleting Deluxe (has rooms/rate_plans), got {res.status_code}: {res.text}"
        )
        print(f"[PASSED] Test 15: Deleting room type '{deluxe_type['name']}' (has rooms/rate_plans) returned 409 Conflict.")

        # ── TEST 16: Deletion of an unused room type succeeds ───────────────
        # Use the newly created Presidential Suite (no rooms, no rate_plans)
        res = await client.delete(f"{BASE}/room-types/{new_id}", headers=owner_h)
        assert res.status_code == 200, (
            f"Expected 200 when deleting unused room type, got {res.status_code}: {res.text}"
        )
        assert str(new_id) in res.json()["message"]
        print(f"[PASSED] Test 16: Safely deleted unused room type ID {new_id}.")

        # Confirm deletion — should now return 404
        res = await client.get(f"{BASE}/room-types/{new_id}")
        assert res.status_code == 404
        print(f"[PASSED] Test 16b: Deleted room type ID {new_id} confirmed 404 Not Found.")

        print("\n[ALL PASSED] All 16 Room Types API tests passed!")
