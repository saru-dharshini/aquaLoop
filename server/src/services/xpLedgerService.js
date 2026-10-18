/**
 * XP Ledger Service — AquaLoop Phase 3B
 *
 * Implements the crash-resilient gamification ledger and projection engine on standalone MongoDB:
 * 1. XPTransaction append-only ledger is the single source of truth.
 * 2. UserDailyXP manages daily 300 XP cap slots via atomic reservations.
 * 3. User.xp is a materialized projection with durable idempotency guards.
 * 4. Automatic reconciliation recovers crashed in-flight transactions without double-increments.
 */

import XPTransaction from '../models/XPTransaction.js'
import UserDailyXP from '../models/UserDailyXP.js'
import User from '../models/User.js'
import { getTodayIST } from '../utils/time.js'
import { computeLevel } from '../utils/levels.js'

const DAILY_CAP = 300
const RESERVATION_TTL_MS = 60 * 1000 // 60-second lease for in-flight operations

/**
 * Awards XP to a user via the atomic, crash-resilient 4-phase ledger protocol.
 *
 * @param {object} params
 * @param {string|import('mongoose').Types.ObjectId} params.userId
 * @param {number} params.requestedAmount
 * @param {string} params.source 'action_submission' | 'action_verification' | 'quiz_completion' | 'streak_milestone' | 'daily_bonus'
 * @param {string} [params.sourceId]
 * @param {string} params.idempotencyKey Unique transaction key
 * @param {boolean} [params.isCapExempt=false]
 * @param {string} [params.dateIST]
 * @returns {Promise<{ success: boolean, awardedXP: number, requestedXP: number, dailyCapped: boolean, transaction: object, isDuplicate?: boolean, balanceAfter: number }>}
 */
export async function awardXP({
  userId,
  requestedAmount,
  source,
  sourceId = null,
  idempotencyKey,
  isCapExempt = false,
  dateIST = getTodayIST(),
}) {
  const safeRequested = Math.max(0, Math.floor(requestedAmount || 0))
  const dailyKey = `${userId}_${dateIST}`

  // ── PHASE 1: Ledger Initialization (PENDING_RESERVATION) ───────────────────
  let transaction
  try {
    transaction = await XPTransaction.create({
      userId,
      requestedAmount: safeRequested,
      awardedXP: 0,
      source,
      sourceId,
      idempotencyKey,
      dateIST,
      isCapExempt,
      state: 'PENDING_RESERVATION',
    })
  } catch (err) {
    if (err.code === 11000) {
      // Duplicate idempotencyKey detected
      return handleDuplicateTransaction(idempotencyKey, userId)
    }
    throw err
  }

  // ── PHASE 2: Daily-Cap Slot Reservation (RESERVED) ─────────────────────────
  let awardedXP = safeRequested

  if (!isCapExempt) {
    // Ensure UserDailyXP document exists
    await UserDailyXP.updateOne(
      { _id: dailyKey },
      { $setOnInsert: { userId, dateIST, committedXP: 0, reservedXP: 0, reservations: [] } },
      { upsert: true },
    )

    // Atomic update pipeline:
    // If committedXP + reservedXP < DAILY_CAP:
    // calculate delta = min(safeRequested, DAILY_CAP - (committedXP + reservedXP))
    // reservedXP += delta, append reservation
    const reservedDoc = await UserDailyXP.findOneAndUpdate(
      {
        _id: dailyKey,
        $expr: { $lt: [{ $add: ['$committedXP', '$reservedXP'] }, DAILY_CAP] },
      },
      [
        {
          $set: {
            reservedXP: {
              $add: [
                '$reservedXP',
                {
                  $min: [
                    safeRequested,
                    { $subtract: [DAILY_CAP, { $add: ['$committedXP', '$reservedXP'] }] },
                  ],
                },
              ],
            },
            reservations: {
              $concatArrays: [
                '$reservations',
                [
                  {
                    txId: transaction._id,
                    amount: {
                      $min: [
                        safeRequested,
                        { $subtract: [DAILY_CAP, { $add: ['$committedXP', '$reservedXP'] }] },
                      ],
                    },
                    expiresAt: new Date(Date.now() + RESERVATION_TTL_MS),
                  },
                ],
              ],
            },
          },
        },
      ],
      { returnDocument: 'after', updatePipeline: true },
    )

    if (!reservedDoc) {
      // 0 capacity remaining: mark COMMITTED with 0 XP immediately
      const currentUser = await User.findById(userId)
      const balanceAfter = currentUser ? currentUser.xp : 0

      transaction.state = 'COMMITTED'
      transaction.awardedXP = 0
      transaction.balanceAfter = balanceAfter
      await transaction.save()

      return {
        success: true,
        awardedXP: 0,
        requestedXP: safeRequested,
        dailyCapped: true,
        transaction,
        balanceAfter,
      }
    }

    const thisRes = (reservedDoc.reservations || []).find(
      (r) => r.txId && r.txId.toString() === transaction._id.toString(),
    )
    awardedXP = thisRes ? thisRes.amount : 0
  }

  // Record reserved amount on ledger
  transaction.awardedXP = awardedXP
  transaction.state = 'RESERVED'
  await transaction.save()

  // ── PHASE 3: Durable Idempotent User Projection Application ────────────────
  const userUpdate = await User.findOneAndUpdate(
    {
      _id: userId,
      recentTxIds: { $ne: transaction._id }, // Atomic idempotency predicate
    },
    {
      $inc: { xp: awardedXP },
      $push: {
        recentTxIds: { $each: [transaction._id], $slice: -50 },
      },
      $set: {
        lastAppliedTxId: transaction._id,
      },
    },
    { returnDocument: 'after' },
  )

  let balanceAfter
  if (userUpdate) {
    balanceAfter = userUpdate.xp
    const newLevel = computeLevel(balanceAfter)
    if (userUpdate.level !== newLevel) {
      await User.updateOne({ _id: userId }, { $set: { level: newLevel } })
    }
  } else {
    // If userUpdate was null, txId was already in recentTxIds (applied by a concurrent run)
    const existingUser = await User.findById(userId)
    balanceAfter = existingUser ? existingUser.xp : 0
  }

  // ── PHASE 4: Finalize Ledger & Daily Cap Slot (COMMITTED) ──────────────────
  transaction.state = 'COMMITTED'
  transaction.balanceAfter = balanceAfter
  await transaction.save()

  if (!isCapExempt) {
    // Atomically move reservation to committedXP and remove the reservation item
    await UserDailyXP.updateOne(
      { _id: dailyKey },
      {
        $inc: { committedXP: awardedXP, reservedXP: -awardedXP },
        $pull: { reservations: { txId: transaction._id } },
      },
    )
  }

  return {
    success: true,
    awardedXP,
    requestedXP: safeRequested,
    dailyCapped: !isCapExempt && awardedXP < safeRequested,
    transaction,
    balanceAfter,
  }
}

