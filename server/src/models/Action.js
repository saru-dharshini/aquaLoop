/**
 * Action model — AquaLoop Phase 3B
 *
 * Tracks citizen conservation actions and two-stage photo verification.
 * Environmental integrity:
 * - claimedLitres is strictly self-reported until verified by admin.
 * - verifiedLitres is only credited upon explicit admin verification.
 */

import mongoose from 'mongoose'

const actionSchema = new mongoose.Schema(
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
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    claimedLitres: {
      type: Number,
      default: 0,
      min: 0,
    },
    verifiedLitres: {
      type: Number,
      default: 0,
      min: 0,
    },
    proofImageUrl: {
      type: String,
      default: null,
    },
    verificationStatus: {
      type: String,
      enum: ['self_reported', 'pending_verification', 'verified', 'rejected'],
      default: 'self_reported',
      index: true,
    },
    submissionXPAwarded: {
      type: Number,
      default: 0,
      min: 0,
    },
    bonusXPAwarded: {
      type: Number,
      default: 0,
      min: 0,
    },
    adminNotes: {
      type: String,
      default: null,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    isSample: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  },
)

actionSchema.index({ userId: 1, createdAt: -1 })
actionSchema.index({ verificationStatus: 1, createdAt: -1 })

const Action = mongoose.model('Action', actionSchema)
export default Action
