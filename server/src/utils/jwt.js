/**
 * JWT and Cookie Utilities — AquaLoop Phase 2
 *
 * Security enhancements:
 * - Algorithmic pinning: HS256 enforced on both signing and verification
 * - Secret validation: Delegates to validateEnv() to ensure no insecure defaults in production
 * - HTTP-only cookies with SameSite strict (production) / lax (development)
 */
import jwt from 'jsonwebtoken'
import { validateEnv } from '../config/env.js'

const COOKIE_NAME = 'aqualoop_token'

/**
 * Sign JWT token for user payload
 * @param {Object} payload - { id, role, email }
 * @returns {string} token
 */
export function signToken(payload) {
  const { jwtSecret, jwtExpiresIn } = validateEnv()
  return jwt.sign(payload, jwtSecret, {
    algorithm: 'HS256',
    expiresIn: jwtExpiresIn,
  })
}

/**
 * Verify JWT token with explicit HS256 algorithm pinning
 * @param {string} token
 * @returns {Object} decoded payload
 */
export function verifyToken(token) {
  const { jwtSecret } = validateEnv()
  return jwt.verify(token, jwtSecret, {
    algorithms: ['HS256'],
  })
}

/**
 * Cookie configuration options based on environment
 * Secure cookies in production, sameSite lax in dev, strict in prod, httpOnly always.
 */
export function getCookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production'
  const maxAgeMs = 7 * 24 * 60 * 60 * 1000 // 7 days

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: maxAgeMs,
    path: '/',
  }
}

/**
 * Attach auth cookie to response
 * @param {import('express').Response} res
 * @param {string} token
 */
export function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, getCookieOptions())
}

/**
 * Clear auth cookie from response
 * @param {import('express').Response} res
 */
export function clearAuthCookie(res) {
  const options = getCookieOptions()
  delete options.maxAge
  res.clearCookie(COOKIE_NAME, options)
}

export { COOKIE_NAME }
