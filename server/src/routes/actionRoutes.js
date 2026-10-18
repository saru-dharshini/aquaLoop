/**
 * Action Routes — AquaLoop Phase 3B
 *
 * POST  /api/v1/actions            (requireAuth)
 * GET   /api/v1/actions/my         (requireAuth)
 * PATCH /api/v1/actions/:id/verify (requireAuth, requireRole('admin'))
 */

import express from 'express'
import {
  handleLogAction,
  handleVerifyAction,
  handleGetMyActions,
} from '../controllers/actionController.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = express.Router()

router.post('/', requireAuth, handleLogAction)
router.get('/my', requireAuth, handleGetMyActions)
router.patch('/:id/verify', requireAuth, requireRole('admin'), handleVerifyAction)

export default router
