/**
 * Report Routes — AquaLoop Phase 4 Step 2
 *
 * Exposes endpoints for civic water reporting, map views, and administrative review.
 */

import express from 'express'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { handleReportPhotoUpload } from '../middleware/uploadMiddleware.js'
import {
  handleCreateReport,
  handleGetReports,
  handleGetReportById,
  handleUpdateReportStatus,
} from '../controllers/reportController.js'

const router = express.Router()

// Public / optional-auth read endpoints
router.get('/', handleGetReports)
router.get('/:id', handleGetReportById)

// Authenticated citizen report submission (with optional sanitized photo upload)
router.post('/', requireAuth, handleReportPhotoUpload, handleCreateReport)

// Admin-only review and status transitions
router.patch('/:id/status', requireAuth, requireRole('admin'), handleUpdateReportStatus)

export default router
