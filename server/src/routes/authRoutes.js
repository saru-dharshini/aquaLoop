/**
 * Auth Routes — AquaLoop Phase 2
 */
import { Router } from 'express'
import {
  register,
  login,
  logout,
  getMe,
  adminTest,
} from '../controllers/authController.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { validateBody, registerSchema, loginSchema } from '../utils/validation.js'
import { registerLimiter, loginLimiter } from '../middleware/rateLimiter.js'

const router = Router()

// Public authentication routes
router.post('/register', registerLimiter, validateBody(registerSchema), register)
router.post('/login', loginLimiter, validateBody(loginSchema), login)
router.post('/logout', logout)

// Authenticated session check
router.get('/me', requireAuth, getMe)

// Admin-only test endpoint to confirm RBAC functionality
router.get('/admin-test', requireAuth, requireRole('admin'), adminTest)

export default router