/**
 * Handles duplicate transactions gracefully with exponential backoff polling for terminal states.
 */
async function handleDuplicateTransaction(idempotencyKey, userId) {
  for (let attempt = 0; attempt < 10; attempt++) {
    const existing = await XPTransaction.findOne({ idempotencyKey })
    if (!existing) break

    if (existing.state === 'COMMITTED') {
      return {
        success: true,
        awardedXP: existing.awardedXP,
        requestedXP: existing.requestedAmount,
        dailyCapped: !existing.isCapExempt && existing.awardedXP < existing.requestedAmount,
        transaction: existing,
        isDuplicate: true,
        balanceAfter: existing.balanceAfter,
      }
    }

    if (existing.state === 'ABORTED') {
      return {
        success: false,
        awardedXP: 0,
        requestedXP: existing.requestedAmount,
        dailyCapped: false,
        transaction: existing,
        isDuplicate: true,
        balanceAfter: null,
        reason: 'Transaction was aborted',
      }
    }

    // In-flight (PENDING_RESERVATION or RESERVED): wait 50ms and retry polling
    await new Promise((resolve) => setTimeout(resolve, 50))
  }

  // If still not resolved after polling, trigger reconciliation
  await reconcileUserXP(userId, { workerId: 'duplicate_handler' })
  const final = await XPTransaction.findOne({ idempotencyKey })
  return {
    success: final?.state === 'COMMITTED',
    awardedXP: final?.awardedXP || 0,
    requestedXP: final?.requestedAmount || 0,
    dailyCapped: false,
    transaction: final,
    isDuplicate: true,
    balanceAfter: final?.balanceAfter || 0,
  }
}

/**
 * Reconciles uncommitted or stale pending transactions for a user.
 * Guarantees zero double-increments and consistency between ledger and projection.
 *
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {object} [options={}]
 * @param {number} [options.staleThresholdMs=10000]
 * @param {string} [options.workerId='reconciler']
 * @returns {Promise<{ reconciledCount: number }>}
 */
