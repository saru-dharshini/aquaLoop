/**
 * Report Model — AquaLoop Phase 4 Step 1
 *
 * Civic Water Issue Reporting with GeoJSON point coordinates,
 * 2dsphere index for true 50-metre spherical queries,
 * settlement status lifecycle (unsettled, final_primary, final_corroboration),
 * and separation of physical resolution from metered water savings.
 */

import mongoose from 'mongoose'

const reportSchema = new mongoose.Schema(
  {
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reporterUsername: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['public_leak', 'water_contamination', 'community_wastage', 'dry_public_tap'],
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 1000,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
        validate: {
          validator: function (coords) {
            return (
              Array.isArray(coords) &&
              coords.length === 2 &&
              coords[0] >= -180 &&
              coords[0] <= 180 &&
              coords[1] >= -90 &&
              coords[1] <= 90
            )
          },
          message: 'Coordinates must be [longitude, latitude] within valid geographic ranges',
        },
      },
    },
    address: {
      type: String,
      trim: true,
      default: '',
      maxlength: 200,
    },
    photoUrl: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['open', 'in_review', 'resolved', 'closed'],
      default: 'open',
      index: true,
    },
    settlementStatus: {
      type: String,
      enum: ['unsettled', 'final_primary', 'final_corroboration'],
      default: 'unsettled',
      index: true,
    },
    isPrimary: {
      type: Boolean,
      default: false,
      index: true,
    },
    primaryReportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Report',
      default: null,
      index: true,
    },
    corroborationCount: {
      type: Number,
      default: 0,
    },
    baseXPAwarded: {
      type: Boolean,
      default: false,
      index: true,
    },
    baseXPTxId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'XPTransaction',
      default: null,
    },
    resolutionXPAwarded: {
      type: Boolean,
      default: false,
      index: true,
    },
    resolutionXPTxId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'XPTransaction',
      default: null,
    },
    upvotes: {
      type: Number,
      default: 0,
    },
    upvotedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    // Environmental impact fields
    impactType: {
      type: String,
      enum: ['none', 'unmeasured_estimate', 'metered_measurement'],
      default: 'none',
    },
    estimatedLitresPerHour: {
      type: Number,
      default: 0,
      min: 0,
    },
    measuredLitresSaved: {
      type: Number,
      default: 0,
      min: 0,
    },
    impactAssumptions: {
      type: String,
      default: '',
      maxlength: 500,
    },
    impactHonestyLabel: {
      type: String,
      enum: ['No Volume Claimed', 'Unmeasured Estimate', 'Verified Meter Reading'],
      default: 'No Volume Claimed',
    },
    adminNotes: {
      type: String,
      default: '',
      maxlength: 500,
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
    resolvedAt: {
      type: Date,
      default: null,
    },
    finalizedAt: {
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

// 2dsphere index for spherical proximity queries ($nearSphere)
reportSchema.index({ location: '2dsphere' })

// Compound index for active reports and spatial clustering
reportSchema.index({ status: 1, settlementStatus: 1, isPrimary: 1 })

export const Report = mongoose.model('Report', reportSchema)
export default Report
