/**
 * Authentication Controller — AquaLoop Phase 2
 */
import User from '../models/User.js'
import { signToken, setAuthCookie, clearAuthCookie } from '../utils/jwt.js'
import { isConnected } from '../config/db.js'

/**
 * POST /api/v1/auth/register
 * Creates a new citizen account and signs the user in via HTTP-only cookie.
 */
export async function register(req, res, next) {
  try {
    if (!isConnected()) {
      return res.status(503).json({
        error: 'Database is currently offline. Please try again in a few moments.',
      })
    }

    const { username, email, password } = req.body

    // Check duplicate email
    const existingEmail = await User.findOne({ email })
    if (existingEmail) {
      return res.status(409).json({
        error: 'An account with this email address already exists.',
      })
    }

    // Check duplicate username
    const existingUsername = await User.findOne({ username })
    if (existingUsername) {
      return res.status(409).json({
        error: 'This username is already taken. Please choose another.',
      })
    }

    // Create user. role defaults to 'citizen' in User model schema.
    const user = new User({
      username,
      email,
      passwordHash: password, // Will be hashed by pre-save hook
      role: 'citizen',
    })

    await user.save()

    // Sign JWT and set HTTP-only cookie
    const token = signToken({
      id: user._id,
      role: user.role,
      email: user.email,
    })
    setAuthCookie(res, token)

    return res.status(201).json({
      message: 'Registration successful. Welcome to AquaLoop!',
      user: user.toJSON(),
    })
  } catch (error) {
    // Catch duplicate key race conditions
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'account'
      return res.status(409).json({
        error: `An account with this ${field} already exists.`,
      })
    }
    next(error)
  }
}

/**
 * POST /api/v1/auth/login
 * Validates credentials, issues JWT via HTTP-only cookie.
 */
export async function login(req, res, next) {
  try {
    if (!isConnected()) {
      return res.status(503).json({
        error: 'Database is currently offline. Please try again in a few moments.',
      })
    }

    const { email, password } = req.body

    // Must explicitly select +passwordHash since select:false in schema
    const user = await User.findOne({ email }).select('+passwordHash')
    if (!user) {
      return res.status(401).json({
        error: 'Invalid email address or password.',
      })
    }

    const isMatch = await user.verifyPassword(password)
    if (!isMatch) {
      return res.status(401).json({
        error: 'Invalid email address or password.',
      })
    }

    // Sign JWT and set HTTP-only cookie
    const token = signToken({
      id: user._id,
      role: user.role,
      email: user.email,
    })
    setAuthCookie(res, token)

    return res.status(200).json({
      message: 'Signed in successfully.',
      user: user.toJSON(),
    })
  } catch (error) {
    next(error)
  }
}

/**
 * POST /api/v1/auth/logout
 * Clears the HTTP-only auth cookie.
 */
export async function logout(_req, res) {
  clearAuthCookie(res)
  return res.status(200).json({
    message: 'Signed out successfully.',
  })
}

/**
 * GET /api/v1/auth/me
 * Returns profile of currently authenticated user.
 */
export async function getMe(req, res) {
  return res.status(200).json({
    user: req.user,
  })
}

/**
 * GET /api/v1/auth/admin-test
 * Protected route requiring admin role. Confirms RBAC enforcement.
 */
export async function adminTest(req, res) {
  return res.status(200).json({
    message: 'Admin authorization confirmed.',
    user: req.user,
  })
}
