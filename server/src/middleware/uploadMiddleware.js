/**
 * Upload Middleware — AquaLoop Phase 4 Step 2
 *
 * Handles file uploads with:
 * 1. Multer memory storage (never leaves unvalidated files on disk).
 * 2. Pure-JS buffer inspection & metadata sanitisation (JPEG/PNG only).
 * 3. 5MB hard limit with clean 413 response.
 * 4. Random UUID filenames (guards against path traversal).
 * 5. Local storage under server/uploads/reports/ at ₹0 cost.
 */

import multer from 'multer'
import path from 'node:path'
import fs from 'node:fs'
import crypto from 'node:crypto'
import { sanitizeImageBuffer } from '../utils/imageSanitizer.js'

// Configure Multer with in-memory buffer storage
const storage = multer.memoryStorage()

const fileFilter = (_req, file, cb) => {
  // Initial MIME type pre-filter; full magic bytes inspection happens during sanitisation
  const allowedMimeTypes = ['image/jpeg', 'image/png']
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    const err = new Error('Invalid file type. Only JPEG and PNG images are accepted.')
    err.status = 400
    cb(err, false)
  }
}

export const multerUpload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter,
})

/**
 * Middleware that wraps multer single('photo') and sanitises the buffer before persisting.
 */
export function handleReportPhotoUpload(req, res, next) {
  const uploadSingle = multerUpload.single('photo')

  uploadSingle(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        const error = new Error('Image size exceeds 5MB limit')
        error.status = 413
        return next(error)
      }
      return next(err)
    }

    if (!req.file) {
      // Optional photo — continue to next handler
      return next()
    }

    try {
      // Perform format verification and metadata stripping
      const { sanitizedBuffer, extension } = sanitizeImageBuffer(req.file.buffer)

      // Generate random unguessable filename to prevent path traversal
      const filename = `${crypto.randomUUID()}.${extension}`
      const uploadsDir = path.resolve(process.cwd(), 'uploads', 'reports')

      await fs.promises.mkdir(uploadsDir, { recursive: true })
      const finalPath = path.join(uploadsDir, filename)

      // Write sanitised buffer to disk
      await fs.promises.writeFile(finalPath, sanitizedBuffer)

      // Expose public URL path for report model
      req.sanitizedPhotoUrl = `/uploads/reports/${filename}`
      next()
    } catch (sanitizationErr) {
      return next(sanitizationErr)
    }
  })
}
