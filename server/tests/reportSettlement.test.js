/**
 * Report Settlement & Spatial Lease Tests — AquaLoop Phase 4 Step 1
 *
 * Covers:
 * - Model & 2dsphere index definitions and GeoJSON validation.
 * - Format-aware image sanitisation (JPEG APP1 removal, PNG ancillary chunk removal).
 * - Multi-cell lexicographical lease acquisition, duplicate-key race handling, and rollback.
 * - Lease expiry, takeover, and fencing protection against stale workers.
 * - Safe release of only owned leases (leaseToken matching).
 * - Concurrent nearby reports within 50 metres and duplicate settlement.
 * - Withheld base XP until finalisation and XP ledger idempotency.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'

process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-secret-key-at-least-32-characters-long-aqua'

import User from '../src/models/User.js'
import Report from '../src/models/Report.js'
import SpatialLease from '../src/models/SpatialLease.js'
import XPTransaction from '../src/models/XPTransaction.js'
import UserDailyXP from '../src/models/UserDailyXP.js'
import {
  createReport,
  settleReport,
  reconcileReports,
  getNeighborhoodKeys,
  acquireSpatialLeases,
  verifyLeaseOwnership,
  releaseSpatialLeases,
} from '../src/services/reportService.js'
import {
  detectImageFormat,
  sanitizeJPEG,
  sanitizePNG,
  sanitizeImageBuffer,
} from '../src/utils/imageSanitizer.js'

let mongoServer

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create()
  const mongoUri = mongoServer.getUri()
  await mongoose.connect(mongoUri)
  await Report.syncIndexes()
})

afterAll(async () => {
  await mongoose.disconnect()
  if (mongoServer) {
    await mongoServer.stop()
  }
})

beforeEach(async () => {
  await User.deleteMany({})
  await Report.deleteMany({})
  await SpatialLease.deleteMany({})
  await XPTransaction.deleteMany({})
  await UserDailyXP.deleteMany({})
})

async function createCitizen(username = 'wateruser', email = 'citizen@aqualoop.local') {
  return User.create({
    username,
    email,
    passwordHash: 'hashed_pw',
    role: 'citizen',
    xp: 0,
    level: 1,
    verifiedWaterSavedLitres: 0,
  })
}

// Minimal valid 1x1 JPEG buffer with dummy APP1 EXIF segment and SOF0 frame header
function createSampleJPEGWithEXIF() {
  const soi = Buffer.from([0xff, 0xd8])
  // APP1 marker (0xFF 0xE1), length = 8 (2 bytes length + 6 bytes payload)
  const app1 = Buffer.from([0xff, 0xe1, 0x00, 0x08, 0x45, 0x78, 0x69, 0x66, 0x00, 0x00])
  // DQT marker (0xFF 0xDB), length = 5
  const dqt = Buffer.from([0xff, 0xdb, 0x00, 0x05, 0x00, 0x01, 0x02])
  // SOF0 marker (0xFF 0xC0), length = 11 (8-bit precision, 1x1 dimensions, 1 component)
  const sof0 = Buffer.from([
    0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00,
  ])
  // SOS marker (0xFF 0xDA), payload, EOI (0xFF 0xD9)
  const sos = Buffer.from([0xff, 0xda, 0x00, 0x04, 0x00, 0x00, 0xaa, 0xbb, 0xff, 0xd9])
  return Buffer.concat([soi, app1, dqt, sof0, sos])
}

// Minimal valid PNG buffer with text metadata chunk (tEXt) and IDAT data
function createSamplePNGWithMetadata() {
  const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  // IHDR chunk: length = 13
  const ihdr = Buffer.concat([
    Buffer.from([0x00, 0x00, 0x00, 0x0d]), // length 13
    Buffer.from('IHDR', 'ascii'),
    Buffer.alloc(13), // 13 bytes data
    Buffer.from([0x00, 0x00, 0x00, 0x00]), // crc
  ])
  // IDAT chunk: length = 4
  const idat = Buffer.concat([
    Buffer.from([0x00, 0x00, 0x00, 0x04]),
    Buffer.from('IDAT', 'ascii'),
    Buffer.from([0x78, 0x9c, 0x01, 0x00]),
    Buffer.from([0x00, 0x00, 0x00, 0x00]), // crc
  ])
  // tEXt chunk: length = 11 (Author=Aqua)
  const textChunk = Buffer.concat([
    Buffer.from([0x00, 0x00, 0x00, 0x0b]),
    Buffer.from('tEXt', 'ascii'),
    Buffer.from('Author=Aqua', 'ascii'),
    Buffer.from([0x12, 0x34, 0x56, 0x78]), // crc
  ])
  // IEND chunk: length = 0
  const iend = Buffer.concat([
    Buffer.from([0x00, 0x00, 0x00, 0x00]),
    Buffer.from('IEND', 'ascii'),
    Buffer.from([0xae, 0x42, 0x60, 0x82]), // crc
  ])
  return Buffer.concat([header, ihdr, idat, textChunk, iend])
}

describe('Report Model Schema & GeoJSON Index Definitions', () => {
  it('enforces approved categories and settlement states', async () => {
    const user = await createCitizen()

    const validReport = await Report.create({
      reporterId: user._id,
      reporterUsername: user.username,
      type: 'public_leak',
      title: 'Water pipe leak on main road',
      description: 'Continuous water outflow observed near bus depot',
      location: { type: 'Point', coordinates: [78.9629, 20.5937] },
      status: 'open',
      settlementStatus: 'unsettled',
    })

    expect(validReport._id).toBeDefined()
    expect(validReport.type).toBe('public_leak')
    expect(validReport.settlementStatus).toBe('unsettled')
    expect(validReport.isPrimary).toBe(false)

    // Rejects invalid category
    await expect(
      Report.create({
        reporterId: user._id,
        reporterUsername: user.username,
        type: 'invalid_category',
        title: 'Bad title',
        description: 'Bad description with enough characters',
        location: { type: 'Point', coordinates: [78.9629, 20.5937] },
      }),
    ).rejects.toThrow()
  })

  it('validates GeoJSON coordinates in [longitude, latitude] order and rejects invalid ranges', async () => {
    const user = await createCitizen()

    // Invalid latitude (> 90)
    await expect(
      Report.create({
        reporterId: user._id,
        reporterUsername: user.username,
        type: 'community_wastage',
        title: 'Overflowing tank',
        description: 'Tank overflowing into the street',
        location: { type: 'Point', coordinates: [78.9629, 95.0] },
      }),
    ).rejects.toThrow('Coordinates must be [longitude, latitude]')

    // Invalid longitude (> 180)
    await expect(
      Report.create({
        reporterId: user._id,
        reporterUsername: user.username,
        type: 'dry_public_tap',
        title: 'Dry tap at park',
        description: 'Tap has no water pressure for 3 days',
        location: { type: 'Point', coordinates: [185.0, 20.5] },
      }),
    ).rejects.toThrow('Coordinates must be [longitude, latitude]')
  })

  it('confirms 2dsphere index is present and active for proximity queries', async () => {
    const indexes = await Report.collection.indexes()
    const has2dSphere = indexes.some(
      (idx) => idx.key && idx.key.location === '2dsphere',
    )
    expect(has2dSphere).toBe(true)
  })
})

describe('Format-Aware Image Metadata Sanitisation', () => {
  it('detects JPEG and PNG magic bytes correctly and rejects WebP, SVG, and plain text', () => {
    const jpegBuf = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46])
    const pngBuf = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    const webpBuf = Buffer.from('RIFF....WEBPVP8 ', 'ascii')
    const svgBuf = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>', 'utf8')
    const textBuf = Buffer.from('Just plain text file content', 'utf8')

    expect(detectImageFormat(jpegBuf)).toBe('jpeg')
    expect(detectImageFormat(pngBuf)).toBe('png')
    expect(detectImageFormat(webpBuf)).toBeNull()
    expect(detectImageFormat(svgBuf)).toBeNull()
    expect(detectImageFormat(textBuf)).toBeNull()
  })

  it('strips EXIF/APP1 metadata from JPEG buffers', () => {
    const rawJPEG = createSampleJPEGWithEXIF()
    expect(rawJPEG.includes(Buffer.from([0xff, 0xe1]))).toBe(true)

    const sanitized = sanitizeJPEG(rawJPEG)
    expect(sanitized[0]).toBe(0xff)
    expect(sanitized[1]).toBe(0xd8)
    expect(sanitized.includes(Buffer.from([0xff, 0xe1]))).toBe(false)
  })

  it('strips ancillary metadata chunks (tEXt) from PNG buffers', () => {
    const rawPNG = createSamplePNGWithMetadata()
    expect(rawPNG.includes(Buffer.from('tEXt', 'ascii'))).toBe(true)

    const sanitized = sanitizePNG(rawPNG)
    expect(sanitized.includes(Buffer.from('IHDR', 'ascii'))).toBe(true)
    expect(sanitized.includes(Buffer.from('IEND', 'ascii'))).toBe(true)
    expect(sanitized.includes(Buffer.from('tEXt', 'ascii'))).toBe(false)
  })

  it('rejects unsupported formats, malformed data, and oversized buffers with status codes', () => {
    const webpBuf = Buffer.from('RIFF....WEBP', 'ascii')
    expect(() => sanitizeImageBuffer(webpBuf)).toThrow('Only JPEG and PNG images are accepted')

    const oversizedBuf = Buffer.alloc(5 * 1024 * 1024 + 10)
    expect(() => sanitizeImageBuffer(oversizedBuf)).toThrow('Image size exceeds 5MB limit')

    const corruptJPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe1, 0xff, 0xff])
    expect(() => sanitizeImageBuffer(corruptJPEG)).toThrow('Malformed or unparseable image data')
  })

  it('drops trailing polyglot bytes after JPEG EOI and rejects missing SOF or EOI', () => {
    // 1. Polyglot trailing data after EOI
    const validJPEG = createSampleJPEGWithEXIF()
    const trailingMaliciousBytes = Buffer.from('<script>alert("pwn")</script>', 'utf8')
    const polyglotJPEG = Buffer.concat([validJPEG, trailingMaliciousBytes])

    const sanitized = sanitizeJPEG(polyglotJPEG)
    expect(sanitized.includes(trailingMaliciousBytes)).toBe(false)
    expect(sanitized[sanitized.length - 2]).toBe(0xff)
    expect(sanitized[sanitized.length - 1]).toBe(0xd9)

    // 2. Missing SOF header
    const noSOF = Buffer.concat([
      Buffer.from([0xff, 0xd8]),
      Buffer.from([0xff, 0xda, 0x00, 0x04, 0x00, 0x00, 0xaa, 0xbb, 0xff, 0xd9]),
    ])
    expect(() => sanitizeJPEG(noSOF)).toThrow('missing SOF frame header')

    // 3. Truncated JPEG missing EOI
    const truncatedJPEG = Buffer.concat([
      Buffer.from([0xff, 0xd8]),
      Buffer.from([0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00]),
      Buffer.from([0xff, 0xda, 0x00, 0x04, 0x00, 0x00, 0xaa, 0xbb]), // no FF D9
    ])
    expect(() => sanitizeJPEG(truncatedJPEG)).toThrow('missing EOI marker')
  })

  it('rejects PNG missing IHDR as first chunk or missing IDAT/IEND', () => {
    const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

    // Missing IHDR first
    const badFirstChunk = Buffer.concat([
      pngHeader,
      Buffer.from([0x00, 0x00, 0x00, 0x00]),
      Buffer.from('tEXt', 'ascii'),
      Buffer.from([0x00, 0x00, 0x00, 0x00]),
    ])
    expect(() => sanitizePNG(badFirstChunk)).toThrow('first chunk must be IHDR')

    // Missing IDAT
    const noIDAT = Buffer.concat([
      pngHeader,
      Buffer.from([0x00, 0x00, 0x00, 0x0d]),
      Buffer.from('IHDR', 'ascii'),
      Buffer.alloc(13),
      Buffer.from([0x00, 0x00, 0x00, 0x00]),
      Buffer.from([0x00, 0x00, 0x00, 0x00]),
      Buffer.from('IEND', 'ascii'),
      Buffer.from([0xae, 0x42, 0x60, 0x82]),
    ])
    expect(() => sanitizePNG(noIDAT)).toThrow('missing IDAT chunk')
  })
})

describe('SpatialLease Model, Fencing & Contention Protocol', () => {
  it('generates 9 unique neighborhood keys sorted lexicographically', () => {
    const lng = 78.9629
    const lat = 20.5937
    const keys = getNeighborhoodKeys(lng, lat)

    expect(keys).toHaveLength(9)
    const sortedCopy = [...keys].sort()
    expect(keys).toEqual(sortedCopy)

    const uniqueKeys = new Set(keys)
    expect(uniqueKeys.size).toBe(9)
  })

  it('handles duplicate-key lease race and rolls back acquired keys on contention', async () => {
    const report1Id = new mongoose.Types.ObjectId()
    const report2Id = new mongoose.Types.ObjectId()
    const token1 = 'token_worker_1'
    const token2 = 'token_worker_2'
    const keys = ['cell_100_200', 'cell_100_201', 'cell_100_202']

    // Report 1 acquires all 3 keys
    const res1 = await acquireSpatialLeases(report1Id, token1, keys, 5000)
    expect(res1.success).toBe(true)
    expect(res1.acquired).toEqual(keys)

    // Report 2 attempts to acquire an overlapping set: ['cell_100_201', 'cell_100_202', 'cell_100_203']
    const overlappingKeys = ['cell_100_201', 'cell_100_202', 'cell_100_203'].sort()
    const res2 = await acquireSpatialLeases(report2Id, token2, overlappingKeys, 5000)
    expect(res2.success).toBe(false)
    expect(res2.contendingKey).toBe('cell_100_201')

    // Confirm Report 2 rolled back its acquired keys completely
    const report2Leases = await SpatialLease.find({ reportId: report2Id })
    expect(report2Leases).toHaveLength(0)

    // Report 1 safely releases its own leases
    await releaseSpatialLeases(report1Id, token1, keys)
    const remainingLeases = await SpatialLease.find({ reportId: report1Id })
    expect(remainingLeases).toHaveLength(0)
  })

  it('evicts expired lease and increments fencing version on takeover', async () => {
    const report1Id = new mongoose.Types.ObjectId()
    const report2Id = new mongoose.Types.ObjectId()
    const token1 = 'token_stale'
    const token2 = 'token_active'
    const key = ['cell_200_300']

    // Worker 1 acquires lease with past expiry (simulating crashed or delayed worker)
    await SpatialLease.create({
      _id: key[0],
      reportId: report1Id,
      leaseToken: token1,
      fencingVersion: 1,
      leaseExpiresAt: new Date(Date.now() - 1000), // expired 1s ago
    })

    // Worker 2 takes over the expired lease
    const res2 = await acquireSpatialLeases(report2Id, token2, key, 5000)
    expect(res2.success).toBe(true)

    const updatedDoc = await SpatialLease.findById(key[0])
    expect(updatedDoc.reportId.toString()).toBe(report2Id.toString())
    expect(updatedDoc.leaseToken).toBe(token2)
    expect(updatedDoc.fencingVersion).toBe(2) // Fencing version incremented
  })

  it('fences out stale workers from finalising or releasing leases after takeover', async () => {
    const report1Id = new mongoose.Types.ObjectId()
    const report2Id = new mongoose.Types.ObjectId()
    const token1 = 'stale_worker_token'
    const token2 = 'new_worker_token'
    const keys = ['cell_300_400']

    // Worker 1 acquired lease, but it expired
    await SpatialLease.create({
      _id: keys[0],
      reportId: report1Id,
      leaseToken: token1,
      fencingVersion: 1,
      leaseExpiresAt: new Date(Date.now() - 500),
    })

    // Worker 2 takes over lease
    await acquireSpatialLeases(report2Id, token2, keys, 5000)

    // Worker 1 wakes up from pause and checks lease ownership
    const isWorker1StillOwner = await verifyLeaseOwnership(report1Id, token1, keys)
    expect(isWorker1StillOwner).toBe(false) // Fenced out!

    // Worker 1 attempts to release lease — safe release MUST NOT delete Worker 2's lease
    await releaseSpatialLeases(report1Id, token1, keys)

    const leaseStillPresent = await SpatialLease.findById(keys[0])
    expect(leaseStillPresent).not.toBeNull()
    expect(leaseStillPresent.leaseToken).toBe(token2) // Worker 2's lease was safely preserved
  })
})

describe('Duplicate Settlement Protocol & Withheld Base XP', () => {
  it('withholds base XP during ingestion; awards 30 XP only upon final_primary settlement', async () => {
    const citizen = await createCitizen('primary_citizen', 'pcitizen@aqua.local')

    // Submit report
    const res = await createReport({
      reporterId: citizen._id,
      reporterUsername: citizen.username,
      type: 'public_leak',
      title: 'Water pipe rupture on central avenue',
      description: 'Major leak observed near crossing. Potable water wasting.',
      coordinates: [78.9629, 20.5937],
    })

    expect(res.settlementStatus).toBe('final_primary')
    expect(res.isPrimary).toBe(true)
    expect(res.awardedBaseXP).toBe(30)

    const updatedUser = await User.findById(citizen._id)
    expect(updatedUser.xp).toBe(30)
  })

  it('corroborates active primary within 50 metres and awards 0 base XP', async () => {
    const c1 = await createCitizen('citizen_first', 'cfirst@aqua.local')
    const c2 = await createCitizen('citizen_second', 'csecond@aqua.local')

    // Report A settles as final_primary
    const resA = await createReport({
      reporterId: c1._id,
      reporterUsername: c1.username,
      type: 'public_leak',
      title: 'Broken pipeline near water pump',
      description: 'High pressure leak at municipal pumping station',
      coordinates: [78.9629, 20.5937],
    })

    expect(resA.report.settlementStatus).toBe('final_primary')
    expect(resA.report.isPrimary).toBe(true)

    // Report B submitted 28m away (0.00025 deg lat ≈ 27.7m)
    const resB = await createReport({
      reporterId: c2._id,
      reporterUsername: c2.username,
      type: 'public_leak',
      title: 'Water accumulating from broken pipe',
      description: 'Puddle spreading to roadway from pump station',
      coordinates: [78.9629, 20.59395],
    })

    expect(resB.report.settlementStatus).toBe('final_corroboration')
    expect(resB.report.isPrimary).toBe(false)
    expect(resB.report.primaryReportId.toString()).toBe(resA.report._id.toString())
    expect(resB.awardedBaseXP).toBe(0)

    // Citizen 2 balance remains 0
    const updatedC2 = await User.findById(c2._id)
    expect(updatedC2.xp).toBe(0)

    // Primary corroborationCount incremented
    const refreshedA = await Report.findById(resA.report._id)
    expect(refreshedA.corroborationCount).toBe(1)
  })

  it('concurrent reports in adjacent cells within 50m serialize to exactly 1 primary', async () => {
    const c1 = await createCitizen('citizen_adj1', 'c1@aqua.local')
    const c2 = await createCitizen('citizen_adj2', 'c2@aqua.local')

    // Create both reports unsettled across adjacent cell boundary (33m apart)
    const r1 = await Report.create({
      reporterId: c1._id,
      reporterUsername: c1.username,
      type: 'public_leak',
      title: 'Leak left cell',
      description: 'Gushing pipe at corner of main street',
      location: { type: 'Point', coordinates: [78.9629, 20.5937] },
      status: 'open',
      settlementStatus: 'unsettled',
      isPrimary: false,
    })

    const r2 = await Report.create({
      reporterId: c2._id,
      reporterUsername: c2.username,
      type: 'public_leak',
      title: 'Leak right cell',
      description: 'Same gushing pipe viewed from other corner',
      location: { type: 'Point', coordinates: [78.9632, 20.5938] },
      status: 'open',
      settlementStatus: 'unsettled',
      isPrimary: false,
    })

    // Settle concurrently
    await Promise.all([settleReport(r1._id), settleReport(r2._id)])

    const r1After = await Report.findById(r1._id)
    const r2After = await Report.findById(r2._id)

    const primaries = [r1After, r2After].filter((r) => r.settlementStatus === 'final_primary')
    const corroborations = [r1After, r2After].filter(
      (r) => r.settlementStatus === 'final_corroboration',
    )

    expect(primaries).toHaveLength(1)
    expect(corroborations).toHaveLength(1)
    expect(corroborations[0].primaryReportId.toString()).toBe(primaries[0]._id.toString())
    expect(primaries[0].baseXPAwarded).toBe(true)
    expect(corroborations[0].baseXPAwarded).toBe(false)
  })

  it('reconciler idempotently recovers crashed final_primary without duplicate XP', async () => {
    const citizen = await createCitizen('recovery_user', 'rec@aqua.local')

    // Simulate crash after primary finalization before awardXP
    const report = await Report.create({
      reporterId: citizen._id,
      reporterUsername: citizen.username,
      type: 'public_leak',
      title: 'Broken pipeline near school',
      description: 'Clean drinking water spilling over school gate',
      location: { type: 'Point', coordinates: [78.9629, 20.5937] },
      status: 'open',
      settlementStatus: 'final_primary',
      isPrimary: true,
      baseXPAwarded: false,
    })

    expect(citizen.xp).toBe(0)

    // Run reconciliation sweep
    const sweepResult = await reconcileReports()
    expect(sweepResult.reconciledCount).toBeGreaterThanOrEqual(1)

    const updatedReport = await Report.findById(report._id)
    expect(updatedReport.baseXPAwarded).toBe(true)
    expect(updatedReport.baseXPTxId).toBeDefined()

    const updatedCitizen = await User.findById(citizen._id)
    expect(updatedCitizen.xp).toBe(30)

    // Second sweep: completely idempotent
    await reconcileReports()
    const secondCitizen = await User.findById(citizen._id)
    expect(secondCitizen.xp).toBe(30)
  })

  it('fences out worker and rolls back finalisation if lease is taken over during write window', async () => {
    const citizen = await createCitizen('fenced_worker', 'fenced@aqua.local')

    const report = await Report.create({
      reporterId: citizen._id,
      reporterUsername: citizen.username,
      type: 'public_leak',
      title: 'Pipe rupture before takeover',
      description: 'Clean drinking water spilling over sidewalk',
      location: { type: 'Point', coordinates: [78.9629, 20.5937] },
      status: 'open',
      settlementStatus: 'unsettled',
      isPrimary: false,
      baseXPAwarded: false,
    })

    // Hook Report.prototype.save once to simulate concurrent worker stealing leases during the save operation
    const originalSave = Report.prototype.save
    let takeoverDone = false
    Report.prototype.save = async function (...args) {
      if (
        this._id.toString() === report._id.toString() &&
        this.settlementStatus === 'final_primary' &&
        !takeoverDone
      ) {
        takeoverDone = true
        // Simulate concurrent takeover: overwrite the spatial leases with a new token
        const neighborhoodKeys = getNeighborhoodKeys(78.9629, 20.5937)
        await SpatialLease.updateMany(
          { _id: { $in: neighborhoodKeys } },
          { $set: { leaseToken: 'stealing_worker_token', reportId: new mongoose.Types.ObjectId() } },
        )
      }
      return originalSave.apply(this, args)
    }

    try {
      const result = await settleReport(report._id)
      expect(result.settled).toBe(false)
      expect(result.fencedOut).toBe(true)
      expect(result.awardedBaseXP).toBe(0)

      // Confirm DB record was rolled back to unsettled and no XP was awarded
      const reportInDb = await Report.findById(report._id)
      expect(reportInDb.settlementStatus).toBe('unsettled')
      expect(reportInDb.isPrimary).toBe(false)
      expect(reportInDb.baseXPAwarded).toBe(false)

      const userInDb = await User.findById(citizen._id)
      expect(userInDb.xp).toBe(0)
    } finally {
      Report.prototype.save = originalSave
    }
  })
})
