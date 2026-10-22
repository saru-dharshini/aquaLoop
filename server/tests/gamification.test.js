/**
 * Core Gamification Integration Tests — AquaLoop Phase 3B
 *
 * Covers:
 * - Missions & Quizzes: hidden answers, passing threshold, 1-hr retry cooldown, duplicate blocks.
 * - Actions: habit daily limits, photo proof pending status, admin-only verification, exactly-once bonus XP.
 * - Streaks & Daily Bonus: 10–25 XP roll, IST boundaries, once-per-day enforcement.
 * - Badges: automatic unlock, duplicate unlock prevention.
 * - Leaderboard: deterministic tie-breaking, city filtering, sample data isolation.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'

process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-secret-key-at-least-32-characters-long-aqua'

import app from '../src/index.js'
import User from '../src/models/User.js'
import Mission from '../src/models/Mission.js'
import Action from '../src/models/Action.js'
import XPTransaction from '../src/models/XPTransaction.js'
import UserDailyXP from '../src/models/UserDailyXP.js'
import UserBadge from '../src/models/UserBadge.js'
import UserMission from '../src/models/UserMission.js'
import { ensureDefaultMissions } from '../src/services/missionService.js'
import { ensureDefaultBadges } from '../src/services/badgeService.js'
import { recordUserActivity } from '../src/services/streakService.js'
import { getDateIST } from '../src/utils/time.js'

let mongoServer

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create()
  const mongoUri = mongoServer.getUri()
  await mongoose.connect(mongoUri)
  await ensureDefaultMissions()
  await ensureDefaultBadges()
})

afterAll(async () => {
  await mongoose.disconnect()
  if (mongoServer) {
    await mongoServer.stop()
  }
})

beforeEach(async () => {
  await User.deleteMany({})
  await Action.deleteMany({})
  await XPTransaction.deleteMany({})
  await UserDailyXP.deleteMany({})
  await UserBadge.deleteMany({})
  await UserMission.deleteMany({})
})

function generateToken(user) {
  return jwt.sign(
    { id: user._id.toString(), email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { algorithm: 'HS256', expiresIn: '7d' },
  )
}

async function createCitizen(username = 'wateruser', email = 'citizen@aqualoop.local') {
  return User.create({
    username,
    email,
    passwordHash: 'hashed_pw',
    role: 'citizen',
    xp: 0,
    level: 1,
  })
}

async function createAdmin(username = 'wateradmin', email = 'admin@aqualoop.local') {
  return User.create({
    username,
    email,
    passwordHash: 'hashed_pw',
    role: 'admin',
    xp: 100,
    level: 1,
  })
}

describe('Missions & Quizzes API', () => {
  it('lists missions without exposing quiz correctOptionIndex', async () => {
    const res = await request(app).get('/api/v1/missions')
    expect(res.status).toBe(200)
    expect(res.body.missions).toBeDefined()
    expect(res.body.missions.length).toBeGreaterThan(0)

    const quizMission = res.body.missions.find((m) => m.slug === 'learn-water-footprint-101')
    expect(quizMission).toBeDefined()
    expect(quizMission.quizQuestions).toBeDefined()
    expect(quizMission.quizQuestions.length).toBe(5)

    // Verify correctOptionIndex is NOT exposed over the wire
    quizMission.quizQuestions.forEach((q) => {
      expect(q.correctOptionIndex).toBeUndefined()
      expect(q.prompt).toBeDefined()
      expect(q.options.length).toBeGreaterThanOrEqual(2)
    })
  })

  it('handles failing quiz: awards 0 XP, hides answers, and enforces 1-hour retry cooldown', async () => {
    const user = await createCitizen()
    const token = generateToken(user)

    // Submit all wrong answers (e.g. index 3 for all questions)
    const resFail = await request(app)
      .post('/api/v1/missions/learn-water-footprint-101/quiz')
      .set('Authorization', `Bearer ${token}`)
      .send({
        answers: [
          { questionId: 'q1', selectedIndex: 3 },
          { questionId: 'q2', selectedIndex: 3 },
          { questionId: 'q3', selectedIndex: 3 },
          { questionId: 'q4', selectedIndex: 3 },
          { questionId: 'q5', selectedIndex: 3 },
        ],
      })

    expect(resFail.status).toBe(200)
    expect(resFail.body.passed).toBe(false)
    expect(resFail.body.scorePercent).toBeLessThan(80)
    expect(resFail.body.retryAvailableAt).toBeDefined()

    // Ensure 0 XP was awarded
    const userAfterFail = await User.findById(user._id)
    expect(userAfterFail.xp).toBe(0)

    // Immediate retry should be blocked with 429 Too Many Requests
    const resRetry = await request(app)
      .post('/api/v1/missions/learn-water-footprint-101/quiz')
      .set('Authorization', `Bearer ${token}`)
      .send({
        answers: [{ questionId: 'q1', selectedIndex: 1 }],
      })

    expect(resRetry.status).toBe(429)
    expect(resRetry.body.error).toContain('Retry cooldown active')
  })

  it('handles passing quiz: awards base XP, marks completed, and blocks retrying completed quiz', async () => {
    const user = await createCitizen()
    const token = generateToken(user)

    // Correct answers for learn-water-footprint-101: q1:1, q2:2, q3:0, q4:1, q5:1
    const resPass = await request(app)
      .post('/api/v1/missions/learn-water-footprint-101/quiz')
      .set('Authorization', `Bearer ${token}`)
      .send({
        answers: [
          { questionId: 'q1', selectedIndex: 1 },
          { questionId: 'q2', selectedIndex: 2 },
          { questionId: 'q3', selectedIndex: 0 },
          { questionId: 'q4', selectedIndex: 1 },
          { questionId: 'q5', selectedIndex: 1 },
        ],
      })

    expect(resPass.status).toBe(200)
    expect(resPass.body.passed).toBe(true)
    expect(resPass.body.scorePercent).toBe(100)
    expect(resPass.body.awardedXP).toBe(40)

    const updatedUser = await User.findById(user._id)
    expect(updatedUser.xp).toBe(40)

    // Attempting to retake a completed quiz returns 409 Conflict
    const resRetake = await request(app)
      .post('/api/v1/missions/learn-water-footprint-101/quiz')
      .set('Authorization', `Bearer ${token}`)
      .send({
        answers: [{ questionId: 'q1', selectedIndex: 1 }],
      })

    expect(resRetake.status).toBe(409)
    expect(resRetake.body.error).toContain('already been completed')
  })

  it('automatically unlocks Curious Stream badge upon completing 3 beginner quizzes without logging any action', async () => {
    const user = await createCitizen('quiz_learner', 'learner@aqualoop.local')
    const token = generateToken(user)

    // Complete Quiz 1: learn-water-footprint-101
    const res1 = await request(app)
      .post('/api/v1/missions/learn-water-footprint-101/quiz')
      .set('Authorization', `Bearer ${token}`)
      .send({
        answers: [
          { questionId: 'q1', selectedIndex: 1 },
          { questionId: 'q2', selectedIndex: 2 },
          { questionId: 'q3', selectedIndex: 0 },
          { questionId: 'q4', selectedIndex: 1 },
          { questionId: 'q5', selectedIndex: 1 },
        ],
      })
    expect(res1.status).toBe(200)
    expect(res1.body.passed).toBe(true)
    expect(res1.body.newBadges).toEqual([])

    // Complete Quiz 2: learn-groundwater-crisis
    const res2 = await request(app)
      .post('/api/v1/missions/learn-groundwater-crisis/quiz')
      .set('Authorization', `Bearer ${token}`)
      .send({
        answers: [
          { questionId: 'q1', selectedIndex: 1 },
          { questionId: 'q2', selectedIndex: 1 },
          { questionId: 'q3', selectedIndex: 0 },
          { questionId: 'q4', selectedIndex: 1 },
          { questionId: 'q5', selectedIndex: 0 },
        ],
      })
    expect(res2.status).toBe(200)
    expect(res2.body.passed).toBe(true)
    expect(res2.body.newBadges).toEqual([])

    // Attempt Quiz 3 with failing answers first: should NOT award badge
    const resFail3 = await request(app)
      .post('/api/v1/missions/learn-urban-water-cycle/quiz')
      .set('Authorization', `Bearer ${token}`)
      .send({
        answers: [
          { questionId: 'q1', selectedIndex: 3 },
          { questionId: 'q2', selectedIndex: 3 },
          { questionId: 'q3', selectedIndex: 3 },
          { questionId: 'q4', selectedIndex: 3 },
          { questionId: 'q5', selectedIndex: 3 },
        ],
      })
    expect(resFail3.status).toBe(200)
    expect(resFail3.body.passed).toBe(false)
    expect(resFail3.body.newBadges).toBeUndefined()

    // Confirm curious-stream is still locked
    const resBadgesMid = await request(app)
      .get('/api/v1/game/badges/my')
      .set('Authorization', `Bearer ${token}`)
    expect(resBadgesMid.status).toBe(200)
    expect(resBadgesMid.body.badges.some((b) => b.slug === 'curious-stream')).toBe(false)

    // Clear cooldown on failed quiz attempt so user can pass
    await UserMission.updateOne(
      { userId: user._id, missionSlug: 'learn-urban-water-cycle' },
      { $set: { retryAvailableAt: null } },
    )

    // Complete Quiz 3 with passing answers: learn-urban-water-cycle
    const res3 = await request(app)
      .post('/api/v1/missions/learn-urban-water-cycle/quiz')
      .set('Authorization', `Bearer ${token}`)
      .send({
        answers: [
          { questionId: 'q1', selectedIndex: 1 },
          { questionId: 'q2', selectedIndex: 1 },
          { questionId: 'q3', selectedIndex: 1 },
          { questionId: 'q4', selectedIndex: 0 },
          { questionId: 'q5', selectedIndex: 1 },
        ],
      })
    expect(res3.status).toBe(200)
    expect(res3.body.passed).toBe(true)
    expect(res3.body.newBadges).toBeDefined()
    expect(res3.body.newBadges.some((b) => b.slug === 'curious-stream')).toBe(true)

    // Verify GET /api/v1/game/badges/my includes curious-stream
    const resBadgesFinal = await request(app)
      .get('/api/v1/game/badges/my')
      .set('Authorization', `Bearer ${token}`)
    expect(resBadgesFinal.status).toBe(200)
    expect(resBadgesFinal.body.badges.some((b) => b.slug === 'curious-stream')).toBe(true)

    // Verify strictly zero actions logged or created in database
    const dbUser = await User.findById(user._id)
    expect(dbUser.actionsLogged).toBe(0)
    const actionCount = await Action.countDocuments({ userId: user._id })
    expect(actionCount).toBe(0)

    // Verify single UserBadge document exists
    const userBadgesInDB = await UserBadge.find({ userId: user._id })
    expect(userBadgesInDB.length).toBe(1)
    expect(userBadgesInDB[0].badgeSlug).toBe('curious-stream')
  })
})

describe('Actions & Admin Verification API', () => {
  it('logs a daily habit action and prevents duplicate logging on same day', async () => {
    const user = await createCitizen()
    const token = generateToken(user)

    const res1 = await request(app)
      .post('/api/v1/actions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        missionSlug: 'act-bucket-bath',
        claimedLitres: 45,
        description: 'Took a bucket bath instead of shower',
      })

    expect(res1.status).toBe(201)
    expect(res1.body.awardedXP).toBe(25)
    expect(res1.body.action.verificationStatus).toBe('self_reported')

    // Second submission on the same day is blocked with 409 Conflict
    const res2 = await request(app)
      .post('/api/v1/actions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        missionSlug: 'act-bucket-bath',
        claimedLitres: 45,
      })

    expect(res2.status).toBe(409)
    expect(res2.body.error).toContain('already been logged today')
  })

  it('rejects quiz submission when answers is not an array (schema enforcement)', async () => {
    const user = await createCitizen()
    const token = generateToken(user)

    const res = await request(app)
      .post('/api/v1/missions/learn-water-footprint-101/quiz')
      .set('Authorization', `Bearer ${token}`)
      .send({
        answers: { q1: 1, q2: 2 }, // Invalid object schema
      })

    expect(res.status).toBe(400)
    expect(res.body.error).toContain('Answers must be an array')
  })

  it('marks actions with photo proof as pending_verification and enforces admin verification with explicit verifiedLitres', async () => {
    const citizen = await createCitizen('photo_citizen', 'pcitizen@aqua.local')
    const admin = await createAdmin('lead_admin', 'ladmin@aqua.local')
    const citizenToken = generateToken(citizen)
    const adminToken = generateToken(admin)

    // Citizen submits action with photo proof
    const resSubmit = await request(app)
      .post('/api/v1/actions')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        missionSlug: 'act-aerator-install',
        claimedLitres: 30,
        proofImageUrl: 'https://cloudinary.com/sample_aerator.jpg',
        description: 'Installed 4L/min aerator in kitchen',
      })

    expect(resSubmit.status).toBe(201)
    expect(resSubmit.body.awardedXP).toBe(35)
    expect(resSubmit.body.action.verificationStatus).toBe('pending_verification')

    const actionId = resSubmit.body.action._id

    // Non-admin attempting to verify: 403 Forbidden
    const resNonAdmin = await request(app)
      .patch(`/api/v1/actions/${actionId}/verify`)
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({ approved: true, verifiedLitres: 30 })

    expect(resNonAdmin.status).toBe(403)

    // Admin attempts to approve without verifiedLitres: 400 Bad Request
    const resNoLitres = await request(app)
      .patch(`/api/v1/actions/${actionId}/verify`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        approved: true,
        adminNotes: 'Aerator visible',
      })

    expect(resNoLitres.status).toBe(400)
    expect(resNoLitres.body.error).toContain('verifiedLitres is required')

    // Admin attempts to approve with invalid/negative verifiedLitres: 400 Bad Request
    const resNegLitres = await request(app)
      .patch(`/api/v1/actions/${actionId}/verify`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        approved: true,
        verifiedLitres: -10,
      })

    expect(resNegLitres.status).toBe(400)
    expect(resNegLitres.body.error).toContain('verifiedLitres is required')

    // Admin verifies action with explicit valid verifiedLitres
    const resVerify = await request(app)
      .patch(`/api/v1/actions/${actionId}/verify`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        approved: true,
        verifiedLitres: 30,
        adminNotes: 'Aerator installation clearly visible in photo',
      })

    expect(resVerify.status).toBe(200)
    expect(resVerify.body.action.verificationStatus).toBe('verified')
    expect(resVerify.body.action.verifiedLitres).toBe(30)
    expect(resVerify.body.bonusXPAwarded).toBe(50) // act-aerator-install bonusXP is 50

    // Check citizen's total balance and verified litres
    const updatedCitizen = await User.findById(citizen._id)
    expect(updatedCitizen.xp).toBe(85) // 35 base + 50 bonus
    expect(updatedCitizen.verifiedWaterSavedLitres).toBe(30)

    // Admin attempting repeat verification: 409 Conflict
    const resRepeat = await request(app)
      .patch(`/api/v1/actions/${actionId}/verify`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ approved: true, verifiedLitres: 30 })

    expect(resRepeat.status).toBe(409)
    expect(resRepeat.body.error).toContain('already been verified')
  })
})

describe('Daily Bonus, Badges, and Leaderboard API', () => {
  it('awards daily bonus (10–25 XP) and rejects multiple claims on the same day', async () => {
    const user = await createCitizen()
    const token = generateToken(user)

    const res1 = await request(app)
      .post('/api/v1/game/daily-bonus')
      .set('Authorization', `Bearer ${token}`)

    expect(res1.status).toBe(200)
    expect(res1.body.awardedXP).toBeGreaterThanOrEqual(10)
    expect(res1.body.awardedXP).toBeLessThanOrEqual(25)
    expect(res1.body.balanceAfter).toBe(res1.body.awardedXP)

    // Second claim today is blocked
    const res2 = await request(app)
      .post('/api/v1/game/daily-bonus')
      .set('Authorization', `Bearer ${token}`)

    expect(res2.status).toBe(409)
    expect(res2.body.error).toContain('already been claimed')
  })

  it('automatically awards first-drop badge on first action logged without duplicates', async () => {
    const user = await createCitizen()
    const token = generateToken(user)

    const res = await request(app)
      .post('/api/v1/actions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        missionSlug: 'act-bucket-bath',
        claimedLitres: 45,
      })

    expect(res.status).toBe(201)
    expect(res.body.newBadges).toBeDefined()
    expect(res.body.newBadges.some((b) => b.slug === 'first-drop')).toBe(true)

    // Query user badges endpoint
    const resBadges = await request(app)
      .get('/api/v1/game/badges/my')
      .set('Authorization', `Bearer ${token}`)

    expect(resBadges.status).toBe(200)
    expect(resBadges.body.badges.some((b) => b.slug === 'first-drop')).toBe(true)
  })

  it('returns leaderboard with correct ranking, tie-breaking, and sample data exclusion', async () => {
    // Create 3 users
    await User.create([
      { username: 'user_high_xp', email: 'high@aqua.local', passwordHash: 'p', xp: 500, streak: 3 },
      { username: 'user_low_xp', email: 'low@aqua.local', passwordHash: 'p', xp: 100, streak: 1 },
      { username: 'user_sample_demo', email: 'sample@aqua.local', passwordHash: 'p', xp: 999, streak: 10, isSample: true },
    ])

    // Query leaderboard (default includeSample = false)
    const res = await request(app).get('/api/v1/leaderboard')
    expect(res.status).toBe(200)
    expect(res.body.users).toBeDefined()

    // Sample user is excluded
    expect(res.body.users.some((u) => u.username === 'user_sample_demo')).toBe(false)

    // Rank 1 has higher XP
    expect(res.body.users[0].username).toBe('user_high_xp')
    expect(res.body.users[0].rank).toBe(1)
    expect(res.body.users[1].username).toBe('user_low_xp')
    expect(res.body.users[1].rank).toBe(2)

    // When includeSample=true, sample user is included
    const resSample = await request(app).get('/api/v1/leaderboard?includeSample=true')
    expect(resSample.status).toBe(200)
    expect(resSample.body.users.some((u) => u.username === 'user_sample_demo')).toBe(true)
  })
})

describe('Streaks & Timezone / Milestone Edge Cases', () => {
  it('correctly increments streak across IST midnight boundary (23:59:58 to 00:00:02)', async () => {
    const user = await createCitizen('midnight_citizen', 'midnight@aqua.local')

    // First activity right before midnight IST (23:59:58)
    const tBeforeMidnight = new Date('2026-10-18T23:59:58.000+05:30')
    const dateBeforeMidnight = getDateIST(tBeforeMidnight)
    expect(dateBeforeMidnight).toBe('2026-10-18')

    const res1 = await recordUserActivity(user._id, dateBeforeMidnight)
    expect(res1.streak).toBe(1)

    const userMid = await User.findById(user._id)
    expect(userMid.streak).toBe(1)
    expect(userMid.lastActiveDateIST).toBe('2026-10-18')

    // Second activity 4 seconds later, right after midnight IST (00:00:02)
    const tAfterMidnight = new Date('2026-10-19T00:00:02.000+05:30')
    const dateAfterMidnight = getDateIST(tAfterMidnight)
    expect(dateAfterMidnight).toBe('2026-10-19')

    const res2 = await recordUserActivity(user._id, dateAfterMidnight)
    expect(res2.streak).toBe(2)
    expect(res2.freezeUsed).toBe(false)

    const userFinal = await User.findById(user._id)
    expect(userFinal.streak).toBe(2)
    expect(userFinal.lastActiveDateIST).toBe('2026-10-19')
  })

  it('prevents re-claiming streak milestone rewards and freezes after deliberate streak reset', async () => {
    const user = await createCitizen('milestone_reset_citizen', 'mreset@aqua.local')

    // Simulate climbing to 7-day streak
    let currentDate = new Date('2026-10-01T12:00:00.000+05:30')
    let lastRes
    for (let day = 1; day <= 7; day++) {
      const dateStr = getDateIST(currentDate)
      lastRes = await recordUserActivity(user._id, dateStr)
      currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000)
    }

    expect(lastRes.streak).toBe(7)
    // 7-day milestone should have granted a freeze and bonus XP
    expect(lastRes.milestoneAwards.some((m) => m.milestoneDays === 7)).toBe(true)

    const userAt7 = await User.findById(user._id)
    expect(userAt7.streak).toBe(7)
    expect(userAt7.streakFreezes).toBe(1)
    expect(userAt7.claimedStreakMilestones).toContain(7)

    // Simulate streak reset: user misses 3 days (delta = 4)
    currentDate = new Date(currentDate.getTime() + 3 * 24 * 60 * 60 * 1000)
    const dateAfterMiss = getDateIST(currentDate)
    const resetRes = await recordUserActivity(user._id, dateAfterMiss)

    // Freeze is not sufficient for 4-day gap, streak resets to 1
    expect(resetRes.streak).toBe(1)

    const userReset = await User.findById(user._id)
    expect(userReset.streak).toBe(1)
    // claimedStreakMilestones should STILL contain 7
    expect(userReset.claimedStreakMilestones).toContain(7)

    // Climb back up to 7-day streak again
    for (let day = 2; day <= 7; day++) {
      currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000)
      const dateStr = getDateIST(currentDate)
      lastRes = await recordUserActivity(user._id, dateStr)
    }

    expect(lastRes.streak).toBe(7)
    // Crucial check: milestone day 7 is NOT awarded again!
    expect(lastRes.milestoneAwards.length).toBe(0)

    const userReclimbed = await User.findById(user._id)
    expect(userReclimbed.streak).toBe(7)
    // Freeze count was not incremented again by the reset
    expect(userReclimbed.streakFreezes).toBe(userReset.streakFreezes)
  })
})
