/**
 * UserBadge model — AquaLoop Phase 3B
 *
 * Junction collection linking users to earned badges.
 * Unique compound index `{ userId: 1, badgeSlug: 1 }` guarantees zero duplicate unlocks.
 */

import mongoose from 'mongoose'

const userBadgeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    badgeSlug: {
      type: String,
      required: true,
      index: true,
    },
    earnedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
)

userBadgeSchema.index({ userId: 1, badgeSlug: 1 }, { unique: true })

const UserBadge = mongoose.model('UserBadge', userBadgeSchema)
export default UserBadge
