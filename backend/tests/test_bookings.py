"""
Phase 5E: Bookings Management API — Integration Test Suite

Tests all required scenarios:
  1. Owner lists all bookings (200 OK)
  2. Manager lists only bookings for assigned property (200 OK)
  3. Staff property isolation (200 OK)
  4. Guest lists only their own bookings (200 OK)
  5. Guest cannot access another guest's booking (403 Forbidden)
  6. Manager cannot access another property's booking (403 Forbidden)
  7. Unauthenticated protected request returns 401 Unauthorized
  8. Owner retrieves a booking (200 OK)
  9. Authorized manager retrieves booking from assigned property (200 OK)
  10. Non-existent booking returns 404 Not Found
  11. Owner creates a valid booking with auto-pricing from RatePlan (201 Created)
  12. Manager creates booking only for assigned property (201 Created)
  13. Guest creates booking for themselves (201 Created)
  14. Guest cannot create booking for another guest (403 Forbidden)
  15. Invalid room returns 404 Not Found
  16. Invalid guest returns 404 Not Found
  17. Invalid stay date range (check_in >= check_out) returns 422
  18. Guests count exceeding room capacity is rejected (422)
  19. Overlapping room booking is rejected with 409 Conflict
  20. Adjacent stay behavior is accepted (201 Created)
  21. Booking pricing snapshot verification
  22. Cancellation releases room availability
  23. Invalid status transition rejected (400 Bad Request)
  24. Valid status transition lifecycle (confirmed -> checked_in -> checked_out)
  25. Unsafe modifications on completed/cancelled bookings blocked
  26. Manager cross-property update blocked (403 Forbidden)
  27. Guest cannot modify another guest's booking (403 Forbidden)
  28. Deletion of booking with existing payments returns 409 Conflict
  29. Safe delete of temporary unpaid booking succeeds and returns 200
"""
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

BASE = "/api/v1"


