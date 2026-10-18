/**
 * Game Routes — AquaLoop Phase 3B
 *
 * POST /api/v1/game/daily-bonus (requireAuth)
 * GET  /api/v1/game/badges      (Public)
 * GET  /api/v1/game/badges/my   (requireAuth)
 * GET  /api/v1/game/leaderboard (Public)
 */

import express from 'express'
import {
  handleClaimDailyBonus,
  handleGetAllBadges,
  handleGetMyBadges,
  handleGetLeaderboard,
} from '../controllers/gameController.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

router.post('/daily-bonus', requireAuth, handleClaimDailyBonus)
router.get('/badges', handleGetAllBadges)
router.get('/badges/my', requireAuth, handleGetMyBadges)
router.get('/leaderboard', handleGetLeaderboard)

export default router
