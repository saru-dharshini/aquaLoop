/**
 * Report Service — AquaLoop Phase 4 Step 1
 *
 * Implements civic water issue duplicate settlement protocol:
 * 1. Two-phase settlement with withheld base XP.
 * 2. Multi-cell distributed leases acquired in lexicographical order (deadlock-free).
 * 3. Lease session tokens and fencing verification to protect against stale workers.
 * 4. Safe release of only owned leases (never evicts newer takeover leases).
 * 5. 2dsphere true 50-metre proximity deduplication.
 * 6. Deterministic global total order for competing concurrent reports.
 * 7. Safe crash recovery sweeps reusing the existing XP ledger.
 */

import crypto from 'node:crypto'
import Report from '../models/Report.js'
import SpatialLease from '../models/SpatialLease.js'
import User from '../models/User.js'
import { awardXP } from './xpLedgerService.js'
import { checkAndAwardBadges } from './badgeService.js'

export const GRID_STEP = 0.0005 // approx 55m in latitude
export const LEASE_TTL_MS = 5000 // 5 seconds
export const PROXIMITY_METRES = 50 // 50-metre deduplication radius

/**
 * Returns integer cell identifier for a coordinate.
 * @param {number} lng
 * @param {number} lat
 * @param {number} [step=GRID_STEP]
 * @returns {string} e.g. "cell_157892_41203"
 */
export function getCellKey(lng, lat, step = GRID_STEP) {
  const gx = Math.floor(lng / step)
  const gy = Math.floor(lat / step)
  return `cell_${gx}_${gy}`
}

/**
 * Returns the 9-cell Moore neighborhood covering the coordinate and its 50m radius,
 * sorted strictly lexicographically to prevent deadlocks.
 * @param {number} lng
 * @param {number} lat
 * @param {number} [step=GRID_STEP]
 * @returns {string[]} 9 sorted unique cell keys
 */
export function getNeighborhoodKeys(lng, lat, step = GRID_STEP) {
  const gx = Math.floor(lng / step)
  const gy = Math.floor(lat / step)
  const keys = []

  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      keys.push(`cell_${gx + dx}_${gy + dy}`)
    }
  }

  return keys.sort()
}

/**
 * Attempts to acquire distributed leases over a set of cell keys in lexicographical order.
 * Uses leaseToken and fencingVersion to serialize concurrent workers.
 * If contention occurs, rolls back previously acquired keys and yields.
 *
 * @param {import('mongoose').Types.ObjectId} reportId
 * @param {string} leaseToken
 * @param {string[]} sortedKeys
 * @param {number} [ttlMs=LEASE_TTL_MS]
 * @returns {Promise<{ success: boolean, acquired: string[], contendingKey?: string }>}
 */
export async function acquireSpatialLeases(
  reportId,
  leaseToken,
  sortedKeys,
  ttlMs = LEASE_TTL_MS,
) {
  const acquired = []
  const now = new Date()
  const expiresAt = new Date(Date.now() + ttlMs)

  for (const key of sortedKeys) {
    try {
      const lease = await SpatialLease.findOneAndUpdate(
        {
          _id: key,
          $or: [
            { leaseExpiresAt: { $lt: now } }, // Expired/stale lease
            { reportId, leaseToken }, // Re-entrant with same token
          ],
        },
        {
          $set: {
            reportId,
            leaseToken,
            leaseExpiresAt: expiresAt,
          },
          $inc: { fencingVersion: 1 },
        },
        { upsert: true, returnDocument: 'after' },
      )

      if (!lease) {
        // Contention: key currently held by an unexpired lease
        await releaseSpatialLeases(reportId, leaseToken, acquired)
        return { success: false, acquired: [], contendingKey: key }
      }

      acquired.push(key)
    } catch (err) {
      // Code 11000 duplicate key error indicates concurrent insert collision
      await releaseSpatialLeases(reportId, leaseToken, acquired)
      return { success: false, acquired: [], contendingKey: key }
    }
  }

  return { success: true, acquired }
}

/**
 * Fencing check: verifies that the worker still holds all leases with its exact leaseToken.
 * Protects against stale workers attempting to finalize after lease takeover.
 *
 * @param {import('mongoose').Types.ObjectId} reportId
 * @param {string} leaseToken
 * @param {string[]} sortedKeys
 * @returns {Promise<boolean>}
 */
export async function verifyLeaseOwnership(reportId, leaseToken, sortedKeys) {
  const count = await SpatialLease.countDocuments({
    _id: { $in: sortedKeys },
    reportId,
    leaseToken,
    leaseExpiresAt: { $gt: new Date() },
  })
  return count === sortedKeys.length
}

