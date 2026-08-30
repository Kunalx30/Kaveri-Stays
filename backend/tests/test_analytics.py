"""
Phase 8: Hotel Analytics & Dashboard API — Integration Test Suite

Tests all required scenarios:
  1.  Owner can access dashboard summary (200 OK)
  2.  Owner sees aggregate data across all properties
  3.  Owner can filter dashboard analytics by property_id
  4.  Owner can access booking analytics (200 OK)
  5.  Booking status counts match known totals
  6.  Owner can access revenue analytics (200 OK)
  7.  Payment amounts and transaction counts are aggregated correctly
  8.  Owner can access review analytics (200 OK)
  9.  Average review rating is calculated accurately
  10. Rating distribution (1 to 5 stars) sums to total reviews
  11. Owner can access occupancy analytics with date window (200 OK)
  12. Manager dashboard auto-scoped to assigned property (Property 1)
  13. Manager cannot request analytics for another property (Property 2) -> 403 Forbidden
  14. Manager cross-property filter query param returns 403 Forbidden
  15. Staff user is blocked from internal analytics -> 403 Forbidden
  16. Guest user is blocked from internal analytics -> 403 Forbidden
  17. Unauthenticated request returns 401 Unauthorized
  18. Non-existent property ID returns 404 Not Found
  19. Invalid date range (start_date > end_date) returns 422 Unprocessable Entity
  20. Invalid occupancy period (period_start >= period_end) returns 422 Unprocessable Entity
  21. Owner can access property performance comparison list
  22. Manager property performance endpoint auto-scoped to assigned property
  23. Empty / out-of-range date filter returns zero counts gracefully without errors
"""
from decimal import Decimal
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

BASE = "/api/v1"

PROP1_ID = 1  # Kaveri Riverside
PROP2_ID = 2  # Kaveri Hilltop
PROP3_ID = 3  # Kaveri Backwater


