/**
 * XP Ledger, Concurrency, and Crash Recovery Integration Tests — AquaLoop Phase 3B
 *
 * Validates:
 * 1. Strict 300 XP daily cap enforcement under high concurrency.
 * 2. Deduplication and durable idempotency keys.
 * 3. Partial award and zero-capacity cap-at-ceiling boundaries.
 * 4. Crash recovery protocol for every individual phase write.
 * 5. Rebuilding projections from immutable ledger log.
 * 6. Approved level thresholds (Droplet, Stream, River, Ocean Guardian).
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import User from '../src/models/User.js'
import XPTransaction from '../src/models/XPTransaction.js'
import UserDailyXP from '../src/models/UserDailyXP.js'
import {
  awardXP,
  reconcileUserXP,
  rebuildUserXPProjection,
} from '../src/services/xpLedgerService.js'
import { computeLevel, getLevelDetails } from '../src/utils/levels.js'

let mongoServer

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create()
  const mongoUri = mongoServer.getUri()
  await mongoose.connect(mongoUri)
})

afterAll(async () => {
  await mongoose.disconnect()
  if (mongoServer) {
    await mongoServer.stop()
  }
})

beforeEach(async () => {
  await User.deleteMany({})
  await XPTransaction.deleteMany({})
  await UserDailyXP.deleteMany({})
})

async function createTestUser(username = 'waterhero', email = 'hero@aqualoop.local') {
  return User.create({
    username,
    email,
    passwordHash: 'hashed_pw_placeholder',
    role: 'citizen',
    xp: 0,
    level: 1,
  })
}

describe('Level Thresholds & Progression Curve', () => {
  it('correctly maps XP to approved level tiers (Droplet, Stream, River, Ocean Guardian)', () => {
    expect(computeLevel(0)).toBe(1)
    expect(computeLevel(499)).toBe(1)
    expect(computeLevel(500)).toBe(2)
    expect(computeLevel(1499)).toBe(2)
    expect(computeLevel(1500)).toBe(3)
    expect(computeLevel(3499)).toBe(3)
    expect(computeLevel(3500)).toBe(4)
    expect(computeLevel(10000)).toBe(4)
  })

  it('computes accurate level progress details and percentages', () => {
    const d1 = getLevelDetails(250)
    expect(d1.level).toBe(1)
    expect(d1.name).toBe('Droplet')
    expect(d1.xpInLevel).toBe(250)
    expect(d1.xpToNext).toBe(500)
    expect(d1.percentage).toBe(50)

    const d2 = getLevelDetails(1000)
    expect(d2.level).toBe(2)
    expect(d2.name).toBe('Stream')
    expect(d2.xpInLevel).toBe(500)
    expect(d2.xpToNext).toBe(1000)
    expect(d2.percentage).toBe(50)

    const d4 = getLevelDetails(5000)
    expect(d4.level).toBe(4)
    expect(d4.name).toBe('Ocean Guardian')
    expect(d4.percentage).toBe(100)
  })
})

describe('Daily Cap & Idempotency Enforcement', () => {
  it('enforces exact partial award down to cap ceiling and flags dailyCapped', async () => {
    const user = await createTestUser()
    const testDate = '2026-10-18'

    // First award: 280 XP
    const r1 = await awardXP({
      userId: user._id,
      requestedAmount: 280,
      source: 'action_submission',
      idempotencyKey: 'tx_init_280',
      dateIST: testDate,
    })
    expect(r1.success).toBe(true)
    expect(r1.awardedXP).toBe(280)
    expect(r1.dailyCapped).toBe(false)
    expect(r1.balanceAfter).toBe(280)

    // Second award: requests 35 XP, but only 20 capacity remains (300 - 280 = 20)
    const r2 = await awardXP({
      userId: user._id,
      requestedAmount: 35,
      source: 'action_submission',
      idempotencyKey: 'tx_overflow_35',
      dateIST: testDate,
    })
    expect(r2.success).toBe(true)
    expect(r2.awardedXP).toBe(20)
    expect(r2.requestedXP).toBe(35)
    expect(r2.dailyCapped).toBe(true)
    expect(r2.balanceAfter).toBe(300)

    // Third award: requests 25 XP when already at 300 XP
    const r3 = await awardXP({
      userId: user._id,
      requestedAmount: 25,
      source: 'action_submission',
      idempotencyKey: 'tx_at_cap_25',
      dateIST: testDate,
    })
    expect(r3.success).toBe(true)
    expect(r3.awardedXP).toBe(0)
    expect(r3.dailyCapped).toBe(true)
    expect(r3.balanceAfter).toBe(300)

    const updatedUser = await User.findById(user._id)
    expect(updatedUser.xp).toBe(300)
  })

  it('allows cap-exempt admin verification bonuses to exceed daily cap', async () => {
    const user = await createTestUser()
    const testDate = '2026-10-18'

    // Fill daily cap to 300 XP
    await awardXP({
      userId: user._id,
      requestedAmount: 300,
      source: 'action_submission',
      idempotencyKey: 'tx_fill_300',
      dateIST: testDate,
    })

    // Admin verification bonus: exempt from daily cap
    const rBonus = await awardXP({
      userId: user._id,
      requestedAmount: 75,
      source: 'action_verification',
      idempotencyKey: 'tx_admin_verify_bonus_75',
      isCapExempt: true,
      dateIST: testDate,
    })

    expect(rBonus.success).toBe(true)
    expect(rBonus.awardedXP).toBe(75)
    expect(rBonus.dailyCapped).toBe(false)
    expect(rBonus.balanceAfter).toBe(375)

    const updatedUser = await User.findById(user._id)
    expect(updatedUser.xp).toBe(375)
  })

  it('rejects duplicate requests and returns idempotent cached results', async () => {
    const user = await createTestUser()
    const idempotencyKey = 'unique_action_key_123'

    const res1 = await awardXP({
      userId: user._id,
      requestedAmount: 50,
      source: 'action_submission',
      idempotencyKey,
      dateIST: '2026-10-18',
    })

    const res2 = await awardXP({
      userId: user._id,
      requestedAmount: 50,
      source: 'action_submission',
      idempotencyKey,
      dateIST: '2026-10-18',
    })

    expect(res1.awardedXP).toBe(50)
    expect(res2.awardedXP).toBe(50)
    expect(res2.isDuplicate).toBe(true)

    // User balance was only incremented ONCE
    const updatedUser = await User.findById(user._id)
    expect(updatedUser.xp).toBe(50)

    const txCount = await XPTransaction.countDocuments({ idempotencyKey })
    expect(txCount).toBe(1)
  })
})

describe('High-Concurrency Stress Tests', () => {
  it('prevents daily cap overflow when 10 requests compete for 20 XP headroom in parallel', async () => {
    const user = await createTestUser()
    const testDate = '2026-10-18'

    // Pre-fill user with 280 XP
    await awardXP({
      userId: user._id,
      requestedAmount: 280,
      source: 'action_submission',
      idempotencyKey: 'prefill_280',
      dateIST: testDate,
    })

    // Fire 10 parallel requests of 40 XP each
    const promises = []
    for (let i = 0; i < 10; i++) {
      promises.push(
        awardXP({
          userId: user._id,
          requestedAmount: 40,
          source: 'action_submission',
          idempotencyKey: `concurrent_req_${i}`,
          dateIST: testDate,
        }),
      )
    }

    const results = await Promise.all(promises)
    const totalAwarded = results.reduce((sum, r) => sum + r.awardedXP, 0)

    // Exact assertion: across all 10 parallel requests, exactly 20 XP total was awarded
    expect(totalAwarded).toBe(20)

    const updatedUser = await User.findById(user._id)
    expect(updatedUser.xp).toBe(300)

    const dailyDoc = await UserDailyXP.findById(`${user._id}_${testDate}`)
    expect(dailyDoc.committedXP).toBe(300)
  })

  it('safely handles concurrent identical duplicate submissions without race conditions', async () => {
    const user = await createTestUser()
    const sharedIdempotencyKey = 'race_condition_test_key'

    const promises = []
    for (let i = 0; i < 5; i++) {
      promises.push(
        awardXP({
          userId: user._id,
          requestedAmount: 40,
          source: 'action_submission',
          idempotencyKey: sharedIdempotencyKey,
          dateIST: '2026-10-18',
        }),
      )
    }

    const results = await Promise.all(promises)
    const successful = results.filter((r) => r.success)

    expect(successful.length).toBe(5)
    expect(results[0].awardedXP).toBe(40)

    // Exactly 1 transaction created
    const count = await XPTransaction.countDocuments({ idempotencyKey: sharedIdempotencyKey })
    expect(count).toBe(1)

    // User only received 40 XP, not 200 XP
    const updatedUser = await User.findById(user._id)
    expect(updatedUser.xp).toBe(40)
  })
})

describe('Crash Recovery & Projection Rebuild', () => {
  it('safely recovers a crash occurring after ledger creation (Step 1 crash)', async () => {
    const user = await createTestUser()
    const testDate = '2026-10-18'

    // Simulate crash after Step 1: XPTransaction is in PENDING_RESERVATION
    const staleTime = new Date(Date.now() - 20000)
    const orphanTx = await XPTransaction.create({
      userId: user._id,
      requestedAmount: 50,
      awardedXP: 0,
      source: 'action_submission',
      idempotencyKey: 'stale_step1_tx',
      dateIST: testDate,
      state: 'PENDING_RESERVATION',
      createdAt: staleTime,
    })

    const reconResult = await reconcileUserXP(user._id, { staleThresholdMs: 5000 })
    expect(reconResult.reconciledCount).toBe(1)

    const finalizedTx = await XPTransaction.findById(orphanTx._id)
    expect(finalizedTx.state).toBe('ABORTED')

    // User balance was never touched
    const updatedUser = await User.findById(user._id)
    expect(updatedUser.xp).toBe(0)
  })

  it('safely recovers orphaned reservation when crash occurs between reservation and state write (Step 1.5 crash) and restores capacity', async () => {
    const user = await createTestUser('step15user', 'step15@aqua.local')
    const testDate = '2026-10-18'
    const dailyKey = `${user._id}_${testDate}`

    // Simulate crash after Step 2 write to UserDailyXP, but BEFORE XPTransaction.state saved as RESERVED
    const staleTime = new Date(Date.now() - 20000)
    const tx = await XPTransaction.create({
      userId: user._id,
      requestedAmount: 50,
      awardedXP: 0,
      source: 'action_submission',
      idempotencyKey: 'stale_step15_tx',
      dateIST: testDate,
      state: 'PENDING_RESERVATION', // Still pending reservation on ledger
      createdAt: staleTime,
    })

    // Orphaned reservation exists in UserDailyXP
    await UserDailyXP.create({
      _id: dailyKey,
      userId: user._id,
      dateIST: testDate,
      committedXP: 0,
      reservedXP: 50,
      reservations: [
        {
          txId: tx._id,
          amount: 50,
          expiresAt: new Date(Date.now() + 60000),
        },
      ],
    })

    // Run recovery
    const reconResult = await reconcileUserXP(user._id, { staleThresholdMs: 5000 })
    expect(reconResult.reconciledCount).toBe(1)

    // Transaction is safely aborted
    const finalizedTx = await XPTransaction.findById(tx._id)
    expect(finalizedTx.state).toBe('ABORTED')

    // User balance was never incremented
    const updatedUser = await User.findById(user._id)
    expect(updatedUser.xp).toBe(0)

    // Orphaned reservation was released and reservedXP decremented
    const dailyDoc = await UserDailyXP.findById(dailyKey)
    expect(dailyDoc.reservedXP).toBe(0)
    expect(dailyDoc.reservations.length).toBe(0)

    // Restored daily capacity: user can now award full 300 XP without cap leakage
    const awardResult = await awardXP({
      userId: user._id,
      requestedAmount: 300,
      source: 'action_submission',
      idempotencyKey: 'fresh_full_award_after_recovery',
      dateIST: testDate,
    })

    expect(awardResult.awardedXP).toBe(300)
    expect(awardResult.dailyCapped).toBe(false)
  })

  it('concurrent recovery workers acquire distributed lease and never double-apply', async () => {
    const user = await createTestUser('concurrent_recon_user', 'recon@aqua.local')
    const testDate = '2026-10-18'
    const dailyKey = `${user._id}_${testDate}`

    const staleTime = new Date(Date.now() - 20000)
    const tx = await XPTransaction.create({
      userId: user._id,
      requestedAmount: 40,
      awardedXP: 40,
      source: 'action_submission',
      idempotencyKey: 'concurrent_recon_tx',
      dateIST: testDate,
      state: 'RESERVED',
      createdAt: staleTime,
    })

    await UserDailyXP.create({
      _id: dailyKey,
      userId: user._id,
      dateIST: testDate,
      committedXP: 0,
      reservedXP: 40,
      reservations: [{ txId: tx._id, amount: 40, expiresAt: new Date(Date.now() + 60000) }],
    })

    // Run two recovery workers simultaneously
    const [resultA, resultB] = await Promise.all([
      reconcileUserXP(user._id, { workerId: 'worker_alpha', staleThresholdMs: 5000 }),
      reconcileUserXP(user._id, { workerId: 'worker_beta', staleThresholdMs: 5000 }),
    ])

    // Exactly one worker processed the transaction
    expect(resultA.reconciledCount + resultB.reconciledCount).toBe(1)

    // User XP incremented exactly once (40, not 80)
    const updatedUser = await User.findById(user._id)
    expect(updatedUser.xp).toBe(40)

    const finalizedTx = await XPTransaction.findById(tx._id)
    expect(finalizedTx.state).toBe('COMMITTED')
    expect(finalizedTx.balanceAfter).toBe(40)
  })

  it('safely recovers a crash occurring after reservation placed (Step 2 crash)', async () => {
    const user = await createTestUser()
    const testDate = '2026-10-18'
    const dailyKey = `${user._id}_${testDate}`

    // Simulate crash after Step 2: reservation in UserDailyXP and RESERVED on ledger, but user.xp NOT incremented
    const staleTime = new Date(Date.now() - 20000)
    const tx = await XPTransaction.create({
      userId: user._id,
      requestedAmount: 45,
      awardedXP: 45,
      source: 'action_submission',
      idempotencyKey: 'stale_step2_tx',
      dateIST: testDate,
      state: 'RESERVED',
      createdAt: staleTime,
    })

    await UserDailyXP.create({
      _id: dailyKey,
      userId: user._id,
      dateIST: testDate,
      committedXP: 0,
      reservations: [
        {
          txId: tx._id,
          amount: 45,
          expiresAt: new Date(Date.now() + 60000),
        },
      ],
    })

    // User XP is currently 0
    expect(user.xp).toBe(0)

    const reconResult = await reconcileUserXP(user._id, { staleThresholdMs: 5000 })
    expect(reconResult.reconciledCount).toBe(1)

    // User XP safely incremented exactly once
    const updatedUser = await User.findById(user._id)
    expect(updatedUser.xp).toBe(45)

    const finalizedTx = await XPTransaction.findById(tx._id)
    expect(finalizedTx.state).toBe('COMMITTED')
    expect(finalizedTx.balanceAfter).toBe(45)

    // Reservation moved to committedXP
    const dailyDoc = await UserDailyXP.findById(dailyKey)
    expect(dailyDoc.committedXP).toBe(45)
    expect(dailyDoc.reservations.length).toBe(0)
  })

  it('guarantees balance is never incremented twice if crash occurred after user update (Step 3 crash)', async () => {
    const user = await createTestUser()
    const testDate = '2026-10-18'
    const dailyKey = `${user._id}_${testDate}`

    const staleTime = new Date(Date.now() - 20000)
    const tx = await XPTransaction.create({
      userId: user._id,
      requestedAmount: 60,
      awardedXP: 60,
      source: 'action_submission',
      idempotencyKey: 'stale_step3_tx',
      dateIST: testDate,
      state: 'RESERVED',
      createdAt: staleTime,
    })

    await UserDailyXP.create({
      _id: dailyKey,
      userId: user._id,
      dateIST: testDate,
      committedXP: 0,
      reservations: [{ txId: tx._id, amount: 60, expiresAt: new Date(Date.now() + 60000) }],
    })

    // Step 3 DID execute: user already has 60 XP and tx._id in recentTxIds
    await User.updateOne(
      { _id: user._id },
      {
        $set: { xp: 60 },
        $push: { recentTxIds: tx._id },
      },
    )

    // Run recovery
    const reconResult = await reconcileUserXP(user._id, { staleThresholdMs: 5000 })
    expect(reconResult.reconciledCount).toBe(1)

    // Balance remains 60, NOT 120!
    const updatedUser = await User.findById(user._id)
    expect(updatedUser.xp).toBe(60)

    const finalizedTx = await XPTransaction.findById(tx._id)
    expect(finalizedTx.state).toBe('COMMITTED')
    expect(finalizedTx.balanceAfter).toBe(60)
  })

  it('runs repeatedly with complete idempotency', async () => {
    const user = await createTestUser()

    await awardXP({
      userId: user._id,
      requestedAmount: 50,
      source: 'action_submission',
      idempotencyKey: 'idempotent_test_tx',
      dateIST: '2026-10-18',
    })

    // Run recovery 5 times in a row
    for (let i = 0; i < 5; i++) {
      await reconcileUserXP(user._id, { staleThresholdMs: 0 })
    }

    const updatedUser = await User.findById(user._id)
    expect(updatedUser.xp).toBe(50)
  })

  it('deterministically rebuilds user projection from immutable ledger in disaster recovery', async () => {
    const user = await createTestUser()

    // Award 3 transactions
    await awardXP({
      userId: user._id,
      requestedAmount: 40,
      source: 'action_submission',
      idempotencyKey: 'rebuild_tx_1',
      dateIST: '2026-10-18',
    })
    await awardXP({
      userId: user._id,
      requestedAmount: 60,
      source: 'action_submission',
      idempotencyKey: 'rebuild_tx_2',
      dateIST: '2026-10-18',
    })
    await awardXP({
      userId: user._id,
      requestedAmount: 50,
      source: 'action_submission',
      idempotencyKey: 'rebuild_tx_3',
      dateIST: '2026-10-18',
    })

    // Simulate catastrophic database projection corruption: set user.xp = 0
    await User.updateOne({ _id: user._id }, { $set: { xp: 0, level: 1 } })

    const corruptedUser = await User.findById(user._id)
    expect(corruptedUser.xp).toBe(0)

    // Execute disaster recovery rebuild
    const rebuildResult = await rebuildUserXPProjection(user._id)
    expect(rebuildResult.xp).toBe(150)
    expect(rebuildResult.level).toBe(1)

    const restoredUser = await User.findById(user._id)
    expect(restoredUser.xp).toBe(150)
  })
})