/**
 * Safely releases acquired spatial leases.
 * Crucial: Only deletes leases that match this worker's reportId AND leaseToken,
 * preventing a delayed worker from deleting a newer worker's takeover lease.
 *
 * @param {import('mongoose').Types.ObjectId} reportId
 * @param {string} leaseToken
 * @param {string[]} keys
 */
export async function releaseSpatialLeases(reportId, leaseToken, keys) {
  if (!keys || keys.length === 0) return
  await SpatialLease.deleteMany({
    _id: { $in: keys },
    reportId,
    leaseToken,
  })
}

/**
 * Ingestion Gate: Creates a report with withheld base XP (settlementStatus: 'unsettled').
 * Immediately triggers spatial settlement.
 */
export async function createReport({
  reporterId,
  reporterUsername,
  type,
  title,
  description,
  coordinates,
  address = '',
  photoUrl = null,
  isSample = false,
}) {
  if (!Array.isArray(coordinates) || coordinates.length !== 2) {
    const err = new Error('Valid coordinates [longitude, latitude] are required')
    err.status = 400
    throw err
  }

  const [lng, lat] = coordinates

  // Anti-spam check: prevent exact duplicate submissions by same user within 15 minutes
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000)
  const recentDuplicate = await Report.findOne({
    reporterId,
    type,
    createdAt: { $gte: fifteenMinutesAgo },
    location: {
      $nearSphere: {
        $geometry: { type: 'Point', coordinates: [lng, lat] },
        $maxDistance: PROXIMITY_METRES,
      },
    },
  })

  if (recentDuplicate) {
    return {
      isDuplicate: true,
      report: recentDuplicate,
      awardedBaseXP: 0,
      message: 'You have already reported a similar issue at this location recently.',
    }
  }

  // Phase 1: Ingestion — insert with withheld XP
  const report = await Report.create({
    reporterId,
    reporterUsername,
    type,
    title,
    description,
    location: {
      type: 'Point',
      coordinates: [lng, lat],
    },
    address,
    photoUrl,
    status: 'open',
    settlementStatus: 'unsettled',
    isPrimary: false,
    primaryReportId: null,
    baseXPAwarded: false,
    corroborationCount: 0,
    isSample: Boolean(isSample),
  })

  // Phase 2: Settle immediately
  const settlementResult = await settleReport(report._id)

  const updatedReport = await Report.findById(report._id)
  return {
    isDuplicate: false,
    report: updatedReport,
    awardedBaseXP: settlementResult.awardedBaseXP || 0,
    settlementStatus: updatedReport.settlementStatus,
    isPrimary: updatedReport.isPrimary,
  }
}

/**
 * Phase 2: Spatial Settlement Election.
 * Coordinates across neighbouring cells using sorted multi-cell leases and fencing verification.
 * Base XP is strictly withheld until primary settlement is final.
 *
 * @param {import('mongoose').Types.ObjectId | string} reportId
 * @returns {Promise<{ settled: boolean, status: string, isPrimary: boolean, awardedBaseXP: number, primaryReportId?: string, fencedOut?: boolean }>}
 */
