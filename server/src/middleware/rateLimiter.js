/**
 * Rate Limiting Middleware for Auth Endpoints — AquaLoop Phase 2
 */
import rateLimit from 'express-rate-limit'

// Strict rate limiter for registration: max 10 registrations per hour per IP
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many accounts created from this IP. Please try again after an hour.',
  },
})

// Strict rate limiter for login: max 10 failed login attempts per 15 minutes per IP
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many login attempts. Please wait 15 minutes before trying again.',
  },
})
