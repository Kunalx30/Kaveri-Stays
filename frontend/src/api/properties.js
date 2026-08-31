import apiClient from './client';

/**
 * Properties API Module
 *
 * Public and management endpoints for properties and room types.
 */

export const getPropertiesApi = async (params = {}) => {
  const queryParams = typeof params === 'string' ? { city: params } : params;
  const cleanParams = Object.fromEntries(
    Object.entries(queryParams).filter(([, v]) => v != null && v !== '')
  );
  const response = await apiClient.get('/properties', { params: cleanParams });
  return response.data;
};

export const getPropertyByIdApi = async (propertyId) => {
  const response = await apiClient.get(`/properties/${propertyId}`);
  return response.data;
};

export const createPropertyApi = async (payload) => {
  const response = await apiClient.post('/properties', payload);
  return response.data;
};

export const updatePropertyApi = async (propertyId, payload) => {
  const response = await apiClient.patch(`/properties/${propertyId}`, payload);
  return response.data;
};

export const deletePropertyApi = async (propertyId) => {
  const response = await apiClient.delete(`/properties/${propertyId}`);
  return response.data;
};

export const getRoomTypesApi = async () => {
  const response = await apiClient.get('/room-types');
  return response.data;
};

export const getAvailabilityApi = async (params) => {
  const response = await apiClient.get('/availability', { params });
  return response.data;
};
