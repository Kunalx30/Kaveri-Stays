import apiClient from './client';

/**
 * Rooms API Module
 *
 * Scoped according to role:
 * - Owner: can list, create, update, delete across properties.
 * - Manager: scoped to assigned property.
 */

export const listRoomsApi = async (params = {}) => {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v != null && v !== '')
  );
  const response = await apiClient.get('/rooms', { params: cleanParams });
  return response.data;
};

export const getRoomByIdApi = async (roomId) => {
  const response = await apiClient.get(`/rooms/${roomId}`);
  return response.data;
};

export const createRoomApi = async (payload) => {
  const response = await apiClient.post('/rooms', payload);
  return response.data;
};

export const updateRoomApi = async (roomId, payload) => {
  const response = await apiClient.patch(`/rooms/${roomId}`, payload);
  return response.data;
};

export const deleteRoomApi = async (roomId) => {
  const response = await apiClient.delete(`/rooms/${roomId}`);
  return response.data;
};
