/**
 * UserMission model — AquaLoop Phase 3B
 *
 * Tracks individual citizen progress and completion state on learning quizzes and missions.
 */

import mongoose from 'mongoose'

const userMissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    missionSlug: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'failed'],
      default: 'in_progress',
      index: true,
    },
    scorePercent: {
      type: Number,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    retryAvailableAt: {
      type: Date,
      default: null,
    },
    attemptsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
)

userMissionSchema.index({ userId: 1, missionSlug: 1 }, { unique: true })

const UserMission = mongoose.model('UserMission', userMissionSchema)
export default UserMission
