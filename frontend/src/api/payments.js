/**
 * Payments API Module — Kaveri Stays Frontend Phase F5
 *
 * Matches the actual backend payment endpoints:
 *   GET    /api/v1/payments                             → listPaymentsApi()
 *   GET    /api/v1/payments/:id                         → getPaymentByIdApi()
 *   GET    /api/v1/payments/booking/:bookingId/summary  → getBookingPaymentSummaryApi()
 *   POST   /api/v1/payments                             → createPaymentApi()
 *
 * Schemas:
 *   PaymentCreate: { booking_id: int, amount: Decimal, method: 'card'|'upi'|'bank_transfer'|'cash', idempotency_key?: str }
 *   PaymentResponse: { payment_id, booking_id, amount, method, paid_at, property_id, guest_id }
 *   PaymentSummaryResponse: { booking_id, total_booking_amount, total_paid, remaining_balance, is_fully_paid, payments }
 */
import apiClient from './client';

/**
 * List payments with role-based and property/guest isolation.
 *
 * @param {{ booking_id?: number, property_id?: number, guest_id?: number }} params
 * @returns {Promise<Array<PaymentResponse>>}
 */
export const listPaymentsApi = async (params = {}) => {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v != null && v !== '')
  );
  const response = await apiClient.get('/payments', { params: cleanParams });
  return response.data;
};

/**
 * Get payment breakdown, total paid, and remaining balance for a booking.
 *
 * @param {number} bookingId
 * @returns {Promise<PaymentSummaryResponse>}
 */
export const getBookingPaymentSummaryApi = async (bookingId) => {
  const response = await apiClient.get(`/payments/booking/${bookingId}/summary`);
  return response.data;
};

/**
 * Get a single payment transaction record by ID.
 *
 * @param {number} paymentId
 * @returns {Promise<PaymentResponse>}
 */
export const getPaymentByIdApi = async (paymentId) => {
  const response = await apiClient.get(`/payments/${paymentId}`);
  return response.data;
};

/**
 * Create/record a payment for a booking with idempotency support.
 *
 * @param {{
 *   booking_id: number,
 *   amount: number | string,
 *   method: 'card' | 'upi' | 'bank_transfer' | 'cash',
 *   idempotency_key?: string
 * }} payload
 * @returns {Promise<PaymentResponse>}
 */
export const createPaymentApi = async (payload) => {
  const headers = {};
  if (payload.idempotency_key) {
    headers['Idempotency-Key'] = payload.idempotency_key;
  }
  const response = await apiClient.post('/payments', payload, { headers });
  return response.data;
};
