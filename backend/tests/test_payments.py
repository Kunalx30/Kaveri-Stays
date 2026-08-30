"""
Phase 5F: Payments Management API — Integration Test Suite

Tests all required scenarios:
  1. Owner lists all payments (200 OK)
  2. Owner gets single payment by ID (200 OK)
  3. Owner creates a valid payment (201 Created)
  4. Payment is linked to the correct booking
  5. Positive amount validation (amount <= 0 returns 422)
  6. Overpayment beyond remaining balance rejected (400 Bad Request)
  7. Payment on fully paid booking rejected (400 Bad Request)
  8. Invalid payment method rejected (422 Unprocessable Entity)
  9. Non-existent booking returns 404 Not Found
  10. Non-existent payment returns 404 Not Found
  11. Manager accesses payment from assigned property (200 OK)
  12. Manager blocked from other property's payment (403 Forbidden)
  13. Guest accesses payment for own booking (200 OK)
  14. Guest blocked from another guest's payment (403 Forbidden)
  15. Unauthenticated request returns 401 Unauthorized
  16. Idempotency key prevents duplicate payment creation
  17. Repeating same idempotent request returns same payment record safely
  18. Conflicting reuse of idempotency key returns 409 Conflict
  19. Guest makes payment for own booking (201 Created)
  20. Guest blocked from paying for another guest's booking (403 Forbidden)
  21. Payment on cancelled booking rejected (400 Bad Request)
  22. Payment summary endpoint calculation verified
"""
import uuid
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

BASE = "/api/v1"