export async function settleReport(reportId) {
  const report = await Report.findById(reportId)
  if (!report) {
    throw new Error('Report not found for settlement')
  }

  // Idempotency: if already settled, return existing state
  if (report.settlementStatus !== 'unsettled') {
    return {
      settled: true,
      status: report.settlementStatus,
      isPrimary: report.isPrimary,
      awardedBaseXP: report.baseXPAwarded ? 30 : 0,
      primaryReportId: report.primaryReportId ? report.primaryReportId.toString() : null,
    }
  }

  const [lng, lat] = report.location.coordinates
  const neighborhoodKeys = getNeighborhoodKeys(lng, lat)
  const leaseToken = crypto.randomUUID()

  // Retry acquisition with bounded jittered backoff
  let leaseAcquired = false
  const maxRetries = 6

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const res = await acquireSpatialLeases(report._id, leaseToken, neighborhoodKeys)
    if (res.success) {
      leaseAcquired = true
      break
    }
    // Exponential jitter backoff: 40ms, 80ms, 160ms...
    const delay = Math.floor(40 * Math.pow(2, attempt) + Math.random() * 30)
    await new Promise((r) => setTimeout(r, delay))
  }

  if (!leaseAcquired) {
    // If leases could not be acquired within retry budget, leave unsettled for background reconciler
    return {
      settled: false,
      status: 'unsettled',
      isPrimary: false,
      awardedBaseXP: 0,
    }
  }

  try {
    // 1. Check if an active finalized primary incident exists within 50 metres
    const existingFinalPrimary = await Report.findOne({
      _id: { $ne: report._id },
      status: { $in: ['open', 'in_review'] },
      settlementStatus: 'final_primary',
      location: {
        $nearSphere: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: PROXIMITY_METRES,
        },
      },
    })

    if (existingFinalPrimary) {
      // Fencing check: verify worker still owns leases
      const stillOwned = await verifyLeaseOwnership(report._id, leaseToken, neighborhoodKeys)
      if (!stillOwned) {
        return { settled: false, status: 'unsettled', isPrimary: false, awardedBaseXP: 0, fencedOut: true }
      }

      // Corroborate established primary
      report.settlementStatus = 'final_corroboration'
      report.isPrimary = false
      report.primaryReportId = existingFinalPrimary._id
      report.finalizedAt = new Date()
      await report.save()

      // Post-write fencing verification: ensure leases were continuously held across the write
      const postWriteOwned = await verifyLeaseOwnership(report._id, leaseToken, neighborhoodKeys)
      if (!postWriteOwned) {
        await Report.updateOne(
          { _id: report._id, settlementStatus: 'final_corroboration' },
          { $set: { settlementStatus: 'unsettled', isPrimary: false, finalizedAt: null, primaryReportId: null } },
        )
        return { settled: false, status: 'unsettled', isPrimary: false, awardedBaseXP: 0, fencedOut: true }
      }

      // Increment primary incident's corroboration count
      await Report.updateOne(
        { _id: existingFinalPrimary._id },
        { $inc: { corroborationCount: 1 } },
      )

      await releaseSpatialLeases(report._id, leaseToken, neighborhoodKeys)

      return {
        settled: true,
        status: 'final_corroboration',
        isPrimary: false,
        primaryReportId: existingFinalPrimary._id.toString(),
        awardedBaseXP: 0,
      }
    }

    // 2. No finalized primary exists: evaluate candidate cohort within 50 metres
    const candidateReports = await Report.find({
      status: { $in: ['open', 'in_review'] },
      settlementStatus: 'unsettled',
      location: {
        $nearSphere: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: PROXIMITY_METRES,
        },
      },
    })

    // In-memory sort ensures deterministic (createdAt, _id) ordering regardless of geo query planner
    candidateReports.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() ||
        a._id.toString().localeCompare(b._id.toString()),
    )

    // Find senior report in cohort by global total order
    const seniorReport = candidateReports[0] || report

    // Fencing check: verify worker still owns leases before finalization
    const stillOwned = await verifyLeaseOwnership(report._id, leaseToken, neighborhoodKeys)
    if (!stillOwned) {
      return { settled: false, status: 'unsettled', isPrimary: false, awardedBaseXP: 0, fencedOut: true }
    }

    if (seniorReport._id.toString() === report._id.toString()) {
      // This report is senior: FINALIZATION POINT
      report.settlementStatus = 'final_primary'
      report.isPrimary = true
      report.finalizedAt = new Date()

      // Synchronize corroboration count from any early corroborating reports
      const earlyCorroborations = await Report.countDocuments({
        primaryReportId: report._id,
        settlementStatus: 'final_corroboration',
      })
      report.corroborationCount = earlyCorroborations
      await report.save()

      // Post-write fencing verification: confirm all 9 leases were continuously held across the write
      const postWriteOwned = await verifyLeaseOwnership(report._id, leaseToken, neighborhoodKeys)
      if (!postWriteOwned) {
        // Lease was lost/stolen during write window: atomically roll back to prevent split-brain primary
        await Report.updateOne(
          { _id: report._id, settlementStatus: 'final_primary' },
          { $set: { settlementStatus: 'unsettled', isPrimary: false, finalizedAt: null } },
        )
        return {
          settled: false,
          status: 'unsettled',
          isPrimary: false,
          awardedBaseXP: 0,
          fencedOut: true,
        }
      }

      // Safe to release leases now that primary status is verified and final
      await releaseSpatialLeases(report._id, leaseToken, neighborhoodKeys)

      // Award 30 base XP via existing ledger (subject to daily cap)
      let awardedXP = 0
      try {
        const tx = await awardXP({
          userId: report.reporterId,
          requestedAmount: 30,
          source: 'action_submission',
          sourceId: report._id.toString(),
          idempotencyKey: `report_submit_${report._id}`,
          isCapExempt: false,
        })
        awardedXP = tx.awardedXP
        report.baseXPAwarded = true
        report.baseXPTxId = tx.txId
        await report.save()
      } catch (xpErr) {
        console.error('[ReportService] Error awarding base XP:', xpErr.message)
      }

      return {
        settled: true,
        status: 'final_primary',
        isPrimary: true,
        awardedBaseXP: awardedXP,
      }
    } else {
      // Another candidate is senior: demote this report to corroboration of senior
      report.settlementStatus = 'final_corroboration'
      report.isPrimary = false
      report.primaryReportId = seniorReport._id
      report.finalizedAt = new Date()
      await report.save()

      // Post-write fencing verification
      const postWriteOwned = await verifyLeaseOwnership(report._id, leaseToken, neighborhoodKeys)
      if (!postWriteOwned) {
        await Report.updateOne(
          { _id: report._id, settlementStatus: 'final_corroboration' },
          { $set: { settlementStatus: 'unsettled', isPrimary: false, finalizedAt: null, primaryReportId: null } },
        )
        return {
          settled: false,
          status: 'unsettled',
          isPrimary: false,
          awardedBaseXP: 0,
          fencedOut: true,
        }
      }

      await releaseSpatialLeases(report._id, leaseToken, neighborhoodKeys)

      return {
        settled: true,
        status: 'final_corroboration',
        isPrimary: false,
        primaryReportId: seniorReport._id.toString(),
        awardedBaseXP: 0,
      }
    }
  } finally {
    // Clean up leases if not yet released
    await releaseSpatialLeases(report._id, leaseToken, neighborhoodKeys)
  }
}

