/**
 * Streak & Daily Bonus Service — AquaLoop Phase 3B
 *
 * Implements deterministic streak progression anchored to Asia/Kolkata:
 * - Δ = 0: Same day, streak unchanged.
 * - Δ = 1: Consecutive day, streak += 1, check milestone awards.
 * - Δ = 2: Missed 1 day, consumes streak freeze if available, else resets to 1.
 * - Δ > 2: Missed 2+ days, streak resets to 1.
 * - Max 2 streak freezes held.
 * - Daily bonus roll: 10–25 XP once per IST day (counted inside 300 XP cap).
 */

import User from '../models/User.js'
import { getTodayIST, daysBetweenIST } from '../utils/time.js'
import { awardXP } from './xpLedgerService.js'

const MAX_STREAK_FREEZES = 2

const STREAK_MILESTONES = [
  { days: 3, bonusXP: 30, grantsFreeze: false },
  { days: 7, bonusXP: 75, grantsFreeze: true },
  { days: 14, bonusXP: 150, grantsFreeze: false },
  { days: 30, bonusXP: 350, grantsFreeze: false },
]

/**
 * Records activity for a user and updates streak progression.
 *
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {string} [dateIST]
 * @returns {Promise<{ streak: number, freezeUsed: boolean, milestoneAwards: Array<object> }>}
 */
export async function recordUserActivity(userId, dateIST = getTodayIST()) {
  const user = await User.findById(userId)
  if (!user) {
    throw new Error('User not found')
  }

  let streak = user.streak || 0
  let streakFreezes = user.streakFreezes || 0
  let freezeUsed = false
  const milestoneAwards = []

  if (!user.lastActiveDateIST) {
    // First activity ever
    streak = 1
  } else {
    const delta = daysBetweenIST(dateIST, user.lastActiveDateIST)

    if (delta <= 0) {
      // Same day (or earlier) activity: streak is unaffected
      return { streak, freezeUsed: false, milestoneAwards: [] }
    } else if (delta === 1) {
      // Consecutive day: increment streak
      streak += 1
    } else if (delta === 2) {
      // Missed exactly 1 day: check for streak freeze
      if (streakFreezes > 0) {
        streakFreezes -= 1
        freezeUsed = true
        // Streak is preserved
      } else {
        streak = 1
      }
    } else {
      // Missed 2 or more days: streak resets to 1
      streak = 1
    }
  }

  // Check for milestone awards if streak increased
  const claimedMilestones = new Set(user.claimedStreakMilestones || [])

  for (const m of STREAK_MILESTONES) {
    if (streak >= m.days && !claimedMilestones.has(m.days)) {
      if (m.grantsFreeze) {
        streakFreezes = Math.min(MAX_STREAK_FREEZES, streakFreezes + 1)
      }

      // Award milestone bonus XP (exempt from daily cap)
      const award = await awardXP({
        userId,
        requestedAmount: m.bonusXP,
        source: 'streak_milestone',
        sourceId: `streak_${m.days}`,
        idempotencyKey: `streak_milestone_${userId}_day${m.days}`,
        isCapExempt: true,
        dateIST,
      })

      claimedMilestones.add(m.days)
      milestoneAwards.push({
        milestoneDays: m.days,
        awardedXP: award.awardedXP,
        freezeGranted: m.grantsFreeze,
      })
    }
  }

  await User.updateOne(
    { _id: userId },
    {
      $set: {
        streak,
        streakFreezes,
        lastActiveDate: new Date(),
        lastActiveDateIST: dateIST,
        claimedStreakMilestones: Array.from(claimedMilestones),
      },
    },
  )

  return {
    streak,
    freezeUsed,
    milestoneAwards,
  }
}

/**
 * Claims daily sign-in bonus (10–25 XP).
 * Counts toward the 300 XP daily cap.
 *
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {string} [dateIST]
 * @returns {Promise<object>}
 */
export async function claimDailyBonus(userId, dateIST = getTodayIST()) {
  const idempotencyKey = `daily_bonus_${userId}_${dateIST}`

  // Deterministic uniform random roll between 10 and 25
  const bonusAmount = Math.floor(Math.random() * 16) + 10

  const awardResult = await awardXP({
    userId,
    requestedAmount: bonusAmount,
    source: 'daily_bonus',
    sourceId: `bonus_${dateIST}`,
    idempotencyKey,
    isCapExempt: false, // Counts inside the 300 XP cap
    dateIST,
  })

  if (awardResult.isDuplicate) {
    const err = new Error('Daily bonus has already been claimed for today')
    err.status = 409
    throw err
  }

  // Also update streak activity for today
  const streakResult = await recordUserActivity(userId, dateIST)

  return {
    success: true,
    awardedXP: awardResult.awardedXP,
    dailyCapped: awardResult.dailyCapped,
    balanceAfter: awardResult.balanceAfter,
    streak: streakResult.streak,
    freezeUsed: streakResult.freezeUsed,
    milestoneAwards: streakResult.milestoneAwards,
  }
}
