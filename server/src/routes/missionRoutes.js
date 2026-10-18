/**
 * Mission Routes — AquaLoop Phase 3B
 *
 * GET  /api/v1/missions          (Public with optional auth enrichment)
 * GET  /api/v1/missions/:slug    (Public with optional auth enrichment)
 * POST /api/v1/missions/:slug/quiz (requireAuth)
 */

import express from 'express'
import {
  listMissions,
  getMission,
  handleQuizSubmission,
} from '../controllers/missionController.js'
import { requireAuth, optionalAuth } from '../middleware/auth.js'

const router = express.Router()

router.get('/', optionalAuth, listMissions)
router.get('/:slug', optionalAuth, getMission)
router.post('/:slug/quiz', requireAuth, handleQuizSubmission)

export default router