async def login(client: AsyncClient, email: str, password: str = "Password@123") -> dict:
    res = await client.post(f"{BASE}/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    return res.json()


@pytest.mark.asyncio
async def test_payments_management_suite():
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

        # ── TEST 1: Owner lists all payments ────────────────────────────────
        res = await client.get(f"{BASE}/payments", headers=owner_h)
        assert res.status_code == 200, f"Owner list payments failed: {res.text}"
        all_payments = res.json()
        assert len(all_payments) >= 10, f"Expected seeded payments, got {len(all_payments)}"
        print(f"[PASSED] Test 1: Owner listed {len(all_payments)} payments.")

        # ── TEST 2: Owner gets single payment by ID ─────────────────────────
        first_payment_id = all_payments[0]["payment_id"]
        res = await client.get(f"{BASE}/payments/{first_payment_id}", headers=owner_h)
        assert res.status_code == 200
        p_data = res.json()
        assert p_data["payment_id"] == first_payment_id
        assert "amount" in p_data
        assert "method" in p_data
        assert "paid_at" in p_data
        print(f"[PASSED] Test 2: Owner retrieved payment #{first_payment_id}.")

        # ── Setup: Create a new fresh booking for testing payments ──────────
        # Find room in Property 1
        res_rooms = await client.get(f"{BASE}/rooms?property_id=1", headers=owner_h)
        room_1_id = res_rooms.json()[0]["room_id"]

        booking_payload = {
            "room_id": room_1_id,
            "guest_id": guest_id,
            "check_in_date": "2029-01-10",
            "check_out_date": "2029-01-15",
            "guests_count": 2,
            "notes": "Payment test booking"
        }
        res_booking = await client.post(f"{BASE}/bookings", headers=owner_h, json=booking_payload)
        assert res_booking.status_code == 201
        test_booking = res_booking.json()
        test_booking_id = test_booking["booking_id"]
        total_due = float(test_booking["total_amount"])
        assert total_due > 0
        print(f"[SETUP] Created fresh booking #{test_booking_id} with total due INR {total_due:.2f}.")

        # ── TEST 3 & 4: Owner creates a valid partial payment ────────────────
        partial_amount = round(total_due / 2, 2)
        idemp_key_1 = str(uuid.uuid4())
        pay_payload = {
            "booking_id": test_booking_id,
            "amount": partial_amount,
            "method": "upi",
            "idempotency_key": idemp_key_1
        }
        res_pay = await client.post(f"{BASE}/payments", headers=owner_h, json=pay_payload)
        assert res_pay.status_code == 201, f"Create payment failed: {res_pay.text}"
        created_payment = res_pay.json()
        pay_1_id = created_payment["payment_id"]
        assert created_payment["booking_id"] == test_booking_id
        assert float(created_payment["amount"]) == partial_amount
        assert created_payment["method"] == "upi"
        print(f"[PASSED] Test 3 & 4: Owner created payment #{pay_1_id} for booking #{test_booking_id} (Amount: INR {partial_amount}).")

        # ── TEST 5: Positive amount validation ──────────────────────────────
        res_zero = await client.post(
            f"{BASE}/payments",
            headers=owner_h,
            json={"booking_id": test_booking_id, "amount": 0, "method": "card"}
        )
        assert res_zero.status_code == 422
        print("[PASSED] Test 5a: Zero payment amount rejected with 422.")

        res_neg = await client.post(
            f"{BASE}/payments",
            headers=owner_h,
            json={"booking_id": test_booking_id, "amount": -50.00, "method": "card"}
        )
        assert res_neg.status_code == 422
        print("[PASSED] Test 5b: Negative payment amount rejected with 422.")

        # ── TEST 6: Overpayment beyond remaining balance rejected ───────────
        excess_amount = round(total_due + 1000.00, 2)
        res_overpay = await client.post(
            f"{BASE}/payments",
            headers=owner_h,
            json={"booking_id": test_booking_id, "amount": excess_amount, "method": "card"}
        )
        assert res_overpay.status_code == 400, f"Expected 400 for overpayment, got {res_overpay.status_code}"
        assert "exceeds" in res_overpay.json()["detail"].lower()
        print("[PASSED] Test 6: Overpayment exceeding remaining balance rejected with 400 Bad Request.")

        # ── TEST 7: Invalid payment method rejected ─────────────────────────
        res_bad_method = await client.post(
            f"{BASE}/payments",
            headers=owner_h,
            json={"booking_id": test_booking_id, "amount": 100.00, "method": "bitcoin"}
        )
        assert res_bad_method.status_code == 422
        print("[PASSED] Test 7: Unsupported payment method ('bitcoin') rejected with 422.")

        # ── TEST 8: Non-existent booking returns 404 ────────────────────────
        res_b_404 = await client.post(
            f"{BASE}/payments",
            headers=owner_h,
            json={"booking_id": 999999, "amount": 100.00, "method": "card"}
        )
        assert res_b_404.status_code == 404
        print("[PASSED] Test 8: Non-existent booking ID 999999 returns 404 Not Found.")

        # ── TEST 9: Non-existent payment returns 404 ────────────────────────
        res_p_404 = await client.get(f"{BASE}/payments/999999", headers=owner_h)
        assert res_p_404.status_code == 404
        print("[PASSED] Test 9: Non-existent payment ID 999999 returns 404 Not Found.")

        # ── TEST 10: Manager accesses payment from assigned property ────────
        res_mgr_pay = await client.get(f"{BASE}/payments/{pay_1_id}", headers=mgr_h)
        assert res_mgr_pay.status_code == 200
        assert res_mgr_pay.json()["property_id"] == mgr_prop_id
        print(f"[PASSED] Test 10: Manager retrieved payment #{pay_1_id} for assigned property.")

        # ── TEST 11: Manager blocked from other property's payment ──────────
        other_prop_payment = next(p for p in all_payments if p["property_id"] != mgr_prop_id)
        other_pay_id = other_prop_payment["payment_id"]

        res_mgr_x = await client.get(f"{BASE}/payments/{other_pay_id}", headers=mgr_h)
        assert res_mgr_x.status_code == 403
        print(f"[PASSED] Test 11: Manager blocked (403) from accessing other property's payment #{other_pay_id}.")

        # ── TEST 12: Guest accesses payment for own booking ─────────────────
        res_g_pay = await client.get(f"{BASE}/payments/{pay_1_id}", headers=guest_h)
        assert res_g_pay.status_code == 200
        print(f"[PASSED] Test 12: Guest retrieved payment #{pay_1_id} for their own booking.")

        # ── TEST 13: Guest blocked from another guest's payment ─────────────
        other_guest_payment = next(p for p in all_payments if p["guest_id"] != guest_id)
        other_g_pay_id = other_guest_payment["payment_id"]

        res_g_x = await client.get(f"{BASE}/payments/{other_g_pay_id}", headers=guest_h)
        assert res_g_x.status_code == 403
        print(f"[PASSED] Test 13: Guest blocked (403) from accessing another guest's payment #{other_g_pay_id}.")

        # ── TEST 14: Unauthenticated request returns 401 ─────────────────────
        res_unauth = await client.get(f"{BASE}/payments")
        assert res_unauth.status_code == 401
        print("[PASSED] Test 14: Unauthenticated GET /payments returns 401 Unauthorized.")

        # ── TEST 15 & 16 & 17: Idempotency Verification ─────────────────────
        # Repeat the EXACT request with idemp_key_1
        res_idemp_repeat = await client.post(
            f"{BASE}/payments",
            headers=owner_h,
            json=pay_payload
        )
        assert res_idemp_repeat.status_code == 200 or res_idemp_repeat.status_code == 201
        assert res_idemp_repeat.json()["payment_id"] == pay_1_id, \
            "Idempotent replay created a new duplicate payment instead of returning original payment!"
        print(f"[PASSED] Test 15 & 16: Idempotent replay safely returned original payment #{pay_1_id} without duplicate charge.")

        # Test conflicting reuse of idemp_key_1 with DIFFERENT amount
        res_idemp_conflict = await client.post(
            f"{BASE}/payments",
            headers=owner_h,
            json={**pay_payload, "amount": 999.00}
        )
        assert res_idemp_conflict.status_code == 409, f"Expected 409 for conflicting idempotency reuse, got {res_idemp_conflict.status_code}"
        assert "conflict" in res_idemp_conflict.json()["detail"].lower() or "idempotency" in res_idemp_conflict.json()["detail"].lower()
        print("[PASSED] Test 17: Conflicting reuse of idempotency key rejected with 409 Conflict.")

        # ── TEST 18: Payment Summary Endpoint & Remaining Balance ────────────
        res_summary = await client.get(f"{BASE}/payments/booking/{test_booking_id}/summary", headers=owner_h)
        assert res_summary.status_code == 200
        summary = res_summary.json()
        assert float(summary["total_booking_amount"]) == total_due
        assert float(summary["total_paid"]) == partial_amount
        expected_remaining = round(total_due - partial_amount, 2)
        assert float(summary["remaining_balance"]) == expected_remaining
        assert summary["is_fully_paid"] is False
        assert len(summary["payments"]) == 1
        print(f"[PASSED] Test 18: Summary endpoint verified: Total INR {total_due}, Paid INR {partial_amount}, Remaining INR {expected_remaining}.")

        # ── TEST 19: Guest creates payment for own booking (completing balance)
        guest_pay_idemp = str(uuid.uuid4())
        res_g_pay_create = await client.post(
            f"{BASE}/payments",
            headers=guest_h,
            json={
                "booking_id": test_booking_id,
                "amount": expected_remaining,
                "method": "card",
                "idempotency_key": guest_pay_idemp
            }
        )
        assert res_g_pay_create.status_code == 201, f"Guest payment failed: {res_g_pay_create.text}"
        pay_2_id = res_g_pay_create.json()["payment_id"]
        print(f"[PASSED] Test 19: Guest made final payment #{pay_2_id} of INR {expected_remaining} for own booking.")

        # Verify booking is now fully paid
        res_summary_2 = await client.get(f"{BASE}/payments/booking/{test_booking_id}/summary", headers=guest_h)
        assert res_summary_2.status_code == 200
        assert res_summary_2.json()["is_fully_paid"] is True
        assert float(res_summary_2.json()["remaining_balance"]) == 0.00
        print("[PASSED] Test 19b: Booking is now verified as 100% fully paid.")

        # ── TEST 20: Payment on fully paid booking rejected ──────────────────
        res_paid_reject = await client.post(
            f"{BASE}/payments",
            headers=owner_h,
            json={"booking_id": test_booking_id, "amount": 100.00, "method": "cash"}
        )
        assert res_paid_reject.status_code == 400
        assert "fully paid" in res_paid_reject.json()["detail"].lower()
        print("[PASSED] Test 20: Further payment attempt on fully paid booking rejected with 400 Bad Request.")

        # ── TEST 21: Guest blocked from paying for another guest's booking ───
        res_g_pay_other = await client.post(
            f"{BASE}/payments",
            headers=guest_h,
            json={"booking_id": other_guest_payment["booking_id"], "amount": 50.00, "method": "upi"}
        )
        assert res_g_pay_other.status_code == 403
        print(f"[PASSED] Test 21: Guest blocked (403) from creating payment for another guest's booking #{other_guest_payment['booking_id']}.")

        # ── TEST 22: Payment on cancelled booking rejected ──────────────────
        # Create a test booking and cancel it
        cancel_b_payload = {
            "room_id": room_1_id,
            "guest_id": guest_id,
            "check_in_date": "2029-02-01",
            "check_out_date": "2029-02-05",
            "guests_count": 1
        }
        res_cb = await client.post(f"{BASE}/bookings", headers=owner_h, json=cancel_b_payload)
        cb_id = res_cb.json()["booking_id"]
        await client.post(f"{BASE}/bookings/{cb_id}/cancel", headers=owner_h)

        res_pay_cancel = await client.post(
            f"{BASE}/payments",
            headers=owner_h,
            json={"booking_id": cb_id, "amount": 500.00, "method": "card"}
        )
        assert res_pay_cancel.status_code == 400
        assert "cancelled" in res_pay_cancel.json()["detail"].lower()
        print(f"[PASSED] Test 22: Payment on cancelled booking #{cb_id} rejected with 400 Bad Request.")

        # Clean up cancelled test booking & test booking with payments
        from app.database import SessionLocal
        from app.models.booking import Booking, Payment
        from app.models.auth import PaymentIdempotency

        db_cleanup = SessionLocal()
        for b_id in [test_booking_id, cb_id]:
            db_cleanup.query(PaymentIdempotency).filter(PaymentIdempotency.booking_id == b_id).delete()
            db_cleanup.query(Payment).filter(Payment.booking_id == b_id).delete()
            db_cleanup.query(Booking).filter(Booking.booking_id == b_id).delete()
        db_cleanup.commit()
        db_cleanup.close()

        print("\n[ALL PASSED] All Payments Management API tests passed!")
