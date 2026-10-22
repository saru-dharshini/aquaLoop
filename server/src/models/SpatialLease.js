/**
 * SpatialLease Model — AquaLoop Phase 4 Step 1
 *
 * Distributed coordination lease for multi-cell spatial settlement.
 * Each document represents a lease over a discrete spatial cell (approx 55m x 55m).
 * Serializes concurrent competing reports across arbitrary grid boundaries,
 * with leaseToken and fencingVersion to protect against stale workers.
 */

import mongoose from 'mongoose'

const spatialLeaseSchema = new mongoose.Schema(
  {
    _id: {
      type: String, // e.g. "cell_157892_41203"
      required: true,
    },
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Report',
      required: true,
    },
    leaseToken: {
      type: String,
      required: true, // Session-specific unique token (e.g. UUID)
    },
    fencingVersion: {
      type: Number,
      default: 1, // Incremented on each takeover to fence out stale workers
    },
    leaseExpiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // Automatic TTL cleanup once expired
    },
  },
  {
    timestamps: true,
  },
)

export const SpatialLease = mongoose.model('SpatialLease', spatialLeaseSchema)
export default SpatialLease
