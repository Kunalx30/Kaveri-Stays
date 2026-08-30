import axios from 'axios';

/**
 * Base URL for the FastAPI Backend.
 * Resolved from Vite environment variable VITE_API_BASE_URL (defaults to http://localhost:8000).
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

/**
 * Health check helper querying the backend liveness probe.
 */
export const checkHealth = async () => {
  const response = await apiClient.get('/health');
  return response.data;
};

/**
 * Readiness check helper querying backend database connectivity & latency.
 */
export const checkReadiness = async () => {
  const response = await apiClient.get('/health/ready');
  return response.data;
};

export default apiClient;
export { API_BASE_URL };
