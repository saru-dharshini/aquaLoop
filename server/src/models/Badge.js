/**
 * Badge model — AquaLoop Phase 3B
 *
 * Defines platform achievement badges.
 */

import mongoose from 'mongoose'

const badgeSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    tier: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum'],
      required: true,
    },
    icon: {
      type: String,
      default: 'Award', // Lucide icon name fallback
    },
    condition: {
      type: {
        type: String,
        enum: ['actions_count', 'learning_count', 'streak_days', 'level', 'verified_count'],
        required: true,
      },
      threshold: {
        type: Number,
        required: true,
      },
    },
  },
  {
    timestamps: true,
  },
)

const Badge = mongoose.model('Badge', badgeSchema)
export default Badge
