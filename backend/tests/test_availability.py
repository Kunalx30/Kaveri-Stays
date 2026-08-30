"""
Phase 7: Room Availability & Search API — Integration Test Suite

Tests all required scenarios:
  1.  Public availability search returns results with correct schema
  2.  Property filter restricts results to the correct property
  3.  Room type filter works correctly
  4.  guests_count filter excludes rooms with insufficient max_occupancy
  5.  Invalid property ID returns 404 Not Found
  6.  Invalid room type ID returns 404 Not Found
  7.  check_out before check_in returns 422 Unprocessable Entity
  8.  Same check_in and check_out date returns 422 Unprocessable Entity
  9.  A booked room (confirmed) is excluded from availability for overlapping dates
  10. A non-overlapping date range still shows the room as available
  11. A cancelled booking does NOT block availability
  12. A checked_out booking blocks its room for the same period
  13. Owner search works across all properties
  14. Manager auto-scoped to assigned property only
  15. Staff auto-scoped to assigned property only
  16. Invalid guests_count (0) returns 422 Unprocessable Entity
  17. Nightly rate is returned when a rate plan covers the check-in date
  18. Property-scoped endpoint works correctly (GET /availability/property/{id})
  19. Manager cross-property attempt on property-scoped endpoint returns 403
  20. Total available count matches rooms list length
"""
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

BASE = "/api/v1"

# Known seeded data from database inspection
PROP1_ID = 1   # Kaveri Riverside  (13 rooms)
PROP2_ID = 2   # Kaveri Hilltop    (13 rooms)
PROP3_ID = 3   # Kaveri Backwater  (12 rooms)
ROOM_TYPE_STANDARD = 1   # max_occupancy=2
ROOM_TYPE_DELUXE   = 2   # max_occupancy=3
ROOM_TYPE_SUITE    = 3   # max_occupancy=4

# Far-future dates with no seeded bookings
FUTURE_IN  = "2040-06-01"
FUTURE_OUT = "2040-06-05"

# A room we know is in Property 1 (from earlier data inspection: room_id=9, property_id=1)
TEST_ROOM_ID = 9