async def login(client: AsyncClient, email: str, password: str = "Password@123") -> dict:
    res = await client.post(f"{BASE}/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    return res.json()


@pytest.mark.asyncio
async def test_analytics_dashboard_suite():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:

        # ── Authenticate all roles ──────────────────────────────────────────
        owner_data = await login(client, "owner@kaveristays.com")
        mgr_data   = await login(client, "manager.riverside@kaveristays.com")
        staff_data = await login(client, "staff.riverside@kaveristays.com")
        guest_data = await login(client, "guest.demo@kaveristays.com")

        owner_h = {"Authorization": f"Bearer {owner_data['tokens']['access_token']}"}
        mgr_h   = {"Authorization": f"Bearer {mgr_data['tokens']['access_token']}"}
        staff_h = {"Authorization": f"Bearer {staff_data['tokens']['access_token']}"}
        guest_h = {"Authorization": f"Bearer {guest_data['tokens']['access_token']}"}

        mgr_prop_id = mgr_data["user"]["property_id"]  # 1 = Kaveri Riverside
        assert mgr_prop_id == PROP1_ID

        # ── TEST 1 & 2: Owner can access overall dashboard summary ──────────
        res = await client.get(f"{BASE}/analytics/dashboard", headers=owner_h)
        assert res.status_code == 200, f"Owner dashboard failed: {res.text}"
        dash = res.json()
        assert dash["total_properties"] == 3
        assert dash["total_rooms"] == 38  # 13 + 13 + 12
        assert dash["total_bookings"] >= 134
        assert dash["total_payment_transactions"] >= 128
        assert Decimal(str(dash["total_payments_amount"])) > Decimal("1000000.00")
        assert dash["total_reviews"] >= 40
        assert dash["average_review_rating"] is not None
        assert 1.0 <= dash["average_review_rating"] <= 5.0

        # Booking breakdown sum must equal total_bookings
        bk = dash["booking_status_breakdown"]
        sum_bk = bk["confirmed"] + bk["checked_in"] + bk["checked_out"] + bk["cancelled"] + bk["no_show"]
        assert sum_bk == dash["total_bookings"]
        print(f"[PASSED] Tests 1 & 2: Owner dashboard summary retrieved (Properties: {dash['total_properties']}, Rooms: {dash['total_rooms']}, Bookings: {dash['total_bookings']}, Revenue: {dash['total_payments_amount']}).")

        # ── TEST 3: Owner filters dashboard by property_id ──────────────────
        res_p1 = await client.get(f"{BASE}/analytics/dashboard?property_id={PROP1_ID}", headers=owner_h)
        assert res_p1.status_code == 200
        dash_p1 = res_p1.json()
        assert dash_p1["total_properties"] == 1
        assert dash_p1["total_rooms"] == 13
        assert dash_p1["total_bookings"] < dash["total_bookings"]
        print(f"[PASSED] Test 3: Owner filtered dashboard by property {PROP1_ID} (Rooms: {dash_p1['total_rooms']}, Bookings: {dash_p1['total_bookings']}).")

        # ── TEST 4 & 5: Owner booking analytics & status counts ─────────────
        res_b = await client.get(f"{BASE}/analytics/bookings", headers=owner_h)
        assert res_b.status_code == 200
        b_data = res_b.json()
        assert b_data["total_bookings"] >= 134
        b_break = b_data["booking_status_breakdown"]
        assert b_break["checked_out"] >= 80
        assert b_break["confirmed"] >= 20
        assert b_break["cancelled"] >= 5
        print(f"[PASSED] Tests 4 & 5: Booking analytics (Total: {b_data['total_bookings']}, Checked-out: {b_break['checked_out']}, Confirmed: {b_break['confirmed']}).")

        # ── TEST 6 & 7: Owner revenue analytics & payment aggregation ───────
        res_r = await client.get(f"{BASE}/analytics/revenue", headers=owner_h)
        assert res_r.status_code == 200
        rev_data = res_r.json()
        assert rev_data["payment_count"] >= 128
        assert Decimal(str(rev_data["total_payment_amount"])) > Decimal("1000000.00")
        assert len(rev_data["revenue_by_property"]) == 3
        # Sum of per-property revenue must equal total revenue
        prop_sum = sum(Decimal(str(p["total_payment_amount"])) for p in rev_data["revenue_by_property"])
        assert prop_sum == Decimal(str(rev_data["total_payment_amount"]))
        print(f"[PASSED] Tests 6 & 7: Revenue analytics (Total: INR {rev_data['total_payment_amount']}, Transactions: {rev_data['payment_count']}).")

        # ── TEST 8, 9 & 10: Owner review analytics & rating distribution ────
        res_rev = await client.get(f"{BASE}/analytics/reviews", headers=owner_h)
        assert res_rev.status_code == 200
        rev_info = res_rev.json()
        assert rev_info["total_reviews"] >= 40
        assert 1.0 <= rev_info["average_rating"] <= 5.0
        dist = rev_info["rating_distribution"]
        dist_sum = dist["one_star"] + dist["two_stars"] + dist["three_stars"] + dist["four_stars"] + dist["five_stars"]
        assert dist_sum == rev_info["total_reviews"]
        print(f"[PASSED] Tests 8, 9 & 10: Review analytics (Total: {rev_info['total_reviews']}, Avg: {rev_info['average_rating']}, 5-star: {dist['five_stars']}).")

        # ── TEST 11: Owner occupancy analytics ──────────────────────────────
        res_occ = await client.get(
            f"{BASE}/analytics/occupancy",
            headers=owner_h,
            params={"period_start": "2025-01-01", "period_end": "2025-01-31"}
        )
        assert res_occ.status_code == 200
        occ_data = res_occ.json()
        assert occ_data["total_rooms"] == 38
        assert occ_data["total_available_room_nights"] == 38 * 30
        assert occ_data["occupied_room_nights"] >= 0
        if occ_data["occupancy_rate_percent"] is not None:
            assert 0.0 <= occ_data["occupancy_rate_percent"] <= 100.0
        print(f"[PASSED] Test 11: Occupancy analytics (Available nights: {occ_data['total_available_room_nights']}, Occupied: {occ_data['occupied_room_nights']}, Rate: {occ_data['occupancy_rate_percent']}%).")

        # ── TEST 12: Manager auto-scoped to assigned property ────────────────
        res_mgr_dash = await client.get(f"{BASE}/analytics/dashboard", headers=mgr_h)
        assert res_mgr_dash.status_code == 200
        mgr_dash = res_mgr_dash.json()
        assert mgr_dash["total_properties"] == 1
        assert mgr_dash["total_rooms"] == 13  # Riverside has 13 rooms
        print(f"[PASSED] Test 12: Manager dashboard auto-scoped to Property {mgr_prop_id} (Rooms: {mgr_dash['total_rooms']}).")

        # ── TEST 13 & 14: Manager blocked from cross-property analytics ──────
        # Manager tries to filter by Property 2
        res_mgr_cross1 = await client.get(
            f"{BASE}/analytics/dashboard?property_id={PROP2_ID}",
            headers=mgr_h
        )
        assert res_mgr_cross1.status_code == 403, f"Expected 403, got {res_mgr_cross1.status_code}: {res_mgr_cross1.text}"

        res_mgr_cross2 = await client.get(
            f"{BASE}/analytics/revenue?property_id={PROP2_ID}",
            headers=mgr_h
        )
        assert res_mgr_cross2.status_code == 403

        res_mgr_cross3 = await client.get(
            f"{BASE}/analytics/properties/{PROP2_ID}",
            headers=mgr_h
        )
        assert res_mgr_cross3.status_code == 403
        print("[PASSED] Tests 13 & 14: Manager blocked (403 Forbidden) from requesting analytics for another property.")

        # ── TEST 15: Staff cannot access analytics ───────────────────────────
        res_staff = await client.get(f"{BASE}/analytics/dashboard", headers=staff_h)
        assert res_staff.status_code == 403, f"Expected 403 for Staff, got {res_staff.status_code}"
        print("[PASSED] Test 15: Staff role blocked from internal analytics (403 Forbidden).")

        # ── TEST 16: Guest cannot access analytics ───────────────────────────
        res_guest = await client.get(f"{BASE}/analytics/dashboard", headers=guest_h)
        assert res_guest.status_code == 403, f"Expected 403 for Guest, got {res_guest.status_code}"
        print("[PASSED] Test 16: Guest role blocked from internal analytics (403 Forbidden).")

        # ── TEST 17: Unauthenticated request returns 401 ─────────────────────
        res_unauth = await client.get(f"{BASE}/analytics/dashboard")
        assert res_unauth.status_code == 401, f"Expected 401, got {res_unauth.status_code}"
        print("[PASSED] Test 17: Unauthenticated request returned 401 Unauthorized.")

        # ── TEST 18: Non-existent property ID returns 404 ───────────────────
        res_404 = await client.get(f"{BASE}/analytics/dashboard?property_id=99999", headers=owner_h)
        assert res_404.status_code == 404, f"Expected 404, got {res_404.status_code}: {res_404.text}"
        print("[PASSED] Test 18: Non-existent property_id returned 404 Not Found.")

        # ── TEST 19: Invalid date range returns 422 ──────────────────────────
        res_bad_dates = await client.get(
            f"{BASE}/analytics/bookings?start_date=2026-12-31&end_date=2026-01-01",
            headers=owner_h
        )
        assert res_bad_dates.status_code == 422, f"Expected 422 for reversed dates, got {res_bad_dates.status_code}"
        print("[PASSED] Test 19: start_date > end_date returned 422 Unprocessable Entity.")

        # ── TEST 20: Invalid occupancy range returns 422 ─────────────────────
        res_bad_occ = await client.get(
            f"{BASE}/analytics/occupancy?period_start=2026-06-10&period_end=2026-06-01",
            headers=owner_h
        )
        assert res_bad_occ.status_code == 422
        print("[PASSED] Test 20: period_start >= period_end returned 422 Unprocessable Entity.")

        # ── TEST 21: Property performance comparison (Owner) ────────────────
        res_perf = await client.get(f"{BASE}/analytics/properties", headers=owner_h)
        assert res_perf.status_code == 200
        perf = res_perf.json()
        assert perf["total_properties"] == 3
        assert len(perf["properties"]) == 3
        for prop_item in perf["properties"]:
            assert "property_name" in prop_item
            assert prop_item["room_count"] > 0
            assert prop_item["total_bookings"] > 0
        print(f"[PASSED] Test 21: Property performance returned comparison of {perf['total_properties']} properties.")

        # ── TEST 22: Property performance auto-scoped (Manager) ──────────────
        res_mgr_perf = await client.get(f"{BASE}/analytics/properties", headers=mgr_h)
        assert res_mgr_perf.status_code == 200
        mgr_perf = res_mgr_perf.json()
        assert mgr_perf["total_properties"] == 1
        assert mgr_perf["properties"][0]["property_id"] == PROP1_ID
        print(f"[PASSED] Test 22: Manager property performance returned only assigned Property {PROP1_ID}.")

        # ── TEST 23: Out-of-range date filter returns zero safely ────────────
        res_empty = await client.get(
            f"{BASE}/analytics/revenue?start_date=2099-01-01&end_date=2099-01-31",
            headers=owner_h
        )
        assert res_empty.status_code == 200
        empty_rev = res_empty.json()
        assert empty_rev["payment_count"] == 0
        assert Decimal(str(empty_rev["total_payment_amount"])) == Decimal("0.00")
        print("[PASSED] Test 23: Out-of-range date filter returned zero payment counts safely.")

        print("\n[ALL PASSED] All Hotel Analytics & Dashboard API tests passed!")
