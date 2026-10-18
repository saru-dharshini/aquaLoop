/**
 * Action Service — AquaLoop Phase 3B
 *
 * Handles action logging, daily habit anti-farming checks, and admin photo verification.
 * Environmental integrity:
 * - Claimed litres are strictly self-reported until admin verification.
 * - Verified litres are credited only upon explicit admin approval.
 */

import Action from '../models/Action.js'
import Mission from '../models/Mission.js'
import User from '../models/User.js'
import { awardXP } from './xpLedgerService.js'
import { recordUserActivity } from './streakService.js'
import { checkAndAwardBadges } from './badgeService.js'
import { getTodayIST } from '../utils/time.js'

const DAILY_HABIT_SLUGS = ['act-bucket-bath', 'act-greywater-divert', 'act-mulch-garden']

/**
 * Logs a water-saving action for a citizen.
 *
 * @param {object} params
 * @param {string|import('mongoose').Types.ObjectId} params.userId
 * @param {string} params.missionSlug
 * @param {string} [params.description]
 * @param {number} [params.claimedLitres]
 * @param {string} [params.proofImageUrl]
 * @param {string} [params.dateIST]
 * @returns {Promise<object>}
 */
export async function logAction({
  userId,
  missionSlug,
  description = '',
  claimedLitres,
  proofImageUrl = null,
  dateIST = getTodayIST(),
}) {
  const mission = await Mission.findOne({ slug: missionSlug, isActive: true })
  if (!mission) {
    const err = new Error('Action mission not found')
    err.status = 404
    throw err
  }

  // Anti-farming rule: 1 submission per calendar day for habit actions
  const isHabit = DAILY_HABIT_SLUGS.includes(missionSlug)
  if (isHabit) {
    const existingToday = await Action.findOne({
      userId,
      missionSlug,
      createdAt: {
        $gte: new Date(`${dateIST}T00:00:00.000+05:30`),
        $lte: new Date(`${dateIST}T23:59:59.999+05:30`),
      },
    })

    if (existingToday) {
      const err = new Error('This daily habit action has already been logged today')
      err.status = 409
      throw err
    }
  }

  const safeLitres =
    claimedLitres !== undefined && claimedLitres !== null
      ? Math.max(0, Number(claimedLitres))
      : mission.estimatedLitresSavedPerDay

  const idempotencyKey = isHabit
    ? `action_${userId}_${missionSlug}_${dateIST}`
    : `action_${userId}_${missionSlug}_${Date.now()}_${Math.random().toString(36).substring(7)}`

  // Award Base XP
  const awardResult = await awardXP({
    userId,
    requestedAmount: mission.baseXP,
    source: 'action_submission',
    sourceId: missionSlug,
    idempotencyKey,
    isCapExempt: false,
    dateIST,
  })

  const verificationStatus =
    proofImageUrl && mission.verificationType === 'photo_proof'
      ? 'pending_verification'
      : 'self_reported'

  const action = await Action.create({
    userId,
    missionSlug,
    title: mission.title,
    category: mission.category,
    description: description || mission.description,
    claimedLitres: safeLitres,
    verifiedLitres: 0,
    proofImageUrl,
    verificationStatus,
    submissionXPAwarded: awardResult.awardedXP,
    bonusXPAwarded: 0,
  })

  // Update user statistics
  await User.updateOne(
    { _id: userId },
    {
      $inc: {
        actionsLogged: 1,
        totalWaterSavedLitres: safeLitres,
      },
    },
  )

  // Record streak activity
  const streakResult = await recordUserActivity(userId, dateIST)

  // Check for badge unlocks
  const newBadges = await checkAndAwardBadges(userId)

  return {
    success: true,
    action,
    awardedXP: awardResult.awardedXP,
    dailyCapped: awardResult.dailyCapped,
    balanceAfter: awardResult.balanceAfter,
    streak: streakResult.streak,
    freezeUsed: streakResult.freezeUsed,
    newBadges,
  }
}

/**
 * Reviews and verifies an action submission (Admin only).
 *
 * @param {object} params
 * @param {string|import('mongoose').Types.ObjectId} params.actionId
 * @param {string|import('mongoose').Types.ObjectId} params.adminId
 * @param {boolean} params.approved
 * @param {string} [params.adminNotes]
 * @param {number} [params.verifiedLitres]
 * @returns {Promise<object>}
 */
export async function verifyAction({
  actionId,
  adminId,
  approved,
  adminNotes = '',
  verifiedLitres,
}) {
  const action = await Action.findById(actionId)
  if (!action) {
    const err = new Error('Action not found')
    err.status = 404
    throw err
  }

  if (action.verificationStatus === 'verified') {
    const err = new Error('Action has already been verified')
    err.status = 409
    throw err
  }

  if (action.verificationStatus === 'rejected') {
    const err = new Error('Action has already been rejected')
    err.status = 409
    throw err
  }

  if (!approved) {
    action.verificationStatus = 'rejected'
    action.adminNotes = adminNotes || 'Proof does not meet verification requirements'
    action.reviewedBy = adminId
    action.reviewedAt = new Date()
    await action.save()
    return { success: true, action, message: 'Action rejected' }
  }

  // Approved: Require explicitly supplied and validated verified amount
  const numericVerified = Number(verifiedLitres)
  if (
    verifiedLitres === undefined ||
    verifiedLitres === null ||
    isNaN(numericVerified) ||
    !Number.isFinite(numericVerified) ||
    numericVerified < 0
  ) {
    const err = new Error(
      'An explicitly verified non-negative number for verifiedLitres is required when approving an action as verified.',
    )
    err.status = 400
    throw err
  }
  const finalVerifiedLitres = numericVerified

  // Award verification bonus XP (exempt from daily cap)
  const mission = await Mission.findOne({ slug: action.missionSlug })
  const bonusXP = mission?.bonusXP || 50

  const bonusAward = await awardXP({
    userId: action.userId,
    requestedAmount: bonusXP,
    source: 'action_verification',
    sourceId: action._id.toString(),
    idempotencyKey: `verify_bonus_action_${action._id}`,
    isCapExempt: true,
  })

  action.verificationStatus = 'verified'
  action.verifiedLitres = finalVerifiedLitres
  action.bonusXPAwarded = bonusAward.awardedXP
  action.adminNotes = adminNotes
  action.reviewedBy = adminId
  action.reviewedAt = new Date()
  await action.save()

  // Update user's verified impact
  await User.updateOne(
    { _id: action.userId },
    {
      $inc: {
        verifiedWaterSavedLitres: finalVerifiedLitres,
      },
    },
  )

  // Check for badge unlocks for the citizen
  const newBadges = await checkAndAwardBadges(action.userId)

  return {
    success: true,
    action,
    bonusXPAwarded: bonusAward.awardedXP,
    balanceAfter: bonusAward.balanceAfter,
    newBadges,
  }
}

/**
 * Gets logged actions for a citizen.
 *
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {number} [limit=50]
 * @returns {Promise<Array<object>>}
 */
export async function getMyActions(userId, limit = 50) {
  return Action.find({ userId }).sort({ createdAt: -1 }).limit(limit).lean()
}
