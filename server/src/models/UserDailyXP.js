/**
 * UserDailyXP model — AquaLoop Phase 3B
 *
 * Manages daily XP cap reservations and commitments per user per IST day.
 * Single-document WiredTiger locking serializes concurrent awards on `_id`.
 */

import mongoose from 'mongoose'

const reservationItemSchema = new mongoose.Schema(
  {
    txId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { _id: false },
)

const userDailyXPSchema = new mongoose.Schema(
  {
    _id: {
      type: String, // format: `${userId}_${dateIST}`
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    dateIST: {
      type: String,
      required: true,
      index: true,
    },
    committedXP: {
      type: Number,
      default: 0,
      min: 0,
      max: 300,
    },
    reservedXP: {
      type: Number,
      default: 0,
      min: 0,
    },
    reservations: {
      type: [reservationItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
)

userDailyXPSchema.index({ userId: 1, dateIST: 1 })

const UserDailyXP = mongoose.model('UserDailyXP', userDailyXPSchema)
export default UserDailyXP
