import apiClient from './client';

/**
 * Authentication API module integrating with FastAPI backend.
 * Endpoints:
 *   - POST /auth/login
 *   - POST /auth/register
 *   - GET  /auth/me
 *   - POST /auth/refresh
 *   - POST /auth/logout
 */

export const loginApi = async (credentials) => {
  const response = await apiClient.post('/auth/login', credentials);
  return response.data;
};

export const registerApi = async (registrationData) => {
  const response = await apiClient.post('/auth/register', registrationData);
  return response.data;
};

export const getCurrentUserApi = async () => {
  const response = await apiClient.get('/auth/me');
  return response.data;
};

export const refreshTokenApi = async (refreshToken) => {
  const response = await apiClient.post('/auth/refresh', { refresh_token: refreshToken });
  return response.data;
};

export const logoutApi = async (refreshToken) => {
  const response = await apiClient.post('/auth/logout', { refresh_token: refreshToken });
  return response.data;
};
