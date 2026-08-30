"""
Phase 5D: Rate Plans Management API — Integration Test Suite

Tests all 20 required scenarios:
  1. Owner lists all rate plans (200 OK)
  2. Manager property isolation (only assigned property returned)
  3. Staff property isolation (only assigned property returned)
  4. Owner gets single rate plan (200 OK)
  5. Manager cross-property access blocked (403 Forbidden)
  6. Owner creates rate plan with valid non-overlapping range (201 Created)
  7. Invalid property ID on create returns 404
  8. Invalid room type ID on create returns 404
  9. Invalid date range (valid_from >= valid_to) returns 422
  10. Invalid nightly rate (<= 0) returns 422
  11. Overlapping rate plan returns 409 Conflict
  12. Adjacent date range accepted (201 Created)
  13. Partial update on rate plan succeeds (200 OK)
  14. Update causing overlap returns 409 Conflict
  15. Manager updates rate plan in own property (200 OK)
  16. Manager cross-property update returns 403 Forbidden
  17. Guest management blocked (403 Forbidden)
  18. Invalid rate plan ID returns 404 Not Found
  19. Unauthenticated request returns 401 Unauthorized
  20. Safe delete of test rate plans and cleanup verification
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
async def test_rate_plans_management_suite():
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
        assert mgr_prop_id == 1

        # ── TEST 1: Owner lists rate plans ──────────────────────────────────
        res = await client.get(f"{BASE}/rate-plans", headers=owner_h)
        assert res.status_code == 200, f"Owner list rate plans failed: {res.text}"
        all_plans = res.json()
        assert len(all_plans) >= 10, f"Expected at least 10 seeded rate plans, got {len(all_plans)}"
        print(f"[PASSED] Test 1: Owner listed {len(all_plans)} rate plans.")

        # Filter by active_date
        res_date = await client.get(f"{BASE}/rate-plans?active_date=2025-06-15", headers=owner_h)
        assert res_date.status_code == 200
        assert len(res_date.json()) > 0
        print(f"[PASSED] Test 1b: Owner filtered active rate plans for 2025-06-15 ({len(res_date.json())} active).")

        # ── TEST 2: Manager property isolation ──────────────────────────────
        res = await client.get(f"{BASE}/rate-plans", headers=mgr_h)
        assert res.status_code == 200
        mgr_plans = res.json()
        assert all(p["property_id"] == mgr_prop_id for p in mgr_plans), \
            "Manager received rate plans for another property"
        assert len(mgr_plans) > 0
        print(f"[PASSED] Test 2: Manager received {len(mgr_plans)} rate plans, all for property {mgr_prop_id}.")

        # ── TEST 3: Staff property isolation ────────────────────────────────
        res = await client.get(f"{BASE}/rate-plans", headers=staff_h)
        assert res.status_code == 200
        staff_plans = res.json()
        assert all(p["property_id"] == mgr_prop_id for p in staff_plans)
        print(f"[PASSED] Test 3: Staff received {len(staff_plans)} rate plans, all for assigned property {mgr_prop_id}.")

        # ── TEST 4: Owner gets single rate plan ──────────────────────────────
        first_plan_id = all_plans[0]["rate_plan_id"]
        res = await client.get(f"{BASE}/rate-plans/{first_plan_id}", headers=owner_h)
        assert res.status_code == 200
        plan_data = res.json()
        assert plan_data["rate_plan_id"] == first_plan_id
        assert "valid_from" in plan_data
        assert "valid_to" in plan_data
        assert "nightly_rate" in plan_data
        print(f"[PASSED] Test 4: Owner retrieved rate plan ID {first_plan_id}.")

        # ── TEST 5: Manager cross-property access blocked ───────────────────
        # Find a rate plan from property 2
        other_prop_plan = next(p for p in all_plans if p["property_id"] != mgr_prop_id)
        other_plan_id = other_prop_plan["rate_plan_id"]

        res = await client.get(f"{BASE}/rate-plans/{other_plan_id}", headers=mgr_h)
        assert res.status_code == 403, f"Expected 403 for cross-property access, got {res.status_code}"
        assert "Access denied" in res.json()["detail"]
        print(f"[PASSED] Test 5: Manager blocked (403) from accessing rate plan ID {other_plan_id} (property {other_prop_plan['property_id']}).")

        # ── TEST 6: Owner creates rate plan ─────────────────────────────────
        # Create a future 2027 season rate plan (guaranteed no overlap with 2025/2026 seeds)
        new_plan_payload = {
            "property_id": mgr_prop_id,
            "room_type_id": 1,
            "season_name": "Summer Special 2027",
            "valid_from": "2027-04-01",
            "valid_to": "2027-06-30",
            "nightly_rate": 4500.00
        }
        res = await client.post(f"{BASE}/rate-plans", headers=owner_h, json=new_plan_payload)
        assert res.status_code == 201, f"Owner create rate plan failed: {res.text}"
        created_plan = res.json()
        new_plan_id = created_plan["rate_plan_id"]
        assert created_plan["season_name"] == "Summer Special 2027"
        assert created_plan["valid_from"] == "2027-04-01"
        assert created_plan["valid_to"] == "2027-06-30"
        print(f"[PASSED] Test 6: Owner created rate plan ID {new_plan_id} ('Summer Special 2027').")

        # ── TEST 6b: Manager creates rate plan for own property (201 Created) ───
        mgr_plan_payload = {
            "property_id": mgr_prop_id,
            "room_type_id": 2,  # Deluxe room type
            "season_name": "Manager Deluxe Promo 2027",
            "valid_from": "2027-01-10",
            "valid_to": "2027-02-28",
            "nightly_rate": 5200.00
        }
        res_mgr_create = await client.post(f"{BASE}/rate-plans", headers=mgr_h, json=mgr_plan_payload)
        assert res_mgr_create.status_code == 201, f"Manager create failed: {res_mgr_create.text}"
        mgr_created_plan_id = res_mgr_create.json()["rate_plan_id"]
        print(f"[PASSED] Test 6b: Manager successfully created rate plan ID {mgr_created_plan_id} in assigned property.")

        # ── TEST 6c: Manager blocked from creating rate plan in another property (403) ───
        res_mgr_cross_create = await client.post(
            f"{BASE}/rate-plans",
            headers=mgr_h,
            json={**mgr_plan_payload, "property_id": 2}
        )
        assert res_mgr_cross_create.status_code == 403, f"Expected 403 for manager cross create, got {res_mgr_cross_create.status_code}"
        print("[PASSED] Test 6c: Manager blocked (403) from creating rate plan for another property.")

        # ── TEST 7: Invalid property ID on create returns 404 ───────────────
        res = await client.post(
            f"{BASE}/rate-plans",
            headers=owner_h,
            json={**new_plan_payload, "property_id": 99999}
        )
        assert res.status_code == 404, f"Expected 404 for invalid property, got {res.status_code}"
        print("[PASSED] Test 7: Non-existent property_id=99999 returns 404 Not Found.")

        # ── TEST 8: Invalid room type ID on create returns 404 ──────────────
        res = await client.post(
            f"{BASE}/rate-plans",
            headers=owner_h,
            json={**new_plan_payload, "room_type_id": 99999}
        )
        assert res.status_code == 404, f"Expected 404 for invalid room type, got {res.status_code}"
        print("[PASSED] Test 8: Non-existent room_type_id=99999 returns 404 Not Found.")

        # ── TEST 9: Invalid date range (valid_from >= valid_to) returns 422 ──
        res = await client.post(
            f"{BASE}/rate-plans",
            headers=owner_h,
            json={
                **new_plan_payload,
                "valid_from": "2027-06-30",
                "valid_to": "2027-04-01"  # inverted range
            }
        )
        assert res.status_code == 422, f"Expected 422 for inverted date range, got {res.status_code}"
        print("[PASSED] Test 9a: Inverted date range (valid_from > valid_to) returns 422.")

        res = await client.post(
            f"{BASE}/rate-plans",
            headers=owner_h,
            json={
                **new_plan_payload,
                "valid_from": "2027-05-01",
                "valid_to": "2027-05-01"  # zero-length range
            }
        )
        assert res.status_code == 422, f"Expected 422 for equal dates, got {res.status_code}"
        print("[PASSED] Test 9b: Zero-length date range (valid_from == valid_to) returns 422.")

        # ── TEST 10: Invalid nightly rate (<= 0) returns 422 ────────────────
        res = await client.post(
            f"{BASE}/rate-plans",
            headers=owner_h,
            json={**new_plan_payload, "nightly_rate": 0}
        )
        assert res.status_code == 422, f"Expected 422 for rate=0, got {res.status_code}"
        print("[PASSED] Test 10a: Zero nightly rate returns 422 Unprocessable Entity.")

        res = await client.post(
            f"{BASE}/rate-plans",
            headers=owner_h,
            json={**new_plan_payload, "nightly_rate": -100.50}
        )
        assert res.status_code == 422, f"Expected 422 for negative rate, got {res.status_code}"
        print("[PASSED] Test 10b: Negative nightly rate returns 422 Unprocessable Entity.")

        # ── TEST 11: Overlapping rate plan returns 409 Conflict ─────────────
        # Try creating another rate plan overlapping [2027-04-01, 2027-06-30) on property 1, room_type 1
        res = await client.post(
            f"{BASE}/rate-plans",
            headers=owner_h,
            json={
                "property_id": mgr_prop_id,
                "room_type_id": 1,
                "season_name": "Overlapping Promo",
                "valid_from": "2027-05-01",
                "valid_to": "2027-08-01",
                "nightly_rate": 3999.00
            }
        )
        assert res.status_code == 409, f"Expected 409 for overlapping rate plan, got {res.status_code}: {res.text}"
        assert "conflict" in res.json()["detail"].lower() or "overlap" in res.json()["detail"].lower()
        print("[PASSED] Test 11: Overlapping date range returned 409 Conflict.")

        # ── TEST 12: Adjacent date range accepted (201 Created) ──────────────
        # Create rate plan immediately adjacent to [2027-04-01, 2027-06-30) -> [2027-06-30, 2027-09-30)
        adj_payload = {
            "property_id": mgr_prop_id,
            "room_type_id": 1,
            "season_name": "Monsoon 2027",
            "valid_from": "2027-06-30",
            "valid_to": "2027-09-30",
            "nightly_rate": 3200.00
        }
        res = await client.post(f"{BASE}/rate-plans", headers=owner_h, json=adj_payload)
        assert res.status_code == 201, f"Expected 201 for adjacent date range, got {res.status_code}: {res.text}"
        adj_plan_id = res.json()["rate_plan_id"]
        print(f"[PASSED] Test 12: Adjacent date range [2027-06-30, 2027-09-30) accepted as ID {adj_plan_id}.")

        # ── TEST 13: Partial update on rate plan ────────────────────────────
        res = await client.patch(
            f"{BASE}/rate-plans/{new_plan_id}",
            headers=owner_h,
            json={"season_name": "Super Summer 2027", "nightly_rate": 4900.00}
        )
        assert res.status_code == 200, f"Owner update failed: {res.text}"
        updated = res.json()
        assert updated["season_name"] == "Super Summer 2027"
        assert float(updated["nightly_rate"]) == 4900.00
        print(f"[PASSED] Test 13: Owner updated rate plan ID {new_plan_id}.")

        # ── TEST 14: Update causing overlap returns 409 Conflict ────────────
        # Attempt to expand Monsoon [2027-06-30, 2027-09-30) back to 2027-05-01 (overlaps Summer)
        res = await client.patch(
            f"{BASE}/rate-plans/{adj_plan_id}",
            headers=owner_h,
            json={"valid_from": "2027-05-01"}
        )
        assert res.status_code == 409, f"Expected 409 for update causing overlap, got {res.status_code}: {res.text}"
        print("[PASSED] Test 14: Update causing overlap returned 409 Conflict.")

        # ── TEST 15: Manager updates rate plan in own property ───────────────
        res = await client.patch(
            f"{BASE}/rate-plans/{new_plan_id}",
            headers=mgr_h,
            json={"nightly_rate": 4800.00}
        )
        assert res.status_code == 200, f"Manager update in own property failed: {res.text}"
        assert float(res.json()["nightly_rate"]) == 4800.00
        print(f"[PASSED] Test 15: Manager successfully updated own property's rate plan {new_plan_id}.")

        # ── TEST 16: Manager cross-property update returns 403 Forbidden ─────
        res = await client.patch(
            f"{BASE}/rate-plans/{other_plan_id}",
            headers=mgr_h,
            json={"nightly_rate": 9999.00}
        )
        assert res.status_code == 403, f"Expected 403 for cross-property update, got {res.status_code}"
        print(f"[PASSED] Test 16: Manager blocked (403) from updating rate plan ID {other_plan_id} in another property.")

        # ── TEST 17: Guest management blocked (403 Forbidden) ───────────────
        res = await client.get(f"{BASE}/rate-plans", headers=guest_h)
        assert res.status_code == 403
        print("[PASSED] Test 17a: Guest blocked (403) from listing rate plans.")

        res = await client.post(f"{BASE}/rate-plans", headers=guest_h, json=new_plan_payload)
        assert res.status_code == 403
        print("[PASSED] Test 17b: Guest blocked (403) from creating rate plans.")

        res = await client.patch(f"{BASE}/rate-plans/{new_plan_id}", headers=guest_h, json={"nightly_rate": 1000.00})
        assert res.status_code == 403
        print("[PASSED] Test 17c: Guest blocked (403) from updating rate plans.")

        res = await client.delete(f"{BASE}/rate-plans/{new_plan_id}", headers=guest_h)
        assert res.status_code == 403
        print("[PASSED] Test 17d: Guest blocked (403) from deleting rate plans.")

        # ── TEST 18: Invalid rate plan ID returns 404 ─────────────────────────
        res = await client.get(f"{BASE}/rate-plans/99999", headers=owner_h)
        assert res.status_code == 404
        print("[PASSED] Test 18: Non-existent rate plan ID 99999 returns 404 Not Found.")

        # ── TEST 19: Unauthenticated request returns 401 ─────────────────────
        res = await client.get(f"{BASE}/rate-plans")
        assert res.status_code == 401
        print("[PASSED] Test 19: Unauthenticated GET /rate-plans returns 401 Unauthorized.")

        # ── TEST 20: Safe delete of test rate plans and cleanup ──────────────
        res = await client.delete(f"{BASE}/rate-plans/{new_plan_id}", headers=owner_h)
        assert res.status_code == 200
        assert str(new_plan_id) in res.json()["message"]
        print(f"[PASSED] Test 20a: Safely deleted test rate plan ID {new_plan_id}.")

        # Confirm 404
        res = await client.get(f"{BASE}/rate-plans/{new_plan_id}", headers=owner_h)
        assert res.status_code == 404
        print(f"[PASSED] Test 20b: Rate plan ID {new_plan_id} now returns 404.")

        # Clean up adjacent rate plan
        res = await client.delete(f"{BASE}/rate-plans/{adj_plan_id}", headers=owner_h)
        assert res.status_code == 200
        print(f"[PASSED] Test 20c: Cleaned up adjacent rate plan ID {adj_plan_id}.")

        # Clean up manager created rate plan
        res = await client.delete(f"{BASE}/rate-plans/{mgr_created_plan_id}", headers=owner_h)
        assert res.status_code == 200
        print(f"[PASSED] Test 20d: Cleaned up manager created rate plan ID {mgr_created_plan_id}.")

        print("\n[ALL PASSED] All Rate Plans Management API tests passed!")
