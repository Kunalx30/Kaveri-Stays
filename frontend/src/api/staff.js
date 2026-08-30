/**
 * Staff Operations API Module — Kaveri Stays Frontend Phase F7
 *
 * Provides dedicated operational API functions for hotel staff:
 *   - Check-in:  PATCH /api/v1/bookings/:id { status: 'checked_in' }
 *   - Check-out: PATCH /api/v1/bookings/:id { status: 'checked_out' }
 *   - No-Show:   PATCH /api/v1/bookings/:id { status: 'no_show' }
 *   - List:      GET   /api/v1/bookings (scoped to staff property)
 *   - Details:   GET   /api/v1/bookings/:id
 */
import apiClient from './client';

/**
 * List bookings with operational filters.
 * Staff/Manager: automatically scoped to assigned property by backend.
 * Owner: can list across all properties or filter by property_id.
 *
 * @param {{ property_id?: number, guest_id?: number, room_id?: number, status?: string }} params
 * @returns {Promise<Array<BookingResponse>>}
 */
export const listStaffBookingsApi = async (params = {}) => {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v != null && v !== '')
  );
  const response = await apiClient.get('/bookings', { params: cleanParams });
  return response.data;
};

/**
 * Retrieve full booking details by ID.
 *
 * @param {number} bookingId
 * @returns {Promise<BookingResponse>}
 */
export const getStaffBookingByIdApi = async (bookingId) => {
  const response = await apiClient.get(`/bookings/${bookingId}`);
  return response.data;
};

/**
 * Perform Guest Check-in.
 * Valid transition: confirmed -> checked_in.
 *
 * @param {number} bookingId
 * @returns {Promise<BookingResponse>}
 */
export const checkInBookingApi = async (bookingId) => {
  const response = await apiClient.patch(`/bookings/${bookingId}`, {
    status: 'checked_in',
  });
  return response.data;
};

/**
 * Perform Guest Check-out.
 * Valid transition: checked_in -> checked_out.
 *
 * @param {number} bookingId
 * @returns {Promise<BookingResponse>}
 */
export const checkOutBookingApi = async (bookingId) => {
  const response = await apiClient.patch(`/bookings/${bookingId}`, {
    status: 'checked_out',
  });
  return response.data;
};

/**
 * Mark a confirmed booking as No-Show.
 * Valid transition: confirmed -> no_show.
 *
 * @param {number} bookingId
 * @returns {Promise<BookingResponse>}
 */
export const markNoShowApi = async (bookingId) => {
  const response = await apiClient.patch(`/bookings/${bookingId}`, {
    status: 'no_show',
  });
  return response.data;
};