let isReconciling = false

/**
 * Reconciler Sweeper: Idempotent crash recovery for in-flight reports and awards.
 * Includes in-process re-entrancy lock to prevent overlapping worker runs.
 */
export async function reconcileReports() {
  if (isReconciling) {
    return { reconciledCount: 0, skipped: true }
  }

  isReconciling = true
  let reconciledCount = 0

  try {
    // 1. Recover unsettled reports older than 5 seconds
    const staleUnsettled = await Report.find({
      settlementStatus: 'unsettled',
      createdAt: { $lt: new Date(Date.now() - 5000) },
    }).limit(20)

    for (const r of staleUnsettled) {
      try {
        await settleReport(r._id)
        reconciledCount++
      } catch (err) {
        console.error('[ReconcileReports] Error settling report:', r._id, err.message)
      }
    }

    // 2. Recover final_primary reports where base XP award crashed before completion
    const missingBaseXP = await Report.find({
      settlementStatus: 'final_primary',
      baseXPAwarded: false,
    }).limit(20)

    for (const r of missingBaseXP) {
      try {
        const tx = await awardXP({
          userId: r.reporterId,
          requestedAmount: 30,
          source: 'action_submission',
          sourceId: r._id.toString(),
          idempotencyKey: `report_submit_${r._id}`,
          isCapExempt: false,
        })
        r.baseXPAwarded = true
        r.baseXPTxId = tx.txId
        await r.save()
        reconciledCount++
      } catch (err) {
        console.error('[ReconcileReports] Error recovering base XP:', r._id, err.message)
      }
    }

    // 3. Clean up any expired spatial leases
    await SpatialLease.deleteMany({
      leaseExpiresAt: { $lt: new Date() },
    })

    return { reconciledCount, skipped: false }
  } finally {
    isReconciling = false
  }
}

/**
 * Admin resolution / status transition workflow.
 * Enforces server-side validation, idempotent 50 XP cap-exempt bonus upon resolution,
 * and strict separation of estimated vs. measured litres saved.
 */
