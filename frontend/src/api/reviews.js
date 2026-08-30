/**
 * Reviews API Module — Kaveri Stays Frontend Phase F6
 *
 * Matches the actual backend review endpoints:
 *   GET    /api/v1/reviews             → listReviewsApi()
 *   GET    /api/v1/reviews/:id         → getReviewByIdApi()
 *   POST   /api/v1/reviews             → createReviewApi()
 *   PATCH  /api/v1/reviews/:id         → updateReviewApi()
 *   DELETE /api/v1/reviews/:id         → deleteReviewApi()
 *
 * Schemas:
 *   ReviewCreate: { booking_id: int, rating: int (1-5), comments?: str (max 2000) }
 *   ReviewUpdate: { rating?: int (1-5), comments?: str (max 2000) }
 *   ReviewResponse: { review_id, booking_id, rating, comments, reviewed_at, property_id, guest_id, guest_name }
 */
import apiClient from './client';

/**
 * List reviews with optional filters.
 *
 * @param {{ property_id?: number, booking_id?: number, rating?: number }} params
 * @returns {Promise<Array<ReviewResponse>>}
 */
export const listReviewsApi = async (params = {}) => {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v != null && v !== '')
  );
  const response = await apiClient.get('/reviews', { params: cleanParams });
  return response.data;
};

/**
 * Get a single review by ID.
 *
 * @param {number} reviewId
 * @returns {Promise<ReviewResponse>}
 */
export const getReviewByIdApi = async (reviewId) => {
  const response = await apiClient.get(`/reviews/${reviewId}`);
  return response.data;
};

/**
 * Submit a review for a completed stay (checked-out reservation).
 *
 * @param {{ booking_id: number, rating: number, comments?: string }} payload
 * @returns {Promise<ReviewResponse>}
 */
export const createReviewApi = async (payload) => {
  const response = await apiClient.post('/reviews', payload);
  return response.data;
};

/**
 * Partially update an existing review (rating or comments).
 *
 * @param {number} reviewId
 * @param {{ rating?: number, comments?: string }} payload
 * @returns {Promise<ReviewResponse>}
 */
export const updateReviewApi = async (reviewId, payload) => {
  const response = await apiClient.patch(`/reviews/${reviewId}`, payload);
  return response.data;
};

/**
 * Delete a review by ID.
 *
 * @param {number} reviewId
 * @returns {Promise<{ message: string }>}
 */
export const deleteReviewApi = async (reviewId) => {
  const response = await apiClient.delete(`/reviews/${reviewId}`);
  return response.data;
};
