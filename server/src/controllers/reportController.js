/**
 * Report Controller — AquaLoop Phase 4 Step 2
 *
 * Implements public and authenticated civic water issue report endpoints:
 * - POST /api/v1/reports: Ingestion gate with withheld XP & spatial settlement.
 * - GET /api/v1/reports: Safe public listing with filtering, pagination, & sample data exclusion.
 * - GET /api/v1/reports/:id: Public details for an issue.
 * - PATCH /api/v1/reports/:id/status: Admin-only status review with resolution XP award.
 */

import mongoose from 'mongoose'
import {
  createReport,
  getReports,
  getReportById,
  updateReportStatus,
  toPublicReport,
} from '../services/reportService.js'

const VALID_CATEGORIES = [
  'public_leak',
  'water_contamination',
  'community_wastage',
  'dry_public_tap',
]

/**
 * POST /api/v1/reports
 * Authenticated submission of a new civic water report.
 */
export async function handleCreateReport(req, res, next) {
  try {
    let { type, title, description, coordinates, address, isSample } = req.body

    // Parse coordinates if sent as string via multipart/form-data
    if (typeof coordinates === 'string') {
      try {
        coordinates = JSON.parse(coordinates)
      } catch {
        const err = new Error('Coordinates must be a valid JSON array: [longitude, latitude]')
        err.status = 400
        throw err
      }
    }

    if (!VALID_CATEGORIES.includes(type)) {
      const err = new Error(
        `Invalid category: ${type}. Must be one of: ${VALID_CATEGORIES.join(', ')}`,
      )
      err.status = 400
      throw err
    }

    if (!title || typeof title !== 'string' || title.trim().length < 3 || title.trim().length > 100) {
      const err = new Error('Title must be between 3 and 100 characters')
      err.status = 400
      throw err
    }

    if (
      !description ||
      typeof description !== 'string' ||
      description.trim().length < 10 ||
      description.trim().length > 1000
    ) {
      const err = new Error('Description must be between 10 and 1000 characters')
      err.status = 400
      throw err
    }

    if (
      !Array.isArray(coordinates) ||
      coordinates.length !== 2 ||
      typeof coordinates[0] !== 'number' ||
      typeof coordinates[1] !== 'number' ||
      isNaN(coordinates[0]) ||
      isNaN(coordinates[1]) ||
      coordinates[0] < -180 ||
      coordinates[0] > 180 ||
      coordinates[1] < -90 ||
      coordinates[1] > 90
    ) {
      const err = new Error('Coordinates must be [longitude, latitude] within valid geographic ranges')
      err.status = 400
      throw err
    }

    // Ingestion gate: citizen cannot forge reporterId, settlementStatus, isPrimary, or XP state.
    // Ordinary citizens cannot create sample reports; only admins or sample/demo accounts may set isSample.
    const wantsSample = isSample === true || isSample === 'true'
    const isAuthorizedForSample = req.user.role === 'admin' || Boolean(req.user.isSample)

    if (wantsSample && !isAuthorizedForSample) {
      const err = new Error('Only administrators can create sample reports')
      err.status = 403
      throw err
    }

    const effectiveIsSample = Boolean(req.user.isSample || (isAuthorizedForSample && wantsSample))

    const result = await createReport({
      reporterId: req.user._id,
      reporterUsername: req.user.username,
      type,
      title: title.trim(),
      description: description.trim(),
      coordinates,
      address: typeof address === 'string' ? address.trim() : '',
      photoUrl: req.sanitizedPhotoUrl || null,
      isSample: effectiveIsSample,
    })

    const publicReport = toPublicReport(result.report)

    res.status(201).json({
      success: true,
      report: publicReport,
      isDuplicate: result.isDuplicate,
      awardedBaseXP: result.awardedBaseXP,
      settlementStatus: result.settlementStatus,
      isPrimary: result.isPrimary,
      message: result.message || 'Report submitted successfully.',
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/v1/reports
 * Safe public browsing of civic water reports.
 */
export async function handleGetReports(req, res, next) {
  try {
    const { type, status, lng, lat, radius, bbox, includeSample, page, limit } = req.query

    const result = await getReports({
      type,
      status,
      lng,
      lat,
      radius,
      bbox,
      includeSample,
      page,
      limit,
    })

    res.status(200).json({
      success: true,
      ...result,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/v1/reports/:id
 * Safe public details for a single issue.
 */
export async function handleGetReportById(req, res, next) {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const err = new Error('Invalid report ID format')
      err.status = 400
      throw err
    }

    const report = await getReportById(id)
    if (!report) {
      const err = new Error('Report not found')
      err.status = 404
      throw err
    }

    res.status(200).json({
      success: true,
      report,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * PATCH /api/v1/reports/:id/status
 * Admin-only status review with resolution XP award.
 */
export async function handleUpdateReportStatus(req, res, next) {
  try {
    const { id } = req.params
    const { status, adminNotes, measuredLitresSaved } = req.body

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const err = new Error('Invalid report ID format')
      err.status = 400
      throw err
    }

    const result = await updateReportStatus({
      reportId: id,
      adminId: req.user._id,
      status,
      adminNotes,
      measuredLitresSaved,
    })

    res.status(200).json({
      success: true,
      report: toPublicReport(result.report),
      awardedResolutionXP: result.awardedResolutionXP,
      newBadges: result.newBadges || [],
      message: `Report status updated to ${status}.`,
    })
  } catch (err) {
    next(err)
  }
}
