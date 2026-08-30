"""
Phase 6: Reviews Management API — Integration Test Suite

Tests all required scenarios:
  1.  Owner can list reviews (200 OK)
  2.  Owner can retrieve a single review (200 OK)
  3.  Manager lists only reviews for assigned property (200 OK)
  4.  Manager cannot access a review from another property (403 Forbidden)
  5.  Staff lists only reviews for assigned property (200 OK)
  6.  Staff cannot access a review from another property (403 Forbidden)
  7.  Guest can create a review for their own checked-out booking (201 Created)
  8.  Guest cannot review another guest's booking (403 Forbidden)
  9.  Duplicate review attempt returns 409 Conflict
  10. Invalid booking ID returns 404 Not Found
  11. Invalid review ID returns 404 Not Found
  12. Rating out of range returns 422 Unprocessable Entity
  13. Review on non-checked-out booking returns 400 Bad Request
  14. Unauthenticated POST returns 401 Unauthorized
  15. Manager cross-property create returns 403 Forbidden
  16. Owner can PATCH (update) a review (200 OK)
  17. Staff update returns 403 Forbidden
  18. Owner can DELETE a review (200 OK)
  19. Staff delete returns 403 Forbidden
  20. Filter by property_id works correctly for Owner
"""
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

BASE = "/api/v1"

# Seeded known IDs (verified against PostgreSQL seed data)
SEEDED_REVIEW_ID_PROP1 = 4   # Property 1 (Kaveri Riverside)
SEEDED_REVIEW_ID_PROP2 = 1   # Property 2 (Kaveri Hilltop)


