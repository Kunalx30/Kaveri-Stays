"""
Phase 5C: Rooms Management API — Integration Test Suite

Tests all 17 required scenarios plus authorization edge cases.

Seed context (from 07_seed.sql):
  - Properties: 1=Kaveri Riverside (Coorg), 2=Ooty Nilgiris, 3=Munnar Hills, ...
  - Room types: Standard, Deluxe, Suite (each with rooms + bookings)
  - manager.riverside@kaveristays.com -> property_id=1
  - staff.riverside@kaveristays.com  -> property_id=1
"""
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

BASE = "/api/v1"


async def login(client: AsyncClient, email: str, password: str = "Password@123") -> dict:
    """Login and return full token+user payload."""
    res = await client.post(f"{BASE}/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    return res.json()


@pytest.mark.asyncio
async def test_rooms_management_suite():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:

        # ── Authenticate all roles ──────────────────────────────────────────
        owner_data   = await login(client, "owner@kaveristays.com")
        mgr_data     = await login(client, "manager.riverside@kaveristays.com")
        staff_data   = await login(client, "staff.riverside@kaveristays.com")
        guest_data   = await login(client, "guest.demo@kaveristays.com")

        owner_h   = {"Authorization": f"Bearer {owner_data['tokens']['access_token']}"}
        mgr_h     = {"Authorization": f"Bearer {mgr_data['tokens']['access_token']}"}
        staff_h   = {"Authorization": f"Bearer {staff_data['tokens']['access_token']}"}
        guest_h   = {"Authorization": f"Bearer {guest_data['tokens']['access_token']}"}

        mgr_prop_id = mgr_data["user"]["property_id"]   # 1 = Kaveri Riverside
        assert mgr_prop_id == 1, f"Expected manager property_id=1, got {mgr_prop_id}"

        # ── TEST 1: Owner lists all rooms ───────────────────────────────────
        res = await client.get(f"{BASE}/rooms", headers=owner_h)
        assert res.status_code == 200, f"Owner list failed: {res.text}"
        all_rooms = res.json()
        assert len(all_rooms) >= 12, f"Expected at least 12 seeded rooms, got {len(all_rooms)}"
        print(f"[PASSED] Test 1: Owner listed {len(all_rooms)} rooms.")

        # ── TEST 2: Filter rooms by property_id ─────────────────────────────
        res = await client.get(f"{BASE}/rooms?property_id={mgr_prop_id}", headers=owner_h)
        assert res.status_code == 200
        prop1_rooms = res.json()
        assert all(r["property_id"] == mgr_prop_id for r in prop1_rooms), \
            "Filter by property_id returned rooms from other properties"
        assert len(prop1_rooms) >= 12, f"Expected at least 12 rooms for property 1, got {len(prop1_rooms)}"
        print(f"[PASSED] Test 2: Owner filtered to {len(prop1_rooms)} rooms for property {mgr_prop_id}.")

        # Filter by room_type_id
        first_room_type_id = all_rooms[0]["room_type_id"]
        res = await client.get(f"{BASE}/rooms?room_type_id={first_room_type_id}", headers=owner_h)
        assert res.status_code == 200
        assert all(r["room_type_id"] == first_room_type_id for r in res.json())
        print(f"[PASSED] Test 2b: Filter by room_type_id={first_room_type_id} works correctly.")

        # ── TEST 3: Owner gets a single room ────────────────────────────────
        first_room_id = all_rooms[0]["room_id"]
        res = await client.get(f"{BASE}/rooms/{first_room_id}", headers=owner_h)
        assert res.status_code == 200
        room_data = res.json()
        assert room_data["room_id"] == first_room_id
        assert "property_id" in room_data
        assert "room_number" in room_data
        assert "room_type_id" in room_data
        print(f"[PASSED] Test 3: Owner retrieved room ID {first_room_id}.")

        # ── TEST 4: Owner creates a new room ────────────────────────────────
        # Get a valid room_type_id from the DB
        rt_res = await client.get(f"{BASE}/room-types", headers=owner_h)
        room_types = rt_res.json()
        std_type = next(rt for rt in room_types if rt["name"] == "Standard")
        std_type_id = std_type["room_type_id"]

        res = await client.post(
            f"{BASE}/rooms",
            headers=owner_h,
            json={"property_id": mgr_prop_id, "room_number": "T99", "room_type_id": std_type_id}
        )
        assert res.status_code == 201, f"Owner create room failed: {res.text}"
        created = res.json()
        new_room_id = created["room_id"]
        assert created["property_id"] == mgr_prop_id
        assert created["room_number"] == "T99"
        assert created["room_type_id"] == std_type_id
        print(f"[PASSED] Test 4: Owner created room 'T99' (ID {new_room_id}) in property {mgr_prop_id}.")

        # ── TEST 5: Duplicate room number within same property → 409 ─────────
        res = await client.post(
            f"{BASE}/rooms",
            headers=owner_h,
            json={"property_id": mgr_prop_id, "room_number": "T99", "room_type_id": std_type_id}
        )
        assert res.status_code == 409, f"Expected 409 for duplicate room, got {res.status_code}: {res.text}"
        print("[PASSED] Test 5: Duplicate room number in same property returned 409 Conflict.")

        # Same room_number in a DIFFERENT property should succeed
        res_other_prop = await client.post(
            f"{BASE}/rooms",
            headers=owner_h,
            json={"property_id": 2, "room_number": "T99", "room_type_id": std_type_id}
        )
        assert res_other_prop.status_code == 201, \
            f"Same room_number in different property should be allowed, got {res_other_prop.status_code}"
        other_prop_new_room_id = res_other_prop.json()["room_id"]
        print("[PASSED] Test 5b: Same room_number in different property allowed (201).")

        # ── TEST 6: Owner updates a room ────────────────────────────────────
        deluxe_type = next(rt for rt in room_types if rt["name"] == "Deluxe")
        res = await client.patch(
            f"{BASE}/rooms/{new_room_id}",
            headers=owner_h,
            json={"room_number": "T98", "room_type_id": deluxe_type["room_type_id"]}
        )
        assert res.status_code == 200, f"Owner update room failed: {res.text}"
        updated = res.json()
        assert updated["room_number"] == "T98"
        assert updated["room_type_id"] == deluxe_type["room_type_id"]
        print(f"[PASSED] Test 6: Owner updated room {new_room_id}: number='T98', type=Deluxe.")

        # Partial update (only room_type_id)
        res = await client.patch(
            f"{BASE}/rooms/{new_room_id}",
            headers=owner_h,
            json={"room_type_id": std_type_id}
        )
        assert res.status_code == 200
        assert res.json()["room_type_id"] == std_type_id
        print("[PASSED] Test 6b: Partial update (room_type_id only) succeeded.")

        # ── TEST 7: Manager accesses their assigned property's rooms ─────────
        res = await client.get(f"{BASE}/rooms", headers=mgr_h)
        assert res.status_code == 200
        mgr_rooms = res.json()
        assert len(mgr_rooms) >= 12
        assert all(r["property_id"] == mgr_prop_id for r in mgr_rooms), \
            "Manager received rooms from another property"
        print(f"[PASSED] Test 7: Manager listed {len(mgr_rooms)} rooms, all from property {mgr_prop_id}.")

        # Manager can view a single room in their property
        mgr_room_id = mgr_rooms[0]["room_id"]
        res = await client.get(f"{BASE}/rooms/{mgr_room_id}", headers=mgr_h)
        assert res.status_code == 200
        assert res.json()["property_id"] == mgr_prop_id
        print(f"[PASSED] Test 7b: Manager retrieved own-property room ID {mgr_room_id}.")

        # ── TEST 8: Manager blocked from rooms in another property ───────────
        # Find a room from property 2
        res_p2 = await client.get(f"{BASE}/rooms?property_id=2", headers=owner_h)
        assert res_p2.status_code == 200
        p2_rooms = res_p2.json()
        assert len(p2_rooms) > 0, "Need at least one room in property 2 for this test"
        other_room_id = p2_rooms[0]["room_id"]

        res = await client.get(f"{BASE}/rooms/{other_room_id}", headers=mgr_h)
        assert res.status_code == 403, \
            f"Expected 403 for manager accessing other property's room, got {res.status_code}"
        assert "Access denied" in res.json()["detail"]
        print(f"[PASSED] Test 8: Manager blocked (403) from viewing room ID {other_room_id} (property 2).")

        # ── TEST 9: Manager blocked from updating another property's room ────
        res = await client.patch(
            f"{BASE}/rooms/{other_room_id}",
            headers=mgr_h,
            json={"room_number": "HACK"}
        )
        assert res.status_code == 403, \
            f"Expected 403 for manager updating other property's room, got {res.status_code}"
        print(f"[PASSED] Test 9: Manager blocked (403) from updating room ID {other_room_id} (property 2).")

        # Manager can create a room in their own property
        res = await client.post(
            f"{BASE}/rooms",
            headers=mgr_h,
            json={"property_id": mgr_prop_id, "room_number": "MGR1", "room_type_id": std_type_id}
        )
        assert res.status_code == 201, f"Manager create room in own property failed: {res.text}"
        mgr_created_room_id = res.json()["room_id"]
        print(f"[PASSED] Test 9b: Manager created room 'MGR1' (ID {mgr_created_room_id}) in own property.")

        # Manager CANNOT create a room in another property
        res = await client.post(
            f"{BASE}/rooms",
            headers=mgr_h,
            json={"property_id": 2, "room_number": "MGRX", "room_type_id": std_type_id}
        )
        assert res.status_code == 403, \
            f"Expected 403 for manager creating room in another property, got {res.status_code}"
        print("[PASSED] Test 9c: Manager blocked (403) from creating room in property 2.")

        # ── TEST 10: Staff authorization ─────────────────────────────────────
        res = await client.get(f"{BASE}/rooms", headers=staff_h)
        assert res.status_code == 200
        staff_rooms = res.json()
        assert all(r["property_id"] == mgr_prop_id for r in staff_rooms), \
            "Staff received rooms from another property"
        print(f"[PASSED] Test 10: Staff listed {len(staff_rooms)} rooms, all from assigned property.")

        # Staff can view single room in their property
        res = await client.get(f"{BASE}/rooms/{mgr_room_id}", headers=staff_h)
        assert res.status_code == 200
        print(f"[PASSED] Test 10b: Staff retrieved own-property room ID {mgr_room_id}.")

        # Staff blocked from other property's room
        res = await client.get(f"{BASE}/rooms/{other_room_id}", headers=staff_h)
        assert res.status_code == 403
        print(f"[PASSED] Test 10c: Staff blocked (403) from other property's room.")

        # Staff CANNOT create rooms
        res = await client.post(
            f"{BASE}/rooms",
            headers=staff_h,
            json={"property_id": mgr_prop_id, "room_number": "STAFF1", "room_type_id": std_type_id}
        )
        assert res.status_code == 403, \
            f"Expected 403 for staff creating room, got {res.status_code}"
        print("[PASSED] Test 10d: Staff blocked (403) from creating rooms.")

        # ── TEST 11: Guest blocked from room management ──────────────────────
        # Guest list
        res = await client.get(f"{BASE}/rooms", headers=guest_h)
        assert res.status_code == 403
        print("[PASSED] Test 11a: Guest blocked (403) from listing rooms.")

        # Guest create
        res = await client.post(
            f"{BASE}/rooms",
            headers=guest_h,
            json={"property_id": mgr_prop_id, "room_number": "GUEST", "room_type_id": std_type_id}
        )
        assert res.status_code == 403
        print("[PASSED] Test 11b: Guest blocked (403) from creating rooms.")

        # Guest update
        res = await client.patch(f"{BASE}/rooms/{new_room_id}", headers=guest_h, json={"room_number": "GX"})
        assert res.status_code == 403
        print("[PASSED] Test 11c: Guest blocked (403) from updating rooms.")

        # Guest delete
        res = await client.delete(f"{BASE}/rooms/{new_room_id}", headers=guest_h)
        assert res.status_code == 403
        print("[PASSED] Test 11d: Guest blocked (403) from deleting rooms.")

        # ── TEST 12: Non-existent room_id returns 404 ────────────────────────
        res = await client.get(f"{BASE}/rooms/99999", headers=owner_h)
        assert res.status_code == 404
        print("[PASSED] Test 12: Non-existent room ID 99999 returns 404 Not Found.")

        # ── TEST 13: Invalid foreign keys return 404 ─────────────────────────
        # Invalid property_id
        res = await client.post(
            f"{BASE}/rooms",
            headers=owner_h,
            json={"property_id": 99999, "room_number": "FK1", "room_type_id": std_type_id}
        )
        assert res.status_code == 404, f"Expected 404 for invalid property_id, got {res.status_code}"
        print("[PASSED] Test 13a: Invalid property_id=99999 returns 404 Not Found.")

        # Invalid room_type_id
        res = await client.post(
            f"{BASE}/rooms",
            headers=owner_h,
            json={"property_id": mgr_prop_id, "room_number": "FK2", "room_type_id": 99999}
        )
        assert res.status_code == 404, f"Expected 404 for invalid room_type_id, got {res.status_code}"
        print("[PASSED] Test 13b: Invalid room_type_id=99999 returns 404 Not Found.")

        # Invalid room_type_id in PATCH
        res = await client.patch(
            f"{BASE}/rooms/{new_room_id}",
            headers=owner_h,
            json={"room_type_id": 99999}
        )
        assert res.status_code == 404
        print("[PASSED] Test 13c: PATCH with invalid room_type_id=99999 returns 404 Not Found.")

        # ── TEST 14: Invalid request data returns 422 ─────────────────────────
        # Blank room_number
        res = await client.post(
            f"{BASE}/rooms",
            headers=owner_h,
            json={"property_id": mgr_prop_id, "room_number": "   ", "room_type_id": std_type_id}
        )
        assert res.status_code == 422, f"Expected 422 for blank room_number, got {res.status_code}"
        print("[PASSED] Test 14a: Blank room_number returns 422 Unprocessable Entity.")

        # room_number too long (>10 chars)
        res = await client.post(
            f"{BASE}/rooms",
            headers=owner_h,
            json={"property_id": mgr_prop_id, "room_number": "12345678901", "room_type_id": std_type_id}
        )
        assert res.status_code == 422, f"Expected 422 for >10 char room_number, got {res.status_code}"
        print("[PASSED] Test 14b: Excessively long room_number (11 chars) returns 422.")

        # Invalid (non-positive) property_id
        res = await client.post(
            f"{BASE}/rooms",
            headers=owner_h,
            json={"property_id": 0, "room_number": "V1", "room_type_id": std_type_id}
        )
        assert res.status_code == 422, f"Expected 422 for property_id=0, got {res.status_code}"
        print("[PASSED] Test 14c: property_id=0 returns 422 Unprocessable Entity.")

        # Invalid (non-positive) room_type_id
        res = await client.post(
            f"{BASE}/rooms",
            headers=owner_h,
            json={"property_id": mgr_prop_id, "room_number": "V2", "room_type_id": -1}
        )
        assert res.status_code == 422, f"Expected 422 for room_type_id=-1, got {res.status_code}"
        print("[PASSED] Test 14d: room_type_id=-1 returns 422 Unprocessable Entity.")

        # ── TEST 15: Unauthenticated request returns 401 ─────────────────────
        res = await client.get(f"{BASE}/rooms")
        assert res.status_code == 401, f"Expected 401 without token, got {res.status_code}"
        print("[PASSED] Test 15a: Unauthenticated GET /rooms returns 401 Unauthorized.")

        res = await client.post(
            f"{BASE}/rooms",
            json={"property_id": mgr_prop_id, "room_number": "ANON", "room_type_id": std_type_id}
        )
        assert res.status_code == 401, f"Expected 401 without token, got {res.status_code}"
        print("[PASSED] Test 15b: Unauthenticated POST /rooms returns 401 Unauthorized.")

        # ── TEST 16: Delete blocked when room has bookings ────────────────────
        # Find a seeded room that has bookings (any of the first 12 seeded rooms should have bookings)
        seeded_room_with_bookings = next(
            r for r in all_rooms if r["room_id"] != new_room_id and r["room_id"] != mgr_created_room_id
        )
        booked_room_id = seeded_room_with_bookings["room_id"]
        res = await client.delete(f"{BASE}/rooms/{booked_room_id}", headers=owner_h)
        assert res.status_code == 409, (
            f"Expected 409 when deleting room with bookings (ID {booked_room_id}), "
            f"got {res.status_code}: {res.text}"
        )
        assert "booking" in res.json()["detail"].lower()
        print(f"[PASSED] Test 16: Deleting room {booked_room_id} (has bookings) returned 409 Conflict.")

        # ── TEST 17: Safe delete of a room with no bookings ───────────────────
        # Delete the manager-created room (no bookings)
        res = await client.delete(f"{BASE}/rooms/{mgr_created_room_id}", headers=owner_h)
        assert res.status_code == 200, (
            f"Expected 200 for safe delete, got {res.status_code}: {res.text}"
        )
        assert str(mgr_created_room_id) in res.json()["message"]
        print(f"[PASSED] Test 17a: Safely deleted unused room ID {mgr_created_room_id}.")

        # Confirm 404 after deletion
        res = await client.get(f"{BASE}/rooms/{mgr_created_room_id}", headers=owner_h)
        assert res.status_code == 404
        print(f"[PASSED] Test 17b: Deleted room ID {mgr_created_room_id} now returns 404.")

        # Clean up the owner-created room T98 (no bookings)
        res = await client.delete(f"{BASE}/rooms/{new_room_id}", headers=owner_h)
        assert res.status_code == 200
        print(f"[PASSED] Test 17c: Cleaned up owner-created room ID {new_room_id}.")

        # Clean up the T99 room we created in property 2 (no bookings)
        res = await client.delete(f"{BASE}/rooms/{other_prop_new_room_id}", headers=owner_h)
        assert res.status_code == 200
        print(f"[PASSED] Test 17d: Cleaned up room ID {other_prop_new_room_id} in property 2.")

        print("\n[ALL PASSED] All 17 Room Management API tests passed!")
