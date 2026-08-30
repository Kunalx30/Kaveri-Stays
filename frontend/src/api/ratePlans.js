import apiClient from './client';

/**
 * Rate Plans API Module
 *
 * Scoped according to role:
 * - Owner: can list, create, update, delete across properties.
 * - Manager: scoped to assigned property.
 */

export const listRatePlansApi = async (params = {}) => {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v != null && v !== '')
  );
  const response = await apiClient.get('/rate-plans', { params: cleanParams });
  return response.data;
};

export const getRatePlanByIdApi = async (ratePlanId) => {
  const response = await apiClient.get(`/rate-plans/${ratePlanId}`);
  return response.data;
};

export const createRatePlanApi = async (payload) => {
  const response = await apiClient.post('/rate-plans', payload);
  return response.data;
};

export const updateRatePlanApi = async (ratePlanId, payload) => {
  const response = await apiClient.patch(`/rate-plans/${ratePlanId}`, payload);
  return response.data;
};

export const deleteRatePlanApi = async (ratePlanId) => {
  const response = await apiClient.delete(`/rate-plans/${ratePlanId}`);
  return response.data;
};