async def login(client: AsyncClient, email: str, password: str = "Password@123") -> dict:
    res = await client.post(f"{BASE}/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    return res.json()


@pytest.mark.asyncio
async def test_availability_search_suite():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:

        # ── Authenticate all roles ──────────────────────────────────────────
        owner_data  = await login(client, "owner@kaveristays.com")
        mgr_data    = await login(client, "manager.riverside@kaveristays.com")
        staff_data  = await login(client, "staff.riverside@kaveristays.com")
        guest_data  = await login(client, "guest.demo@kaveristays.com")

        owner_h  = {"Authorization": f"Bearer {owner_data['tokens']['access_token']}"}
        mgr_h    = {"Authorization": f"Bearer {mgr_data['tokens']['access_token']}"}
        staff_h  = {"Authorization": f"Bearer {staff_data['tokens']['access_token']}"}
        guest_h  = {"Authorization": f"Bearer {guest_data['tokens']['access_token']}"}

        mgr_prop_id = mgr_data["user"]["property_id"]   # 1 = Kaveri Riverside
        guest_id    = guest_data["user"]["guest_id"]
        assert mgr_prop_id == PROP1_ID

        # ── TEST 1: Public availability search returns results ───────────────
        res = await client.get(
            f"{BASE}/availability",
            params={"check_in": FUTURE_IN, "check_out": FUTURE_OUT, "guests_count": 2}
        )
        assert res.status_code == 200, f"Public availability failed: {res.text}"
        body = res.json()
        assert "rooms" in body
        assert "total_available" in body
        assert body["total_available"] == len(body["rooms"])
        assert body["check_in"] == FUTURE_IN
        assert body["check_out"] == FUTURE_OUT
        assert body["guests_count"] == 2
        # All results must have max_occupancy >= 2
        for rm in body["rooms"]:
            assert rm["max_occupancy"] >= 2
            assert "room_id" in rm
            assert "room_number" in rm
            assert "property_name" in rm
            assert "room_type_name" in rm
        total_all = body["total_available"]
        print(f"[PASSED] Test 1: Public search returned {total_all} available rooms for {FUTURE_IN} to {FUTURE_OUT}.")

        # ── TEST 2: Property filter restricts results ────────────────────────
        res2 = await client.get(
            f"{BASE}/availability",
            params={"check_in": FUTURE_IN, "check_out": FUTURE_OUT,
                    "guests_count": 1, "property_id": PROP1_ID}
        )
        assert res2.status_code == 200
        body2 = res2.json()
        assert all(r["property_id"] == PROP1_ID for r in body2["rooms"]), \
            "Filter by property_id returned rooms from wrong properties"
        assert len(body2["rooms"]) > 0
        print(f"[PASSED] Test 2: Property filter returned {len(body2['rooms'])} rooms for Property {PROP1_ID}.")

        # ── TEST 3: Room type filter works ────────────────────────────────────
        res3 = await client.get(
            f"{BASE}/availability",
            params={"check_in": FUTURE_IN, "check_out": FUTURE_OUT,
                    "guests_count": 1, "property_id": PROP1_ID,
                    "room_type_id": ROOM_TYPE_SUITE}
        )
        assert res3.status_code == 200
        body3 = res3.json()
        assert all(r["room_type_id"] == ROOM_TYPE_SUITE for r in body3["rooms"]), \
            "Room type filter returned wrong room types"
        assert len(body3["rooms"]) > 0
        print(f"[PASSED] Test 3: Room type filter (Suite) returned {len(body3['rooms'])} suites.")

        # ── TEST 4: guests_count filters by max_occupancy ────────────────────
        # Request 4 guests — only Suites (max_occ=4) should appear
        res4 = await client.get(
            f"{BASE}/availability",
            params={"check_in": FUTURE_IN, "check_out": FUTURE_OUT,
                    "guests_count": 4, "property_id": PROP1_ID}
        )
        assert res4.status_code == 200
        body4 = res4.json()
        for rm in body4["rooms"]:
            assert rm["max_occupancy"] >= 4, \
                f"Room {rm['room_id']} has max_occupancy={rm['max_occupancy']} but guests_count=4 was requested"
        # Standard (max_occ=2) and Deluxe (max_occ=3) must not appear
        room_type_names = {rm["room_type_name"] for rm in body4["rooms"]}
        assert "Standard" not in room_type_names, "Standard rooms should be excluded for guests_count=4"
        assert "Deluxe" not in room_type_names, "Deluxe rooms should be excluded for guests_count=4"
        print(f"[PASSED] Test 4: guests_count=4 filter returned {len(body4['rooms'])} Suite rooms only.")

        # ── TEST 5: Invalid property ID returns 404 ──────────────────────────
        res5 = await client.get(
            f"{BASE}/availability",
            params={"check_in": FUTURE_IN, "check_out": FUTURE_OUT,
                    "guests_count": 1, "property_id": 999999}
        )
        assert res5.status_code == 404, f"Expected 404 for non-existent property, got {res5.status_code}: {res5.text}"
        print("[PASSED] Test 5: Non-existent property_id returned 404 Not Found.")

        # ── TEST 6: Invalid room type ID returns 404 ─────────────────────────
        res6 = await client.get(
            f"{BASE}/availability",
            params={"check_in": FUTURE_IN, "check_out": FUTURE_OUT,
                    "guests_count": 1, "room_type_id": 999999}
        )
        assert res6.status_code == 404, f"Expected 404 for non-existent room_type, got {res6.status_code}: {res6.text}"
        print("[PASSED] Test 6: Non-existent room_type_id returned 404 Not Found.")

        # ── TEST 7: check_out before check_in returns 422 ────────────────────
        res7 = await client.get(
            f"{BASE}/availability",
            params={"check_in": "2040-06-10", "check_out": "2040-06-01", "guests_count": 1}
        )
        assert res7.status_code == 422, f"Expected 422 for reversed dates, got {res7.status_code}: {res7.text}"
        print("[PASSED] Test 7: check_out before check_in returned 422.")

        # ── TEST 8: Same check_in and check_out returns 422 ─────────────────
        res8 = await client.get(
            f"{BASE}/availability",
            params={"check_in": "2040-06-01", "check_out": "2040-06-01", "guests_count": 1}
        )
        assert res8.status_code == 422, f"Expected 422 for same dates, got {res8.status_code}: {res8.text}"
        print("[PASSED] Test 8: Same check_in and check_out returned 422.")

        # ── TEST 9: Booked room excluded for overlapping dates ───────────────
        # Create a booking for TEST_ROOM_ID (Property 1, room 9)
        book_res = await client.post(f"{BASE}/bookings", headers=owner_h, json={
            "room_id": TEST_ROOM_ID,
            "guest_id": guest_id,
            "check_in_date": "2041-01-10",
            "check_out_date": "2041-01-15",
            "guests_count": 1
        })
        assert book_res.status_code == 201, f"Booking creation failed: {book_res.text}"
        test_booking_id = book_res.json()["booking_id"]
        print(f"[SETUP] Created booking #{test_booking_id} for room #{TEST_ROOM_ID}.")

        # Now search for the same dates — room must be excluded
        res9 = await client.get(
            f"{BASE}/availability",
            params={"check_in": "2041-01-10", "check_out": "2041-01-15",
                    "guests_count": 1, "property_id": PROP1_ID}
        )
        assert res9.status_code == 200
        returned_ids_9 = {r["room_id"] for r in res9.json()["rooms"]}
        assert TEST_ROOM_ID not in returned_ids_9, \
            f"Room #{TEST_ROOM_ID} should be blocked but appeared in availability results"
        print(f"[PASSED] Test 9: Booked room #{TEST_ROOM_ID} correctly excluded for overlapping dates.")

        # ── TEST 10: Non-overlapping dates still show the room ───────────────
        res10 = await client.get(
            f"{BASE}/availability",
            params={"check_in": "2041-02-01", "check_out": "2041-02-05",
                    "guests_count": 1, "property_id": PROP1_ID}
        )
        assert res10.status_code == 200
        returned_ids_10 = {r["room_id"] for r in res10.json()["rooms"]}
        assert TEST_ROOM_ID in returned_ids_10, \
            f"Room #{TEST_ROOM_ID} should be available for non-overlapping dates but was excluded"
        print(f"[PASSED] Test 10: Room #{TEST_ROOM_ID} correctly shown as available for non-overlapping dates.")

        # ── TEST 11: Cancelled booking does NOT block availability ───────────
        # Cancel the test booking and verify room becomes available again
        cancel_res = await client.post(f"{BASE}/bookings/{test_booking_id}/cancel", headers=owner_h)
        assert cancel_res.status_code == 200, f"Cancel failed: {cancel_res.text}"

        res11 = await client.get(
            f"{BASE}/availability",
            params={"check_in": "2041-01-10", "check_out": "2041-01-15",
                    "guests_count": 1, "property_id": PROP1_ID}
        )
        assert res11.status_code == 200
        returned_ids_11 = {r["room_id"] for r in res11.json()["rooms"]}
        assert TEST_ROOM_ID in returned_ids_11, \
            f"Room #{TEST_ROOM_ID} should be available after cancellation but was still excluded"
        print(f"[PASSED] Test 11: Cancelled booking does not block availability — room #{TEST_ROOM_ID} reappeared.")

        # ── TEST 12: A checked_out booking DOES block the same period ────────
        # Create and check-in + check-out a booking
        book2_res = await client.post(f"{BASE}/bookings", headers=owner_h, json={
            "room_id": TEST_ROOM_ID,
            "guest_id": guest_id,
            "check_in_date": "2041-03-10",
            "check_out_date": "2041-03-15",
            "guests_count": 1
        })
        assert book2_res.status_code == 201, f"Booking 2 creation failed: {book2_res.text}"
        test_booking2_id = book2_res.json()["booking_id"]
        # Transition to checked_in then checked_out
        await client.patch(f"{BASE}/bookings/{test_booking2_id}", headers=owner_h,
                           json={"status": "checked_in"})
        await client.patch(f"{BASE}/bookings/{test_booking2_id}", headers=owner_h,
                           json={"status": "checked_out"})

        res12 = await client.get(
            f"{BASE}/availability",
            params={"check_in": "2041-03-10", "check_out": "2041-03-15",
                    "guests_count": 1, "property_id": PROP1_ID}
        )
        assert res12.status_code == 200
        returned_ids_12 = {r["room_id"] for r in res12.json()["rooms"]}
        assert TEST_ROOM_ID not in returned_ids_12, \
            f"Room #{TEST_ROOM_ID} should be blocked by checked_out booking but appeared"
        print(f"[PASSED] Test 12: checked_out booking correctly blocks room #{TEST_ROOM_ID} for same period.")

        # ── TEST 13: Owner can search all properties ──────────────────────────
        res13 = await client.get(
            f"{BASE}/availability",
            headers=owner_h,
            params={"check_in": FUTURE_IN, "check_out": FUTURE_OUT, "guests_count": 1}
        )
        assert res13.status_code == 200
        body13 = res13.json()
        prop_ids_seen = {r["property_id"] for r in body13["rooms"]}
        assert len(prop_ids_seen) > 1, "Owner should see rooms from multiple properties"
        assert body13["total_available"] > 0
        print(f"[PASSED] Test 13: Owner sees rooms across {len(prop_ids_seen)} properties.")

        # ── TEST 14: Manager auto-scoped to assigned property ─────────────────
        res14 = await client.get(
            f"{BASE}/availability",
            headers=mgr_h,
            params={"check_in": FUTURE_IN, "check_out": FUTURE_OUT, "guests_count": 1}
        )
        assert res14.status_code == 200
        body14 = res14.json()
        assert all(r["property_id"] == mgr_prop_id for r in body14["rooms"]), \
            "Manager should only see rooms from their assigned property"
        assert len(body14["rooms"]) > 0
        print(f"[PASSED] Test 14: Manager auto-scoped — only Property {mgr_prop_id} rooms returned.")

        # ── TEST 15: Staff auto-scoped to assigned property ──────────────────
        res15 = await client.get(
            f"{BASE}/availability",
            headers=staff_h,
            params={"check_in": FUTURE_IN, "check_out": FUTURE_OUT, "guests_count": 1}
        )
        assert res15.status_code == 200
        body15 = res15.json()
        assert all(r["property_id"] == mgr_prop_id for r in body15["rooms"]), \
            "Staff should only see rooms from their assigned property"
        print(f"[PASSED] Test 15: Staff auto-scoped — only Property {mgr_prop_id} rooms returned.")

        # ── TEST 16: Invalid guests_count=0 returns 422 ──────────────────────
        res16 = await client.get(
            f"{BASE}/availability",
            params={"check_in": FUTURE_IN, "check_out": FUTURE_OUT, "guests_count": 0}
        )
        assert res16.status_code == 422, f"Expected 422 for guests_count=0, got {res16.status_code}: {res16.text}"
        print("[PASSED] Test 16: guests_count=0 returned 422 Unprocessable Entity.")

        # ── TEST 17: Nightly rate returned when rate plan exists ─────────────
        # Property 1 has rate plans. Check that rooms returned for property 1
        # include a nightly_rate value
        res17 = await client.get(
            f"{BASE}/availability",
            params={"check_in": "2025-03-01", "check_out": "2025-03-05",
                    "guests_count": 1, "property_id": PROP1_ID}
        )
        assert res17.status_code == 200
        body17 = res17.json()
        rooms_with_rate = [r for r in body17["rooms"] if r["nightly_rate"] is not None]
        # At minimum, some rooms should have a rate plan covering early 2025
        assert len(rooms_with_rate) > 0, "Expected some rooms to have nightly_rate from RatePlan"
        print(f"[PASSED] Test 17: {len(rooms_with_rate)} rooms returned with nightly_rate from RatePlan.")

        # ── TEST 18: Property-scoped endpoint works ───────────────────────────
        res18 = await client.get(
            f"{BASE}/availability/property/{PROP2_ID}",
            params={"check_in": FUTURE_IN, "check_out": FUTURE_OUT, "guests_count": 1}
        )
        assert res18.status_code == 200, f"Property-scoped endpoint failed: {res18.text}"
        body18 = res18.json()
        assert all(r["property_id"] == PROP2_ID for r in body18["rooms"]), \
            "Property-scoped endpoint returned rooms from wrong property"
        assert len(body18["rooms"]) > 0
        print(f"[PASSED] Test 18: Property-scoped endpoint returned {len(body18['rooms'])} rooms for Property {PROP2_ID}.")

        # ── TEST 19: Manager cross-property on /availability/property returns 403
        res19 = await client.get(
            f"{BASE}/availability/property/{PROP2_ID}",
            headers=mgr_h,
            params={"check_in": FUTURE_IN, "check_out": FUTURE_OUT, "guests_count": 1}
        )
        assert res19.status_code == 403, \
            f"Expected 403 for Manager cross-property endpoint, got {res19.status_code}: {res19.text}"
        print(f"[PASSED] Test 19: Manager blocked (403) from property-scoped availability of Property {PROP2_ID}.")

        # ── TEST 20: total_available matches rooms list length ───────────────
        res20 = await client.get(
            f"{BASE}/availability",
            params={"check_in": FUTURE_IN, "check_out": FUTURE_OUT, "guests_count": 1}
        )
        assert res20.status_code == 200
        body20 = res20.json()
        assert body20["total_available"] == len(body20["rooms"]), \
            f"total_available={body20['total_available']} != len(rooms)={len(body20['rooms'])}"
        print(f"[PASSED] Test 20: total_available={body20['total_available']} matches rooms list length.")

        # ── Cleanup ───────────────────────────────────────────────────────────
        from app.database import SessionLocal
        from app.models.booking import Booking, Payment, Review
        from app.models.auth import PaymentIdempotency

        db_cleanup = SessionLocal()
        for b_id in [test_booking_id, test_booking2_id]:
            db_cleanup.query(Review).filter(Review.booking_id == b_id).delete()
            db_cleanup.query(PaymentIdempotency).filter(PaymentIdempotency.booking_id == b_id).delete()
            db_cleanup.query(Payment).filter(Payment.booking_id == b_id).delete()
            db_cleanup.query(Booking).filter(Booking.booking_id == b_id).delete()
        db_cleanup.commit()
        db_cleanup.close()

        print("\n[ALL PASSED] All Room Availability & Search API tests passed!")
