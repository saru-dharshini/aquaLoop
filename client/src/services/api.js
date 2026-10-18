/**
 * Centralized API Client — AquaLoop Phase 2
 *
 * Uses Axios with credentials enabled to automatically send & receive
 * HTTP-only authentication cookies with each request.
 */
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api/v1`
  : '/api/v1'

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // Send and receive HTTP-only cookies
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

// Response interceptor: Extract clean error message
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Extract server error message or fallback
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred. Please try again.'

    // Attach normalized message for easy consumption in UI
    error.userMessage = message
    return Promise.reject(error)
  },
)

export default api
