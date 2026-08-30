import apiClient from './client';

/**
 * Room Availability & Search API Module
 * Interacts with FastAPI backend endpoints:
 *   - GET /availability
 *   - GET /availability/property/{property_id}
 */

export const searchAvailabilityApi = async ({ check_in, check_out, guests_count, property_id, room_type_id }) => {
  const params = {
    check_in,
    check_out,
    guests_count: Number(guests_count),
  };

  if (property_id) params.property_id = Number(property_id);
  if (room_type_id) params.room_type_id = Number(room_type_id);

  const response = await apiClient.get('/availability', { params });
  return response.data;
};

export const searchPropertyAvailabilityApi = async (propertyId, { check_in, check_out, guests_count, room_type_id }) => {
  const params = {
    check_in,
    check_out,
    guests_count: Number(guests_count),
  };

  if (room_type_id) params.room_type_id = Number(room_type_id);

  const response = await apiClient.get(`/availability/property/${propertyId}`, { params });
  return response.data;
};
