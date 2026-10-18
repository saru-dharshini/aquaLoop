/**
 * Game Controller — AquaLoop Phase 3B
 *
 * Handles Daily Bonus, Badges, and Leaderboard.
 */

import { claimDailyBonus } from '../services/streakService.js'
import { getAllBadges, getUserBadges } from '../services/badgeService.js'
import { getLeaderboard } from '../services/leaderboardService.js'

export async function handleClaimDailyBonus(req, res, next) {
  try {
    const userId = req.user._id
    const result = await claimDailyBonus(userId)
    res.json(result)
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message })
    }
    next(error)
  }
}

export async function handleGetAllBadges(req, res, next) {
  try {
    const badges = await getAllBadges()
    res.json({ badges })
  } catch (error) {
    next(error)
  }
}

export async function handleGetMyBadges(req, res, next) {
  try {
    const userId = req.user._id
    const badges = await getUserBadges(userId)
    res.json({ badges })
  } catch (error) {
    next(error)
  }
}

export async function handleGetLeaderboard(req, res, next) {
  try {
    const { limit, page, city, includeSample } = req.query
    const result = await getLeaderboard({
      limit,
      page,
      city,
      includeSample: includeSample === 'true',
    })
    res.json(result)
  } catch (error) {
    next(error)
  }
}