async def login(client: AsyncClient, email: str, password: str = "Password@123") -> dict:
    res = await client.post(f"{BASE}/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    return res.json()


@pytest.mark.asyncio
async def test_bookings_management_suite():
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

        mgr_prop_id = mgr_data["user"]["property_id"]  # 1 = Kaveri Riverside
        guest_id    = guest_data["user"]["guest_id"]
        assert mgr_prop_id == 1
        assert guest_id is not None

        # ── TEST 1: Owner lists all bookings ────────────────────────────────
        res = await client.get(f"{BASE}/bookings", headers=owner_h)
        assert res.status_code == 200, f"Owner list failed: {res.text}"
        all_bookings = res.json()
        assert len(all_bookings) >= 50, f"Expected seeded bookings, got {len(all_bookings)}"
        print(f"[PASSED] Test 1: Owner listed {len(all_bookings)} bookings.")

        # ── TEST 2: Manager property isolation ──────────────────────────────
        res = await client.get(f"{BASE}/bookings", headers=mgr_h)
        assert res.status_code == 200
        mgr_bookings = res.json()
        assert len(mgr_bookings) > 0
        assert all(b["property_id"] == mgr_prop_id for b in mgr_bookings), \
            "Manager received bookings from another property"
        print(f"[PASSED] Test 2: Manager received {len(mgr_bookings)} bookings, all for property {mgr_prop_id}.")

        # ── TEST 3: Staff property isolation ────────────────────────────────
        res = await client.get(f"{BASE}/bookings", headers=staff_h)
        assert res.status_code == 200
        staff_bookings = res.json()
        assert all(b["property_id"] == mgr_prop_id for b in staff_bookings)
        print(f"[PASSED] Test 3: Staff received {len(staff_bookings)} bookings for assigned property.")

        # ── TEST 4: Guest lists only their own bookings ─────────────────────
        res = await client.get(f"{BASE}/bookings", headers=guest_h)
        assert res.status_code == 200
        guest_bookings = res.json()
        assert all(b["guest_id"] == guest_id for b in guest_bookings), \
            "Guest received bookings of another guest"
        print(f"[PASSED] Test 4: Guest received {len(guest_bookings)} bookings belonging to their guest_id ({guest_id}).")

        # ── TEST 5: Guest cannot access another guest's booking ─────────────
        # Find a booking belonging to another guest
        other_guest_booking = next(b for b in all_bookings if b["guest_id"] != guest_id)
        other_booking_id = other_guest_booking["booking_id"]

        res = await client.get(f"{BASE}/bookings/{other_booking_id}", headers=guest_h)
        assert res.status_code == 403, f"Expected 403 for guest accessing another booking, got {res.status_code}"
        assert "Access denied" in res.json()["detail"]
        print(f"[PASSED] Test 5: Guest blocked (403) from accessing another guest's booking #{other_booking_id}.")

        # ── TEST 6: Manager cannot access another property's booking ────────
        other_prop_booking = next(b for b in all_bookings if b["property_id"] != mgr_prop_id)
        other_prop_b_id = other_prop_booking["booking_id"]

        res = await client.get(f"{BASE}/bookings/{other_prop_b_id}", headers=mgr_h)
        assert res.status_code == 403, f"Expected 403 for manager cross-property access, got {res.status_code}"
        print(f"[PASSED] Test 6: Manager blocked (403) from accessing other property's booking #{other_prop_b_id}.")

        # ── TEST 7: Unauthenticated request returns 401 ─────────────────────
        res = await client.get(f"{BASE}/bookings")
        assert res.status_code == 401
        print("[PASSED] Test 7: Unauthenticated request returns 401 Unauthorized.")

        # ── TEST 8: Owner retrieves a booking ───────────────────────────────
        res = await client.get(f"{BASE}/bookings/{other_booking_id}", headers=owner_h)
        assert res.status_code == 200
        b_data = res.json()
        assert b_data["booking_id"] == other_booking_id
        assert "check_in_date" in b_data
        assert "check_out_date" in b_data
        assert "nightly_rate" in b_data
        print(f"[PASSED] Test 8: Owner retrieved booking #{other_booking_id}.")

        # ── TEST 9: Manager retrieves booking from assigned property ────────
        own_prop_booking = mgr_bookings[0]
        res = await client.get(f"{BASE}/bookings/{own_prop_booking['booking_id']}", headers=mgr_h)
        assert res.status_code == 200
        assert res.json()["property_id"] == mgr_prop_id
        print(f"[PASSED] Test 9: Manager retrieved own property booking #{own_prop_booking['booking_id']}.")

        # ── TEST 10: Non-existent booking returns 404 ───────────────────────
        res = await client.get(f"{BASE}/bookings/999999", headers=owner_h)
        assert res.status_code == 404
        print("[PASSED] Test 10: Non-existent booking returns 404 Not Found.")

        # ── TEST 11: Owner creates a valid booking with auto-pricing ─────────
        # Find room 1 (Property 1)
        res_rooms = await client.get(f"{BASE}/rooms?property_id=1", headers=owner_h)
        assert res_rooms.status_code == 200
        room_1 = res_rooms.json()[0]
        room_1_id = room_1["room_id"]

        create_payload = {
            "room_id": room_1_id,
            "guest_id": guest_id,
            "check_in_date": "2028-05-10",
            "check_out_date": "2028-05-15",
            "guests_count": 2,
            "notes": "Late check-in requested"
        }
        res_create = await client.post(f"{BASE}/bookings", headers=owner_h, json=create_payload)
        assert res_create.status_code == 201, f"Owner create booking failed: {res_create.text}"
        created_booking = res_create.json()
        new_booking_id = created_booking["booking_id"]
        assert created_booking["status"] == "confirmed"
        assert created_booking["total_nights"] == 5
        assert float(created_booking["nightly_rate"]) > 0
        assert float(created_booking["total_amount"]) == float(created_booking["nightly_rate"]) * 5
        print(f"[PASSED] Test 11: Owner created booking #{new_booking_id} (Rate: {created_booking['nightly_rate']}, Total: {created_booking['total_amount']}).")

        # ── TEST 12: Manager creates booking for assigned property ──────────
        mgr_create_payload = {
            "room_id": room_1_id,
            "guest_id": guest_id,
            "check_in_date": "2028-06-01",
            "check_out_date": "2028-06-05",
            "guests_count": 2,
            "notes": "Direct manager booking"
        }
        res_mgr_create = await client.post(f"{BASE}/bookings", headers=mgr_h, json=mgr_create_payload)
        assert res_mgr_create.status_code == 201, f"Manager create failed: {res_mgr_create.text}"
        mgr_booking_id = res_mgr_create.json()["booking_id"]
        print(f"[PASSED] Test 12: Manager created booking #{mgr_booking_id} in assigned property.")

        # Manager blocked from creating booking for another property
        res_rooms_p2 = await client.get(f"{BASE}/rooms?property_id=2", headers=owner_h)
        room_p2_id = res_rooms_p2.json()[0]["room_id"]
        res_mgr_cross = await client.post(
            f"{BASE}/bookings",
            headers=mgr_h,
            json={**mgr_create_payload, "room_id": room_p2_id}
        )
        assert res_mgr_cross.status_code == 403, f"Expected 403 for manager cross create, got {res_mgr_cross.status_code}"
        print("[PASSED] Test 12b: Manager blocked (403) from creating booking for room in another property.")

        # ── TEST 13: Guest creates booking for themselves ───────────────────
        guest_payload = {
            "room_id": room_1_id,
            "check_in_date": "2028-07-10",
            "check_out_date": "2028-07-14",
            "guests_count": 1,
            "notes": "Summer holiday booking"
        }
        res_guest_create = await client.post(f"{BASE}/bookings", headers=guest_h, json=guest_payload)
        assert res_guest_create.status_code == 201, f"Guest create failed: {res_guest_create.text}"
        guest_b_id = res_guest_create.json()["booking_id"]
        assert res_guest_create.json()["guest_id"] == guest_id
        print(f"[PASSED] Test 13: Guest created booking #{guest_b_id} for themselves.")

        # ── TEST 14: Guest cannot create booking for another guest ──────────
        res_guest_fraud = await client.post(
            f"{BASE}/bookings",
            headers=guest_h,
            json={**guest_payload, "guest_id": 9999, "check_in_date": "2028-08-01", "check_out_date": "2028-08-05"}
        )
        assert res_guest_fraud.status_code == 403, f"Expected 403, got {res_guest_fraud.status_code}"
        print("[PASSED] Test 14: Guest blocked (403) from specifying a different guest_id.")

        # ── TEST 15: Invalid room returns 404 ───────────────────────────────
        res = await client.post(
            f"{BASE}/bookings",
            headers=owner_h,
            json={**create_payload, "room_id": 99999, "check_in_date": "2028-09-01", "check_out_date": "2028-09-05"}
        )
        assert res.status_code == 404
        print("[PASSED] Test 15: Invalid room_id=99999 returns 404 Not Found.")

        # ── TEST 16: Invalid guest returns 404 ──────────────────────────────
        res = await client.post(
            f"{BASE}/bookings",
            headers=owner_h,
            json={**create_payload, "guest_id": 99999, "check_in_date": "2028-09-01", "check_out_date": "2028-09-05"}
        )
        assert res.status_code == 404
        print("[PASSED] Test 16: Invalid guest_id=99999 returns 404 Not Found.")

        # ── TEST 17: Invalid stay date range returns 422 ────────────────────
        res = await client.post(
            f"{BASE}/bookings",
            headers=owner_h,
            json={**create_payload, "check_in_date": "2028-05-15", "check_out_date": "2028-05-10"}
        )
        assert res.status_code == 422
        print("[PASSED] Test 17: Inverted stay date range returns 422 Unprocessable Entity.")

        # ── TEST 18: Guests count exceeding room capacity is rejected ───────
        res = await client.post(
            f"{BASE}/bookings",
            headers=owner_h,
            json={**create_payload, "guests_count": 15, "check_in_date": "2028-09-10", "check_out_date": "2028-09-15"}
        )
        assert res.status_code == 422, f"Expected 422 for overcapacity, got {res.status_code}"
        assert "exceeds" in res.json()["detail"].lower()
        print("[PASSED] Test 18: Guests count exceeding capacity rejected with 422.")

        # ── TEST 19: Overlapping room booking is rejected with 409 ──────────
        # Try booking room 1 during [2028-05-12, 2028-05-18) which overlaps [2028-05-10, 2028-05-15)
        res_overlap = await client.post(
            f"{BASE}/bookings",
            headers=owner_h,
            json={**create_payload, "check_in_date": "2028-05-12", "check_out_date": "2028-05-18"}
        )
        assert res_overlap.status_code == 409, f"Expected 409 for overlapping booking, got {res_overlap.status_code}: {res_overlap.text}"
        assert "already booked" in res_overlap.json()["detail"].lower() or "conflict" in res_overlap.json()["detail"].lower()
        print("[PASSED] Test 19: Double booking conflict rejected with 409 Conflict.")

        # ── TEST 20: Adjacent stay behavior is accepted ─────────────────────
        # Immediate next check-in at 2028-05-15 (checkout of previous booking is 2028-05-15)
        adj_payload = {
            **create_payload,
            "check_in_date": "2028-05-15",
            "check_out_date": "2028-05-20"
        }
        res_adj = await client.post(f"{BASE}/bookings", headers=owner_h, json=adj_payload)
        assert res_adj.status_code == 201, f"Adjacent stay booking failed: {res_adj.text}"
        adj_b_id = res_adj.json()["booking_id"]
        print(f"[PASSED] Test 20: Adjacent stay [2028-05-15 to 2028-05-20) accepted as booking #{adj_b_id}.")

        # ── TEST 21: Cancellation releases room availability ────────────────
        # Cancel booking #new_booking_id [2028-05-10, 2028-05-15)
        res_cancel = await client.post(f"{BASE}/bookings/{new_booking_id}/cancel", headers=owner_h)
        assert res_cancel.status_code == 200
        assert res_cancel.json()["status"] == "cancelled"
        print(f"[PASSED] Test 21a: Cancelled booking #{new_booking_id}.")

        # Now re-booking room 1 for [2028-05-10, 2028-05-15) must succeed!
        res_rebook = await client.post(f"{BASE}/bookings", headers=owner_h, json=create_payload)
        assert res_rebook.status_code == 201, f"Rebooking after cancellation failed: {res_rebook.text}"
        rebooked_b_id = res_rebook.json()["booking_id"]
        print(f"[PASSED] Test 21b: Re-booked released room slot as booking #{rebooked_b_id}.")

        # ── TEST 22: Invalid status transition rejected ─────────────────────
        # Attempt to transition cancelled booking to confirmed or checked_in
        res_bad_trans = await client.patch(
            f"{BASE}/bookings/{new_booking_id}",
            headers=owner_h,
            json={"status": "confirmed"}
        )
        assert res_bad_trans.status_code == 400, f"Expected 400 for invalid transition, got {res_bad_trans.status_code}"
        print("[PASSED] Test 22: Invalid transition (cancelled -> confirmed) rejected with 400 Bad Request.")

        # ── TEST 23: Valid status lifecycle (confirmed -> checked_in -> checked_out)
        res_in = await client.patch(
            f"{BASE}/bookings/{rebooked_b_id}",
            headers=owner_h,
            json={"status": "checked_in"}
        )
        assert res_in.status_code == 200
        assert res_in.json()["status"] == "checked_in"

        res_out = await client.patch(
            f"{BASE}/bookings/{rebooked_b_id}",
            headers=owner_h,
            json={"status": "checked_out"}
        )
        assert res_out.status_code == 200
        assert res_out.json()["status"] == "checked_out"
        print(f"[PASSED] Test 23: Completed full status lifecycle for booking #{rebooked_b_id}.")

        # ── TEST 24: Unsafe modifications on completed booking blocked ──────
        res_unsafe = await client.patch(
            f"{BASE}/bookings/{rebooked_b_id}",
            headers=owner_h,
            json={"check_in_date": "2028-01-01"}
        )
        assert res_unsafe.status_code == 400
        print("[PASSED] Test 24: Modifying dates on checked_out booking blocked with 400.")

        # ── TEST 25: Manager cross-property update blocked ──────────────────
        res_mgr_x_up = await client.patch(
            f"{BASE}/bookings/{other_prop_b_id}",
            headers=mgr_h,
            json={"notes": "Hacked notes"}
        )
        assert res_mgr_x_up.status_code == 403
        print("[PASSED] Test 25: Manager cross-property update blocked with 403 Forbidden.")

        # ── TEST 26: Guest cannot modify another guest's booking ────────────
        res_g_x_up = await client.patch(
            f"{BASE}/bookings/{other_booking_id}",
            headers=guest_h,
            json={"notes": "Guest hack"}
        )
        assert res_g_x_up.status_code == 403
        print("[PASSED] Test 26: Guest modifying another guest's booking blocked with 403 Forbidden.")

        # ── TEST 27: Deletion of booking with existing payments returns 409 ──
        # Find a seeded booking that has payments
        res_del_conflict = await client.delete(f"{BASE}/bookings/{other_booking_id}", headers=owner_h)
        assert res_del_conflict.status_code == 409
        assert "payment" in res_del_conflict.json()["detail"].lower()
        print(f"[PASSED] Test 27: Deleting booking #{other_booking_id} with payments blocked with 409 Conflict.")

        # ── TEST 28: Safe delete of temporary unpaid booking ────────────────
        res_del_ok = await client.delete(f"{BASE}/bookings/{mgr_booking_id}", headers=owner_h)
        assert res_del_ok.status_code == 200
        print(f"[PASSED] Test 28a: Safely deleted unpaid booking #{mgr_booking_id}.")

        # Confirm 404
        res_confirm_404 = await client.get(f"{BASE}/bookings/{mgr_booking_id}", headers=owner_h)
        assert res_confirm_404.status_code == 404
        print(f"[PASSED] Test 28b: Deleted booking #{mgr_booking_id} confirmed 404 Not Found.")

        # Clean up remaining test bookings (adj_b_id, guest_b_id, new_booking_id, rebooked_b_id)
        for cleanup_id in [adj_b_id, guest_b_id, new_booking_id, rebooked_b_id]:
            await client.delete(f"{BASE}/bookings/{cleanup_id}", headers=owner_h)

        print("\n[ALL PASSED] All Bookings Management API tests passed!")
