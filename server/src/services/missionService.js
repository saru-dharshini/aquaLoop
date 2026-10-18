/**
 * Mission & Quiz Service — AquaLoop Phase 3B
 *
 * Handles mission retrieval and server-side quiz answer validation.
 * Security guarantees:
 * - correctOptionIndex is never returned to the client.
 * - Quiz retries enforce an anti-brute-force 1-hour cooldown on failure.
 * - No feedback is given on which individual answers were wrong.
 * - XP awards are server-controlled via xpLedgerService.
 */

import Mission from '../models/Mission.js'
import UserMission from '../models/UserMission.js'
import { DEFAULT_MISSIONS } from '../data/defaultMissions.js'
import { awardXP } from './xpLedgerService.js'

const PASSING_PERCENTAGE = 80
const RETRY_COOLDOWN_MS = 60 * 60 * 1000 // 1 hour

/**
 * Ensures initial default missions exist in database.
 */
export async function ensureDefaultMissions() {
  const count = await Mission.countDocuments({})
  if (count === 0) {
    await Mission.insertMany(DEFAULT_MISSIONS)
  }
}

/**
 * Gets all active missions enriched with user's completion status.
 * Note: quizQuestions.correctOptionIndex is excluded.
 *
 * @param {string|import('mongoose').Types.ObjectId} [userId]
 * @returns {Promise<Array<object>>}
 */
export async function getMissions(userId = null) {
  await ensureDefaultMissions()

  const missions = await Mission.find({ isActive: true })
    .select('-quizQuestions.correctOptionIndex')
    .lean()

  let userMissionsMap = new Map()
  if (userId) {
    const userMissions = await UserMission.find({ userId }).lean()
    userMissions.forEach((um) => userMissionsMap.set(um.missionSlug, um))
  }

  return missions.map((mission) => {
    const userRecord = userMissionsMap.get(mission.slug)
    const isCompleted = userRecord?.status === 'completed'
    const retryAvailableAt = userRecord?.retryAvailableAt || null
    const isCooldownActive = retryAvailableAt ? new Date(retryAvailableAt) > new Date() : false

    return {
      ...mission,
      userStatus: {
        isCompleted: Boolean(isCompleted),
        scorePercent: userRecord?.scorePercent ?? null,
        completedAt: userRecord?.completedAt ?? null,
        retryAvailableAt: isCooldownActive ? retryAvailableAt : null,
        isCooldownActive,
        attemptsCount: userRecord?.attemptsCount || 0,
      },
    }
  })
}

/**
 * Gets a single mission by slug without exposing answers.
 *
 * @param {string} slug
 * @param {string|import('mongoose').Types.ObjectId} [userId]
 * @returns {Promise<object>}
 */
export async function getMissionBySlug(slug, userId = null) {
  await ensureDefaultMissions()

  const mission = await Mission.findOne({ slug, isActive: true })
    .select('-quizQuestions.correctOptionIndex')
    .lean()

  if (!mission) {
    const err = new Error('Mission not found')
    err.status = 404
    throw err
  }

  let userStatus = {
    isCompleted: false,
    scorePercent: null,
    completedAt: null,
    retryAvailableAt: null,
    isCooldownActive: false,
  }

  if (userId) {
    const userRecord = await UserMission.findOne({ userId, missionSlug: slug }).lean()
    if (userRecord) {
      const isCooldownActive = userRecord.retryAvailableAt
        ? new Date(userRecord.retryAvailableAt) > new Date()
        : false
      userStatus = {
        isCompleted: userRecord.status === 'completed',
        scorePercent: userRecord.scorePercent,
        completedAt: userRecord.completedAt,
        retryAvailableAt: isCooldownActive ? userRecord.retryAvailableAt : null,
        isCooldownActive,
      }
    }
  }

  return { ...mission, userStatus }
}

/**
 * Validates quiz answers entirely on the server.
 *
 * @param {object} params
 * @param {string|import('mongoose').Types.ObjectId} params.userId
 * @param {string} params.slug
 * @param {Array<{ questionId: string, selectedIndex: number }>} params.answers
 * @returns {Promise<object>}
 */
export async function submitQuiz({ userId, slug, answers = [] }) {
  // Query mission WITH protected correctOptionIndex
  const mission = await Mission.findOne({ slug, category: 'learning', isActive: true }).select(
    '+quizQuestions.correctOptionIndex',
  )

  if (!mission) {
    const err = new Error('Learning mission not found')
    err.status = 404
    throw err
  }

  // Check existing progress
  const userMission = await UserMission.findOne({ userId, missionSlug: slug })

  if (userMission && userMission.status === 'completed') {
    const err = new Error('Quiz has already been completed')
    err.status = 409
    throw err
  }

  // Check anti-brute-force cooldown
  const now = new Date()
  if (userMission && userMission.retryAvailableAt && userMission.retryAvailableAt > now) {
    const remainingMinutes = Math.ceil((userMission.retryAvailableAt - now) / 60000)
    const err = new Error(
      `Retry cooldown active. Please review the material and try again in ${remainingMinutes} minute(s).`,
    )
    err.status = 429
    err.retryAvailableAt = userMission.retryAvailableAt
    throw err
  }

  // Server-side scoring
  const questions = mission.quizQuestions || []
  if (questions.length === 0) {
    const err = new Error('No quiz questions configured for this mission')
    err.status = 500
    throw err
  }

  const answerMap = new Map()
  answers.forEach((a) => {
    if (a && a.questionId) {
      answerMap.set(a.questionId, Number(a.selectedIndex))
    }
  })

  let correctCount = 0
  for (const q of questions) {
    const selected = answerMap.get(q.questionId)
    if (selected !== undefined && selected === q.correctOptionIndex) {
      correctCount++
    }
  }

  const scorePercent = Math.round((correctCount / questions.length) * 100)
  const passed = scorePercent >= PASSING_PERCENTAGE

  if (!passed) {
    // Failure: award 0 XP, set 1-hour anti-guessing cooldown, reveal zero answers
    const retryAvailableAt = new Date(Date.now() + RETRY_COOLDOWN_MS)

    await UserMission.findOneAndUpdate(
      { userId, missionSlug: slug },
      {
        $set: {
          status: 'failed',
          scorePercent,
          retryAvailableAt,
        },
        $inc: { attemptsCount: 1 },
      },
      { upsert: true, returnDocument: 'after' },
    )

    return {
      passed: false,
      scorePercent,
      passingScore: PASSING_PERCENTAGE,
      message: 'Score did not meet the passing threshold (80%). Review the material and try again in 1 hour.',
      retryAvailableAt,
    }
  }

  // Passed: Award XP atomically via ledger
  const awardResult = await awardXP({
    userId,
    requestedAmount: mission.baseXP,
    source: 'quiz_completion',
    sourceId: slug,
    idempotencyKey: `quiz_${userId}_${slug}`,
  })

  // Mark mission completed permanently
  await UserMission.findOneAndUpdate(
    { userId, missionSlug: slug },
    {
      $set: {
        status: 'completed',
        scorePercent,
        completedAt: new Date(),
        retryAvailableAt: null,
      },
      $inc: { attemptsCount: 1 },
    },
    { upsert: true, returnDocument: 'after' },
  )

  return {
    passed: true,
    scorePercent,
    passingScore: PASSING_PERCENTAGE,
    message: 'Congratulations! You passed the water literacy quiz.',
    awardedXP: awardResult.awardedXP,
    dailyCapped: awardResult.dailyCapped,
    balanceAfter: awardResult.balanceAfter,
  }
}
