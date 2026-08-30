import apiClient from './client';

/**
 * Analytics API Module
 *
 * All endpoints restricted to owner and manager roles.
 */

export const getDashboardSummaryApi = async (params = {}) => {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v != null && v !== '')
  );
  const response = await apiClient.get('/analytics/dashboard', { params: cleanParams });
  return response.data;
};

export const getBookingAnalyticsApi = async (params = {}) => {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v != null && v !== '')
  );
  const response = await apiClient.get('/analytics/bookings', { params: cleanParams });
  return response.data;
};

export const getRevenueAnalyticsApi = async (params = {}) => {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v != null && v !== '')
  );
  const response = await apiClient.get('/analytics/revenue', { params: cleanParams });
  return response.data;
};

export const getOccupancyAnalyticsApi = async (params = {}) => {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v != null && v !== '')
  );
  const response = await apiClient.get('/analytics/occupancy', { params: cleanParams });
  return response.data;
};

export const getReviewAnalyticsApi = async (params = {}) => {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v != null && v !== '')
  );
  const response = await apiClient.get('/analytics/reviews', { params: cleanParams });
  return response.data;
};

export const getPropertyPerformanceApi = async () => {
  const response = await apiClient.get('/analytics/properties');
  return response.data;
};
