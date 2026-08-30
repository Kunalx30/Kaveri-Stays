import apiClient from './client';

/**
 * Room Types API Module
 */

export const listRoomTypesApi = async () => {
  const response = await apiClient.get('/room-types');
  return response.data;
};

export const getRoomTypeByIdApi = async (roomTypeId) => {
  const response = await apiClient.get(`/room-types/${roomTypeId}`);
  return response.data;
};

export const createRoomTypeApi = async (payload) => {
  const response = await apiClient.post('/room-types', payload);
  return response.data;
};

export const updateRoomTypeApi = async (roomTypeId, payload) => {
  const response = await apiClient.patch(`/room-types/${roomTypeId}`, payload);
  return response.data;
};

export const deleteRoomTypeApi = async (roomTypeId) => {
  const response = await apiClient.delete(`/room-types/${roomTypeId}`);
  return response.data;
};
