/**
 * Authentication and Authorization Middleware — AquaLoop Phase 2
 */
import User from '../models/User.js'
import { verifyToken, COOKIE_NAME } from '../utils/jwt.js'
import { isConnected } from '../config/db.js'

/**
 * Middleware: Requires a valid authenticated session
 * Reads JWT from HTTP-only cookie (primary) or Authorization Bearer header (fallback for testing)
 */
export async function requireAuth(req, res, next) {
  try {
    let token = req.cookies?.[COOKIE_NAME]

    // Fallback: Authorization Bearer header (helpful for tests / programmatic API access)
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1]
    }

    if (!token) {
      return res.status(401).json({
        error: 'Authentication required. Please sign in.',
      })
    }

    let decoded
    try {
      decoded = verifyToken(token)
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 'Session expired. Please sign in again.',
          code: 'TOKEN_EXPIRED',
        })
      }
      return res.status(401).json({
        error: 'Invalid session token. Please sign in again.',
      })
    }

    if (!isConnected()) {
      return res.status(503).json({
        error: 'Database connection unavailable. Please try again later.',
      })
    }

    const user = await User.findById(decoded.id).select(User.publicFields())
    if (!user) {
      return res.status(401).json({
        error: 'User account not found or has been deactivated.',
      })
    }

    req.user = user
    next()
  } catch (error) {
    next(error)
  }
}

/**
 * Middleware: Requires specific role(s) (e.g. 'admin')
 * Must be preceded by requireAuth
 * @param  {...string} roles
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required before checking permissions.',
      })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Access denied: insufficient permissions.',
      })
    }

    next()
  }
}