export async function reconcileUserXP(userId, options = {}) {
  const staleThresholdMs = options.staleThresholdMs || 10000
  const workerId = options.workerId || `reconciler_${Math.random().toString(36).substring(7)}`
  const staleTime = new Date(Date.now() - staleThresholdMs)

  const pendingTxs = await XPTransaction.find({
    userId,
    state: { $in: ['PENDING_RESERVATION', 'RESERVED'] },
    createdAt: { $lt: staleTime },
  })

  let reconciledCount = 0

  for (const tx of pendingTxs) {
    // Acquire distributed recovery lease on transaction
    const now = new Date()
    const leaseTime = new Date(now.getTime() + 10000)

    const lockedTx = await XPTransaction.findOneAndUpdate(
      {
        _id: tx._id,
        state: { $in: ['PENDING_RESERVATION', 'RESERVED'] },
        $or: [
          { recoveryLockExpiresAt: null },
          { recoveryLockExpiresAt: { $lt: now } },
        ],
      },
      {
        $set: {
          recoveryLockOwner: workerId,
          recoveryLockExpiresAt: leaseTime,
        },
      },
      { returnDocument: 'after' },
    )

    if (!lockedTx) {
      // Lease not acquired (handled by another worker)
      continue
    }

    const dailyKey = `${userId}_${lockedTx.dateIST}`

    if (lockedTx.state === 'PENDING_RESERVATION') {
      // Check if an orphaned reservation was placed before the crash
      if (!lockedTx.isCapExempt) {
        const dailyDoc = await UserDailyXP.findOne({
          _id: dailyKey,
          'reservations.txId': lockedTx._id,
        })

        if (dailyDoc) {
          const matchingRes = (dailyDoc.reservations || []).find(
            (r) => r.txId && r.txId.toString() === lockedTx._id.toString(),
          )
          const amountToRelease = matchingRes?.amount || 0

          if (amountToRelease > 0) {
            await UserDailyXP.updateOne(
              {
                _id: dailyKey,
                'reservations.txId': lockedTx._id,
              },
              {
                $inc: { reservedXP: -amountToRelease },
                $pull: { reservations: { txId: lockedTx._id } },
              },
            )
          }
        }
      }

      lockedTx.state = 'ABORTED'
      lockedTx.recoveryLockOwner = null
      lockedTx.recoveryLockExpiresAt = null
      await lockedTx.save()
      reconciledCount++
      continue
    }

    if (lockedTx.state === 'RESERVED') {
      // Check if user projection already reflects this transaction
      const user = await User.findById(userId)
      const hasRecent = user.recentTxIds?.some((id) => id.toString() === lockedTx._id.toString())

      if (!hasRecent) {
        // Double-check permanent ledger sum vs user.xp
        const committedAggr = await XPTransaction.aggregate([
          { $match: { userId: user._id, state: 'COMMITTED' } },
          { $group: { _id: null, total: { $sum: '$awardedXP' } } },
        ])
        const committedSum = committedAggr[0]?.total || 0

        if (user.xp === committedSum) {
          // Balance was NOT yet incremented: apply increment safely
          await User.findOneAndUpdate(
            {
              _id: userId,
              recentTxIds: { $ne: lockedTx._id },
            },
            {
              $inc: { xp: lockedTx.awardedXP },
              $push: {
                recentTxIds: { $each: [lockedTx._id], $slice: -50 },
              },
              $set: {
                lastAppliedTxId: lockedTx._id,
                level: computeLevel(user.xp + lockedTx.awardedXP),
              },
            },
            { returnDocument: 'after' },
          )
        }
      }

      // Finalize UserDailyXP if not cap exempt
      if (!lockedTx.isCapExempt) {
        await UserDailyXP.updateOne(
          { _id: dailyKey },
          {
            $inc: { committedXP: lockedTx.awardedXP, reservedXP: -lockedTx.awardedXP },
            $pull: { reservations: { txId: lockedTx._id } },
          },
        )
      }

      const updatedUser = await User.findById(userId)
      lockedTx.state = 'COMMITTED'
      lockedTx.balanceAfter = updatedUser.xp
      lockedTx.recoveryLockOwner = null
      lockedTx.recoveryLockExpiresAt = null
      await lockedTx.save()
      reconciledCount++
    }
  }

  return { reconciledCount }
}

/**
 * Rebuilds the User XP projection deterministically from all COMMITTED ledger transactions.
 * Full disaster recovery utility.
 *
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @returns {Promise<{ xp: number, level: number }>}
 */
export async function rebuildUserXPProjection(userId) {
  const aggr = await XPTransaction.aggregate([
    { $match: { userId, state: 'COMMITTED' } },
    { $group: { _id: null, totalXP: { $sum: '$awardedXP' } } },
  ])
  const totalXP = aggr[0]?.totalXP || 0
  const level = computeLevel(totalXP)

  await User.updateOne(
    { _id: userId },
    {
      $set: {
        xp: totalXP,
        level,
      },
    },
  )

  return { xp: totalXP, level }
}
