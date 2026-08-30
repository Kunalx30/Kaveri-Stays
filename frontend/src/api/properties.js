import apiClient from './client';

/**
 * Properties & Room Types API Module
 * Interacts with FastAPI backend endpoints:
 *   - GET /properties
 *   - GET /properties/{property_id}
 *   - GET /room-types
 *   - GET /room-types/{room_type_id}
 */

export const getPropertiesApi = async (city = null) => {
  const params = {};
  if (city) params.city = city;
  const response = await apiClient.get('/properties', { params });
  return response.data;
};

export const getPropertyByIdApi = async (propertyId) => {
  const response = await apiClient.get(`/properties/${propertyId}`);
  return response.data;
};

export const getRoomTypesApi = async () => {
  const response = await apiClient.get('/room-types');
  return response.data;
};

export const getRoomTypeByIdApi = async (roomTypeId) => {
  const response = await apiClient.get(`/room-types/${roomTypeId}`);
  return response.data;
};