async def login(client: AsyncClient, email: str, password: str = "Password@123") -> dict:
    res = await client.post(f"{BASE}/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    return res.json()


@pytest.mark.asyncio
async def test_reviews_management_suite():
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
        guest_id    = guest_data["user"]["guest_id"]    # guest_id=20

        assert mgr_prop_id == 1
        assert guest_id is not None

        # ── TEST 1: Owner lists all reviews ─────────────────────────────────
        res = await client.get(f"{BASE}/reviews")   # Public endpoint
        assert res.status_code == 200, f"Public list failed: {res.text}"
        all_reviews = res.json()
        assert len(all_reviews) >= 40, f"Expected seeded reviews, got {len(all_reviews)}"
        print(f"[PASSED] Test 1: Listed {len(all_reviews)} reviews (public).")

        # ── TEST 2: Owner retrieves single review ───────────────────────────
        res = await client.get(f"{BASE}/reviews/{SEEDED_REVIEW_ID_PROP1}", headers=owner_h)
        assert res.status_code == 200, f"Owner get single review failed: {res.text}"
        rev = res.json()
        assert rev["review_id"] == SEEDED_REVIEW_ID_PROP1
        assert rev["rating"] in range(1, 6)
        print(f"[PASSED] Test 2: Owner retrieved review #{SEEDED_REVIEW_ID_PROP1} (property {rev['property_id']}).")

        # ── TEST 3: Manager lists only their property reviews ────────────────
        res = await client.get(f"{BASE}/reviews", headers=mgr_h)
        assert res.status_code == 200
        mgr_reviews = res.json()
        assert len(mgr_reviews) > 0
        # All returned reviews must belong to manager's property
        for r in mgr_reviews:
            assert r["property_id"] == mgr_prop_id, \
                f"Manager saw review from property {r['property_id']}, expected {mgr_prop_id}"
        print(f"[PASSED] Test 3: Manager listed {len(mgr_reviews)} reviews, all property {mgr_prop_id}.")

        # ── TEST 4: Manager cannot access review from another property ───────
        res = await client.get(f"{BASE}/reviews/{SEEDED_REVIEW_ID_PROP2}", headers=mgr_h)
        assert res.status_code == 403, f"Expected 403, got {res.status_code}: {res.text}"
        print(f"[PASSED] Test 4: Manager blocked (403) from accessing property-2 review #{SEEDED_REVIEW_ID_PROP2}.")

        # ── TEST 5: Staff lists only their property reviews ──────────────────
        res = await client.get(f"{BASE}/reviews", headers=staff_h)
        assert res.status_code == 200
        staff_reviews = res.json()
        assert len(staff_reviews) > 0
        for r in staff_reviews:
            assert r["property_id"] == mgr_prop_id, \
                f"Staff saw review from property {r['property_id']}, expected {mgr_prop_id}"
        print(f"[PASSED] Test 5: Staff listed {len(staff_reviews)} reviews, all property {mgr_prop_id}.")

        # ── TEST 6: Staff cannot access review from another property ─────────
        res = await client.get(f"{BASE}/reviews/{SEEDED_REVIEW_ID_PROP2}", headers=staff_h)
        assert res.status_code == 403, f"Expected 403, got {res.status_code}: {res.text}"
        print(f"[PASSED] Test 6: Staff blocked (403) from accessing property-2 review.")

        # ── Setup: Create a booking for the demo guest, transition to checked_out ──
        # Use room 9 which is in property 1, and far-future dates to avoid conflicts
        new_booking_payload = {
            "room_id": 9,
            "guest_id": guest_id,
            "check_in_date": "2038-03-01",
            "check_out_date": "2038-03-04",
            "guests_count": 1
        }
        res_book = await client.post(f"{BASE}/bookings", headers=owner_h, json=new_booking_payload)
        assert res_book.status_code == 201, f"Booking creation failed: {res_book.text}"
        test_booking_id = res_book.json()["booking_id"]
        print(f"[SETUP] Created test booking #{test_booking_id} for guest #{guest_id}.")

        # Transition confirmed → checked_in → checked_out via PATCH status
        res_ci = await client.patch(
            f"{BASE}/bookings/{test_booking_id}",
            headers=owner_h,
            json={"status": "checked_in"}
        )
        assert res_ci.status_code == 200, f"Check-in PATCH failed: {res_ci.text}"
        res_co = await client.patch(
            f"{BASE}/bookings/{test_booking_id}",
            headers=owner_h,
            json={"status": "checked_out"}
        )
        assert res_co.status_code == 200, f"Check-out PATCH failed: {res_co.text}"
        print(f"[SETUP] Booking #{test_booking_id} transitioned to checked_out.")

        # ── TEST 7: Guest creates review for own checked-out booking ─────────
        review_payload = {"booking_id": test_booking_id, "rating": 5, "comments": "Excellent stay! Very clean rooms."}
        res_rev = await client.post(f"{BASE}/reviews", headers=guest_h, json=review_payload)
        assert res_rev.status_code == 201, f"Guest review creation failed: {res_rev.text}"
        created_review = res_rev.json()
        test_review_id = created_review["review_id"]
        assert created_review["booking_id"] == test_booking_id
        assert created_review["rating"] == 5
        assert created_review["comments"] == "Excellent stay! Very clean rooms."
        print(f"[PASSED] Test 7: Guest created review #{test_review_id} for own booking #{test_booking_id}.")

        # ── TEST 8: Guest cannot review another guest's booking ──────────────
        # booking_id=36 is seeded as checked_out (with guest_id != 20)
        res_cross = await client.post(
            f"{BASE}/reviews",
            headers=guest_h,
            json={"booking_id": 36, "rating": 3, "comments": "Not my booking."}
        )
        assert res_cross.status_code == 403, f"Expected 403, got {res_cross.status_code}: {res_cross.text}"
        print(f"[PASSED] Test 8: Guest blocked (403) from reviewing another guest's booking.")

        # ── TEST 9: Duplicate review returns 409 Conflict ───────────────────
        res_dup = await client.post(
            f"{BASE}/reviews",
            headers=guest_h,
            json={"booking_id": test_booking_id, "rating": 4, "comments": "Trying to review again."}
        )
        assert res_dup.status_code == 409, f"Expected 409 Conflict, got {res_dup.status_code}: {res_dup.text}"
        print(f"[PASSED] Test 9: Duplicate review for booking #{test_booking_id} returned 409 Conflict.")

        # ── TEST 10: Invalid booking ID returns 404 Not Found ────────────────
        res_404b = await client.post(
            f"{BASE}/reviews",
            headers=owner_h,
            json={"booking_id": 999999, "rating": 3, "comments": "No such booking."}
        )
        assert res_404b.status_code == 404, f"Expected 404, got {res_404b.status_code}: {res_404b.text}"
        print("[PASSED] Test 10: Invalid booking ID returned 404 Not Found.")

        # ── TEST 11: Invalid review ID returns 404 Not Found ─────────────────
        res_404r = await client.get(f"{BASE}/reviews/999999", headers=owner_h)
        assert res_404r.status_code == 404, f"Expected 404, got {res_404r.status_code}: {res_404r.text}"
        print("[PASSED] Test 11: Invalid review ID returned 404 Not Found.")

        # ── TEST 12: Rating out of range returns 422 ─────────────────────────
        res_422 = await client.post(
            f"{BASE}/reviews",
            headers=owner_h,
            json={"booking_id": test_booking_id, "rating": 10, "comments": "Bad rating."}
        )
        assert res_422.status_code == 422, f"Expected 422, got {res_422.status_code}: {res_422.text}"
        print("[PASSED] Test 12: Rating=10 returned 422 Unprocessable Entity.")

        # ── TEST 13: Review on non-checked-out booking returns 400 ───────────
        # Create a fresh booking (still 'confirmed') and try to review it
        fresh_booking = await client.post(f"{BASE}/bookings", headers=owner_h, json={
            "room_id": 9,
            "guest_id": guest_id,
            "check_in_date": "2038-04-01",
            "check_out_date": "2038-04-03",
            "guests_count": 1
        })
        assert fresh_booking.status_code == 201, f"Fresh booking creation failed: {fresh_booking.text}"
        fresh_booking_id = fresh_booking.json()["booking_id"]

        res_bad_status = await client.post(
            f"{BASE}/reviews",
            headers=owner_h,
            json={"booking_id": fresh_booking_id, "rating": 4, "comments": "Not yet checked out."}
        )
        assert res_bad_status.status_code == 400, f"Expected 400, got {res_bad_status.status_code}: {res_bad_status.text}"
        assert "checked-out" in res_bad_status.json()["detail"].lower() or \
               "checked_out" in res_bad_status.json()["detail"].lower() or \
               "completed" in res_bad_status.json()["detail"].lower()
        print(f"[PASSED] Test 13: Review on confirmed booking #{fresh_booking_id} returned 400 Bad Request.")

        # ── TEST 14: Unauthenticated POST returns 401 Unauthorized ───────────
        res_401 = await client.post(
            f"{BASE}/reviews",
            json={"booking_id": test_booking_id, "rating": 3, "comments": "No token."}
        )
        assert res_401.status_code == 401, f"Expected 401, got {res_401.status_code}: {res_401.text}"
        print("[PASSED] Test 14: Unauthenticated POST returned 401 Unauthorized.")

        # ── TEST 15: Manager cross-property create returns 403 ───────────────
        # booking_id=39 is in property 3 (not property 1 = manager's property)
        res_mgr_cross = await client.post(
            f"{BASE}/reviews",
            headers=mgr_h,
            json={"booking_id": 39, "rating": 3, "comments": "Mgr cross-prop attempt."}
        )
        assert res_mgr_cross.status_code == 403, f"Expected 403, got {res_mgr_cross.status_code}: {res_mgr_cross.text}"
        print("[PASSED] Test 15: Manager cross-property review creation returned 403 Forbidden.")

        # ── TEST 16: Owner updates (PATCH) a review ──────────────────────────
        res_patch = await client.patch(
            f"{BASE}/reviews/{test_review_id}",
            headers=owner_h,
            json={"rating": 4, "comments": "Updated by owner: Great stay overall."}
        )
        assert res_patch.status_code == 200, f"Owner PATCH failed: {res_patch.text}"
        patched = res_patch.json()
        assert patched["rating"] == 4
        assert "Updated by owner" in patched["comments"]
        print(f"[PASSED] Test 16: Owner updated review #{test_review_id} to rating=4.")

        # ── TEST 17: Staff update returns 403 Forbidden ───────────────────────
        res_staff_patch = await client.patch(
            f"{BASE}/reviews/{test_review_id}",
            headers=staff_h,
            json={"rating": 2, "comments": "Staff attempted update."}
        )
        assert res_staff_patch.status_code == 403, f"Expected 403, got {res_staff_patch.status_code}: {res_staff_patch.text}"
        print(f"[PASSED] Test 17: Staff PATCH on review #{test_review_id} returned 403 Forbidden.")

        # ── TEST 18: Filter by property_id works for Owner ───────────────────
        res_filtered = await client.get(
            f"{BASE}/reviews?property_id=1",
            headers=owner_h
        )
        assert res_filtered.status_code == 200
        filtered = res_filtered.json()
        assert len(filtered) > 0
        for r in filtered:
            assert r["property_id"] == 1, f"Filter returned wrong property: {r['property_id']}"
        print(f"[PASSED] Test 18: Owner filtered reviews by property_id=1, got {len(filtered)} results.")

        # ── TEST 19: Owner deletes (DELETE) a review ─────────────────────────
        res_del = await client.delete(f"{BASE}/reviews/{test_review_id}", headers=owner_h)
        assert res_del.status_code == 200, f"Owner DELETE failed: {res_del.text}"
        assert "deleted" in res_del.json()["message"].lower()
        print(f"[PASSED] Test 19: Owner deleted review #{test_review_id}.")

        # Confirm the review is gone (404)
        res_gone = await client.get(f"{BASE}/reviews/{test_review_id}", headers=owner_h)
        assert res_gone.status_code == 404
        print(f"[PASSED] Test 19b: Deleted review #{test_review_id} confirmed gone (404).")

        # ── TEST 20: Staff delete returns 403 ────────────────────────────────
        # Use a seeded review for this test (then we won't actually delete it)
        res_staff_del = await client.delete(f"{BASE}/reviews/{SEEDED_REVIEW_ID_PROP2}", headers=staff_h)
        assert res_staff_del.status_code == 403, f"Expected 403, got {res_staff_del.status_code}: {res_staff_del.text}"
        print(f"[PASSED] Test 20: Staff DELETE on review #{SEEDED_REVIEW_ID_PROP2} returned 403 Forbidden.")

        # ── Cleanup ───────────────────────────────────────────────────────────
        # Delete test bookings (fresh_booking still exists in confirmed state)
        from app.database import SessionLocal
        from app.models.booking import Booking, Payment, Review as ReviewModel
        from app.models.auth import PaymentIdempotency

        db_cleanup = SessionLocal()
        for b_id in [test_booking_id, fresh_booking_id]:
            db_cleanup.query(ReviewModel).filter(ReviewModel.booking_id == b_id).delete()
            db_cleanup.query(PaymentIdempotency).filter(PaymentIdempotency.booking_id == b_id).delete()
            db_cleanup.query(Payment).filter(Payment.booking_id == b_id).delete()
            db_cleanup.query(Booking).filter(Booking.booking_id == b_id).delete()
        db_cleanup.commit()
        db_cleanup.close()

        print("\n[ALL PASSED] All Reviews Management API tests passed!")
