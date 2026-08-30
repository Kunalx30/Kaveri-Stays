/**
 * Booking API Module — Kaveri Stays Frontend Phase F4
 *
 * Based on the actual backend booking endpoints:
 *   GET    /api/v1/bookings              → listBookingsApi()
 *   POST   /api/v1/bookings              → createBookingApi()
 *   GET    /api/v1/bookings/:id          → getBookingByIdApi()
 *   PATCH  /api/v1/bookings/:id          → updateBookingApi()
 *   POST   /api/v1/bookings/:id/cancel   → cancelBookingApi()
 *
 * BookingCreate schema (POST /bookings):
 *   room_id         int        (required)
 *   check_in_date   string     (required, YYYY-MM-DD)
 *   check_out_date  string     (required, YYYY-MM-DD)
 *   guests_count    int        (required, 1..20)
 *   notes           string     (optional)
 *   guest_id        int        (optional for guest role — auto-inferred from JWT)
 *
 * BookingResponse schema:
 *   booking_id, guest_id, room_id, property_id, check_in_date, check_out_date,
 *   total_nights, guests_count, nightly_rate, total_amount, status, notes, created_at
 *
 * Booking statuses: confirmed | checked_in | checked_out | cancelled | no_show
 *
 * Auth: All endpoints require a valid JWT Bearer token (401 if missing).
 */
import apiClient from './client';

/**
 * Create a new booking.
 *
 * Guest role: guest_id is auto-inferred from JWT — do NOT send it.
 * Owner/Manager: guest_id is required.
 *
 * @param {{ room_id, check_in_date, check_out_date, guests_count, notes? }} payload
 * @returns {Promise<BookingResponse>}
 */
export const createBookingApi = async (payload) => {
  const response = await apiClient.post('/bookings', payload);
  return response.data;
};

/**
 * List bookings.
 *
 * Guest: returns only the authenticated guest's own bookings.
 * Manager/Staff: returns bookings for their assigned property only.
 * Owner: returns all bookings.
 *
 * @param {{ property_id?, guest_id?, room_id?, status? }} params  (optional filters)
 * @returns {Promise<BookingResponse[]>}
 */
export const listBookingsApi = async (params = {}) => {
  // Remove undefined/null values from params before sending
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v != null && v !== '')
  );
  const response = await apiClient.get('/bookings', { params: cleanParams });
  return response.data;
};

/**
 * Get a single booking by ID.
 *
 * Guest: 403 if the booking does not belong to the authenticated guest.
 * Manager/Staff: 403 if the booking is outside their assigned property.
 *
 * @param {number} bookingId
 * @returns {Promise<BookingResponse>}
 */
export const getBookingByIdApi = async (bookingId) => {
  const response = await apiClient.get(`/bookings/${bookingId}`);
  return response.data;
};

/**
 * Cancel an active booking.
 *
 * Endpoint: POST /bookings/:id/cancel
 * Valid from status: confirmed only (checked_in/checked_out cannot be cancelled).
 * Guest: can only cancel their own booking.
 *
 * @param {number} bookingId
 * @returns {Promise<BookingResponse>}  — booking with status === 'cancelled'
 */
export const cancelBookingApi = async (bookingId) => {
  const response = await apiClient.post(`/bookings/${bookingId}/cancel`);
  return response.data;
};

/**
 * Partially update a booking (notes, status, etc).
 * Guests can only set status to 'cancelled' via PATCH.
 * For cancellation from the frontend, prefer cancelBookingApi().
 *
 * @param {number} bookingId
 * @param {{ status?, notes?, check_in_date?, check_out_date?, guests_count?, room_id? }} data
 * @returns {Promise<BookingResponse>}
 */
export const updateBookingApi = async (bookingId, data) => {
  const response = await apiClient.patch(`/bookings/${bookingId}`, data);
  return response.data;
};
