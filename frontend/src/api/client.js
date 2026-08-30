import axios from 'axios';

/**
 * Base URL for the Kaveri Stays FastAPI Backend (v1 prefix).
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// Root URL (for liveness/readiness probes mounted outside /api/v1)
const ROOT_URL = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

/**
 * Request Interceptor:
 * Attaches the JWT Bearer access token to all protected requests.
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('kaveri_access_token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response Interceptor:
 * Handles 401 Unauthorized errors by attempting automatic refresh token rotation.
 */
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh for 401 errors on non-auth routes
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/register') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const storedRefreshToken = localStorage.getItem('kaveri_refresh_token');
      if (!storedRefreshToken) {
        isRefreshing = false;
        localStorage.removeItem('kaveri_access_token');
        localStorage.removeItem('kaveri_refresh_token');
        localStorage.removeItem('kaveri_user');
        window.dispatchEvent(new Event('auth:session_expired'));
        return Promise.reject(error);
      }

      try {
        // Direct call to refresh endpoint using raw axios to avoid interceptor loop
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: storedRefreshToken,
        });

        const { access_token, refresh_token: newRefreshToken } = response.data;
        localStorage.setItem('kaveri_access_token', access_token);
        if (newRefreshToken) {
          localStorage.setItem('kaveri_refresh_token', newRefreshToken);
        }

        apiClient.defaults.headers.common.Authorization = `Bearer ${access_token}`;
        originalRequest.headers.Authorization = `Bearer ${access_token}`;

        processQueue(null, access_token);
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('kaveri_access_token');
        localStorage.removeItem('kaveri_refresh_token');
        localStorage.removeItem('kaveri_user');
        window.dispatchEvent(new Event('auth:session_expired'));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Health check helper querying the root liveness probe (/health).
 */
export const checkHealth = async () => {
  const response = await axios.get(`${ROOT_URL}/health`, { timeout: 8000 });
  return response.data;
};

/**
 * Readiness check helper querying backend database connectivity & latency (/health/ready).
 */
export const checkReadiness = async () => {
  const response = await axios.get(`${ROOT_URL}/health/ready`, { timeout: 8000 });
  return response.data;
};

export default apiClient;
export { API_BASE_URL, ROOT_URL };