export async function updateReportStatus({
  reportId,
  adminId,
  status,
  adminNotes = '',
  measuredLitresSaved = undefined,
}) {
  const allowedStatuses = ['open', 'in_review', 'resolved', 'closed']
  if (!allowedStatuses.includes(status)) {
    const err = new Error(`Invalid status: ${status}. Must be one of ${allowedStatuses.join(', ')}`)
    err.status = 400
    throw err
  }

  const report = await Report.findById(reportId)
  if (!report) {
    const err = new Error('Report not found')
    err.status = 404
    throw err
  }

  // Prevent illegal transition from closed back to open unless explicitly reviewed
  if (report.status === 'closed' && status !== 'closed' && !adminNotes) {
    const err = new Error('Reopening a closed report requires an administrative note')
    err.status = 400
    throw err
  }

  const previousStatus = report.status
  const isTransitionToResolved = status === 'resolved' && previousStatus !== 'resolved'

  report.status = status
  report.reviewedBy = adminId
  report.reviewedAt = new Date()
  if (adminNotes) {
    report.adminNotes = adminNotes
  }

  let awardedResolutionXP = 0

  if (status === 'resolved') {
    report.resolvedAt = new Date()

    // Metered water savings validation
    if (measuredLitresSaved !== undefined && measuredLitresSaved !== null) {
      const litresNum = Number(measuredLitresSaved)
      if (isNaN(litresNum) || litresNum < 0) {
        const err = new Error('Measured litres saved must be a non-negative number')
        err.status = 400
        throw err
      }
      report.measuredLitresSaved = litresNum
      report.impactType = 'metered_measurement'
      report.impactHonestyLabel = 'Verified Meter Reading'
    }

    // Award 50 cap-exempt bonus XP to primary reporter only once (idempotent)
    if (!report.resolutionXPAwarded && report.isPrimary) {
      try {
        const tx = await awardXP({
          userId: report.reporterId,
          requestedAmount: 50,
          source: 'action_verification',
          sourceId: report._id.toString(),
          idempotencyKey: `report_resolve_${report._id}`,
          isCapExempt: true,
        })
        report.resolutionXPAwarded = true
        report.resolutionXPTxId = tx.txId
        awardedResolutionXP = tx.awardedXP
      } catch (xpErr) {
        console.error('[ReportService] Error awarding resolution XP:', xpErr.message)
      }
    }
  }

  await report.save()

  // Evaluate badge eligibility for the original reporter on genuine transition to resolved
  let newBadges = []
  if (isTransitionToResolved) {
    try {
      newBadges = await checkAndAwardBadges(report.reporterId)
    } catch (badgeErr) {
      console.error('[ReportService] Error evaluating badges on report resolution:', badgeErr.message)
    }
  }

  return {
    report,
    awardedResolutionXP,
    newBadges,
  }
}

/**
 * Public-safe report projection helper.
 */
export function toPublicReport(doc) {
  if (!doc) return null
  return {
    _id: doc._id,
    reporterUsername: doc.reporterUsername,
    type: doc.type,
    title: doc.title,
    description: doc.description,
    location: doc.location,
    address: doc.address || '',
    photoUrl: doc.photoUrl || null,
    status: doc.status,
    settlementStatus: doc.settlementStatus,
    isPrimary: doc.isPrimary,
    primaryReportId: doc.primaryReportId,
    corroborationCount: doc.corroborationCount || 0,
    upvotes: doc.upvotes || 0,
    impactType: doc.impactType,
    estimatedLitresPerHour: doc.estimatedLitresPerHour || 0,
    measuredLitresSaved: doc.measuredLitresSaved || 0,
    impactHonestyLabel: doc.impactHonestyLabel,
    impactAssumptions: doc.impactAssumptions || '',
    resolvedAt: doc.resolvedAt || null,
    createdAt: doc.createdAt,
    isSample: Boolean(doc.isSample),
  }
}

/**
 * Queries reports with filtering, pagination, and geospatial bounds.
 * Excludes sample data from real community aggregations by default.
 */
export async function getReports({
  type,
  status,
  lng,
  lat,
  radius = 50000, // 50km default
  bbox,
  includeSample = false,
  page = 1,
  limit = 20,
}) {
  const query = {}

  if (type) {
    query.type = type
  }

  if (status) {
    if (status === 'active') {
      query.status = { $in: ['open', 'in_review'] }
    } else {
      query.status = status
    }
  }

  // Filter sample data
  if (includeSample !== true && includeSample !== 'true') {
    query.isSample = false
  }

  // Geospatial filter: bounding box or radius
  if (bbox) {
    // bbox format: minLng,minLat,maxLng,maxLat
    const parts = bbox.split(',').map(Number)
    if (parts.length === 4 && parts.every((n) => !isNaN(n))) {
      const [minLng, minLat, maxLng, maxLat] = parts
      query.location = {
        $geoWithin: {
          $box: [
            [minLng, minLat],
            [maxLng, maxLat],
          ],
        },
      }
    }
  } else if (lng !== undefined && lat !== undefined && !isNaN(Number(lng)) && !isNaN(Number(lat))) {
    query.location = {
      $nearSphere: {
        $geometry: {
          type: 'Point',
          coordinates: [Number(lng), Number(lat)],
        },
        $maxDistance: Number(radius) || 50000,
      },
    }
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1)
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20))
  const skip = (pageNum - 1) * limitNum

  const [docs, total] = await Promise.all([
    Report.find(query).skip(skip).limit(limitNum),
    Report.countDocuments(query),
  ])

  return {
    reports: docs.map(toPublicReport),
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum) || 1,
  }
}

/**
 * Gets single report by ID with public projection.
 */
export async function getReportById(reportId) {
  const report = await Report.findById(reportId)
  if (!report) return null
  return toPublicReport(report)
}
