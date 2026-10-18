/**
 * XPTransaction model — AquaLoop Phase 3B
 *
 * Immutable append-only ledger representing the authoritative source of truth for XP.
 * Standalone MongoDB consistency is achieved via:
 * - Unique idempotencyKey preventing duplicate insertion (E11000).
 * - Explicit lifecycle states: PENDING_RESERVATION -> RESERVED -> COMMITTED / ABORTED.
 * - Distributed recovery lease fields for crash reconciliation.
 */

import mongoose from 'mongoose'

const xpTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    requestedAmount: {
      type: Number,
      required: [true, 'Requested amount is required'],
      min: 0,
    },
    awardedXP: {
      type: Number,
      default: 0,
      min: 0,
    },
    source: {
      type: String,
      enum: [
        'action_submission',
        'action_verification',
        'quiz_completion',
        'streak_milestone',
        'daily_bonus',
      ],
      required: [true, 'Transaction source is required'],
    },
    sourceId: {
      type: String,
      default: null,
    },
    idempotencyKey: {
      type: String,
      required: [true, 'Idempotency key is required'],
      unique: true,
      index: true,
    },
    dateIST: {
      type: String,
      required: [true, 'Date in IST is required (YYYY-MM-DD)'],
      index: true,
    },
    isCapExempt: {
      type: Boolean,
      default: false,
    },
    state: {
      type: String,
      enum: ['PENDING_RESERVATION', 'RESERVED', 'COMMITTED', 'ABORTED'],
      default: 'PENDING_RESERVATION',
      index: true,
    },
    balanceAfter: {
      type: Number,
      default: null,
    },
    recoveryLockOwner: {
      type: String,
      default: null,
    },
    recoveryLockExpiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
)

xpTransactionSchema.index({ userId: 1, dateIST: 1 })
xpTransactionSchema.index({ state: 1, createdAt: 1 })

const XPTransaction = mongoose.model('XPTransaction', xpTransactionSchema)
export default XPTransaction
