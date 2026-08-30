"""
Integration test suite for Properties Management API.
Tests all roles, CRUD operations, authorization restrictions, and validation rules.
"""
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_properties_management_suite():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test/api/v1") as client:
        # 1. Login as Owner
        owner_res = await client.post("/auth/login", json={
            "email": "owner@kaveristays.com",
            "password": "Password@123"
        })
        assert owner_res.status_code == 200, f"Owner login failed: {owner_res.text}"
        owner_token = owner_res.json()["tokens"]["access_token"]
        owner_headers = {"Authorization": f"Bearer {owner_token}"}

        # 2. Login as Coorg Manager (assigned to Property 1: Kaveri Riverside)
        coorg_mgr_res = await client.post("/auth/login", json={
            "email": "manager.riverside@kaveristays.com",
            "password": "Password@123"
        })
        assert coorg_mgr_res.status_code == 200, f"Manager login failed: {coorg_mgr_res.text}"
        coorg_mgr_token = coorg_mgr_res.json()["tokens"]["access_token"]
        coorg_mgr_headers = {"Authorization": f"Bearer {coorg_mgr_token}"}
        coorg_prop_id = coorg_mgr_res.json()["user"]["property_id"]
        assert coorg_prop_id == 1

        # 3. Login as Guest
        guest_res = await client.post("/auth/login", json={
            "email": "guest.demo@kaveristays.com",
            "password": "Password@123"
        })
        assert guest_res.status_code == 200, f"Guest login failed: {guest_res.text}"
        guest_token = guest_res.json()["tokens"]["access_token"]
        guest_headers = {"Authorization": f"Bearer {guest_token}"}
        
        # 4. Login as Staff (Coorg, assigned to Property 1)
        staff_res = await client.post("/auth/login", json={
            "email": "staff.riverside@kaveristays.com",
            "password": "Password@123"
        })
        assert staff_res.status_code == 200
        staff_token = staff_res.json()["tokens"]["access_token"]
        staff_headers = {"Authorization": f"Bearer {staff_token}"}

        # TEST 1a: Owner lists all properties
        res_list = await client.get("/properties", headers=owner_headers)
        assert res_list.status_code == 200
        props = res_list.json()
        assert len(props) >= 3
        print(f"[PASSED] Test 1a: Owner listed {len(props)} properties.")

        # TEST 1b: Manager lists properties -> receives ONLY their 1 assigned property
        res_mgr_list = await client.get("/properties", headers=coorg_mgr_headers)
        assert res_mgr_list.status_code == 200
        mgr_props = res_mgr_list.json()
        assert len(mgr_props) == 1
        assert mgr_props[0]["property_id"] == coorg_prop_id
        print(f"[PASSED] Test 1b: Manager strictly received only assigned property {coorg_prop_id}.")

        # TEST 1c: Staff lists properties -> receives ONLY their 1 assigned property
        res_staff_list = await client.get("/properties", headers=staff_headers)
        assert res_staff_list.status_code == 200
        staff_props = res_staff_list.json()
        assert len(staff_props) == 1
        assert staff_props[0]["property_id"] == coorg_prop_id
        print(f"[PASSED] Test 1c: Staff strictly received only assigned property {coorg_prop_id}.")

        # TEST 1d: Public/Guest lists properties -> receives all properties
        res_guest_list = await client.get("/properties", headers=guest_headers)
        assert res_guest_list.status_code == 200
        assert len(res_guest_list.json()) >= 3
        print(f"[PASSED] Test 1d: Guest successfully browsed all {len(res_guest_list.json())} public properties.")

        # TEST 2: Owner gets a single property by ID
        res_get = await client.get(f"/properties/{coorg_prop_id}", headers=owner_headers)
        assert res_get.status_code == 200
        assert res_get.json()["property_id"] == coorg_prop_id
        assert res_get.json()["name"] == "Kaveri Riverside"
        print(f"[PASSED] Test 2: Owner retrieved property ID {coorg_prop_id}.")

        # TEST 3: Owner creates a new property
        new_prop_data = {
            "name": "Kaveri Heritage Palace",
            "city": "Mysore",
            "star_rating": 5
        }
        res_create = await client.post("/properties", json=new_prop_data, headers=owner_headers)
        assert res_create.status_code == 201
        created_prop = res_create.json()
        created_prop_id = created_prop["property_id"]
        assert created_prop["name"] == "Kaveri Heritage Palace"
        assert created_prop["star_rating"] == 5
        print(f"[PASSED] Test 3: Owner created new property ID {created_prop_id}.")

        # Duplicate property name conflict (409)
        res_dup = await client.post("/properties", json=new_prop_data, headers=owner_headers)
        assert res_dup.status_code == 409
        print("[PASSED] Test 3b: Duplicate property name rejected with 409 Conflict.")

        # TEST 4: Owner updates a property
        update_data = {"city": "Historic Mysore", "star_rating": 5}
        res_update = await client.patch(f"/properties/{created_prop_id}", json=update_data, headers=owner_headers)
        assert res_update.status_code == 200
        assert res_update.json()["city"] == "Historic Mysore"
        print(f"[PASSED] Test 4: Owner updated property ID {created_prop_id}.")

        # TEST 5: Manager can access their assigned property
        res_mgr_own = await client.get(f"/properties/{coorg_prop_id}", headers=coorg_mgr_headers)
        assert res_mgr_own.status_code == 200
        assert res_mgr_own.json()["property_id"] == coorg_prop_id
        print(f"[PASSED] Test 5: Manager successfully accessed assigned property {coorg_prop_id}.")

        # Manager can update their assigned property
        res_mgr_update = await client.patch(f"/properties/{coorg_prop_id}", json={"star_rating": 4}, headers=coorg_mgr_headers)
        assert res_mgr_update.status_code == 200
        print(f"[PASSED] Test 5b: Manager successfully updated assigned property {coorg_prop_id}.")

        # TEST 6: Manager CANNOT access another property (Property ID 2 - Ooty)
        other_prop_id = 2
        res_mgr_other = await client.get(f"/properties/{other_prop_id}", headers=coorg_mgr_headers)
        assert res_mgr_other.status_code == 403, f"Expected 403, got {res_mgr_other.status_code}"
        assert "Access denied" in res_mgr_other.json()["detail"]
        print(f"[PASSED] Test 6: Manager forbidden (403) from accessing other property ID {other_prop_id}.")

        # Manager CANNOT update another property
        res_mgr_update_other = await client.patch(f"/properties/{other_prop_id}", json={"city": "Forbidden"}, headers=coorg_mgr_headers)
        assert res_mgr_update_other.status_code == 403
        print(f"[PASSED] Test 6b: Manager forbidden (403) from updating other property ID {other_prop_id}.")

        # TEST 7: Guest CANNOT create or manage properties
        res_guest_create = await client.post("/properties", json={
            "name": "Guest Hotel",
            "city": "Goa",
            "star_rating": 3
        }, headers=guest_headers)
        assert res_guest_create.status_code == 403
        print("[PASSED] Test 7a: Guest creation rejected with 403 Forbidden.")

        res_guest_update = await client.patch(f"/properties/{coorg_prop_id}", json={"city": "Hack"}, headers=guest_headers)
        assert res_guest_update.status_code == 403
        print("[PASSED] Test 7b: Guest update rejected with 403 Forbidden.")

        # TEST 8: Invalid property ID returns 404
        non_existent_id = 99999
        res_404 = await client.get(f"/properties/{non_existent_id}", headers=owner_headers)
        assert res_404.status_code == 404
        print(f"[PASSED] Test 8: Non-existent property ID {non_existent_id} returns 404 Not Found.")

        # TEST 9: Invalid request data returns validation error (422)
        invalid_rating = {
            "name": "Invalid Star Rating Resort",
            "city": "Bangalore",
            "star_rating": 7  # Must be between 1 and 5
        }
        res_invalid = await client.post("/properties", json=invalid_rating, headers=owner_headers)
        assert res_invalid.status_code == 422
        print("[PASSED] Test 9: Invalid star rating (7) returns 422 Unprocessable Entity.")

        # TEST 10: Unauthenticated request returns 401 on protected endpoints
        res_unauth = await client.post("/properties", json=new_prop_data)
        assert res_unauth.status_code == 401
        print("[PASSED] Test 10: Unauthenticated POST returns 401 Unauthorized.")

        # TEST 11: Safety on Delete
        # 11a: Attempting to delete a seeded property with existing rooms returns 409 Conflict
        res_del_conflict = await client.delete(f"/properties/{coorg_prop_id}", headers=owner_headers)
        assert res_del_conflict.status_code == 409
        print(f"[PASSED] Test 11a: Deleting property with rooms returned 409 Conflict.")

        # 11b: Deleting the newly created test property without rooms succeeds cleanly
        res_del_ok = await client.delete(f"/properties/{created_prop_id}", headers=owner_headers)
        assert res_del_ok.status_code == 200
        print(f"[PASSED] Test 11b: Safely deleted newly created property ID {created_prop_id}.")


if __name__ == "__main__":
    import asyncio
    asyncio.run(test_properties_management_suite())
