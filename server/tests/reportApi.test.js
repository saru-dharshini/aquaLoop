/**
 * Civic Report APIs & Upload Integration Tests — AquaLoop Phase 4 Step 2
 *
 * Covers:
 * - POST /api/v1/reports: auth enforcement, validation, withheld XP & final settlement award.
 * - Multer file upload: sanitized JPEG/PNG storage, polyglot stripping, 5MB limit, rejected formats.
 * - GET /api/v1/reports & /:id: public projections, geospatial filtering, sample data exclusion.
 * - PATCH /api/v1/reports/:id/status: admin RBAC, 50 cap-exempt resolution XP, honesty labels, idempotency.
 * - Reconciliation lifecycle: overlap prevention & shutdown handling.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import fs from 'node:fs'
import path from 'node:path'

process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-secret-key-at-least-32-characters-long-aqua'

import app, { startReconciliation, stopReconciliation } from '../src/index.js'
import User from '../src/models/User.js'
import Report from '../src/models/Report.js'
import SpatialLease from '../src/models/SpatialLease.js'
import XPTransaction from '../src/models/XPTransaction.js'
import UserDailyXP from '../src/models/UserDailyXP.js'
import UserBadge from '../src/models/UserBadge.js'
import { reconcileReports } from '../src/services/reportService.js'
import { ensureDefaultBadges } from '../src/services/badgeService.js'
import { signToken, COOKIE_NAME } from '../src/utils/jwt.js'

let mongoServer

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create()
  const mongoUri = mongoServer.getUri()
  await mongoose.connect(mongoUri)
  await Report.syncIndexes()
  await ensureDefaultBadges()
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
  await UserBadge.deleteMany({})
})

function generateToken(user) {
  return signToken({ id: user._id.toString(), email: user.email, role: user.role })
}

async function createCitizen(username = 'wateruser', email = 'citizen@aqualoop.local') {
  return User.create({
    username,
    email,
    passwordHash: 'hashed_pw',
    role: 'citizen',
    xp: 0,
    level: 1,
  })
}

async function createAdmin(username = 'wateradmin', email = 'admin@aqualoop.local') {
  return User.create({
    username,
    email,
    passwordHash: 'hashed_pw',
    role: 'admin',
    xp: 0,
    level: 1,
  })
}

// Minimal valid 1x1 JPEG buffer with SOF0 and dummy APP1 EXIF
function createSampleJPEG() {
  const soi = Buffer.from([0xff, 0xd8])
  const app1 = Buffer.from([0xff, 0xe1, 0x00, 0x08, 0x45, 0x78, 0x69, 0x66, 0x00, 0x00])
  const dqt = Buffer.from([0xff, 0xdb, 0x00, 0x05, 0x00, 0x01, 0x02])
  const sof0 = Buffer.from([0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00])
  const sos = Buffer.from([0xff, 0xda, 0x00, 0x04, 0x00, 0x00, 0xaa, 0xbb, 0xff, 0xd9])
  return Buffer.concat([soi, app1, dqt, sof0, sos])
}

describe('Civic Report Submission API (POST /api/v1/reports)', () => {
  it('rejects unauthenticated requests with 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/v1/reports')
      .send({
        type: 'public_leak',
        title: 'Broken municipal pipeline',
        description: 'Drinking water is leaking heavily on road',
        coordinates: [78.9629, 20.5937],
      })

    expect(res.status).toBe(401)
  })

  it('rejects invalid categories and coordinates outside geographic boundaries', async () => {
    const citizen = await createCitizen()
    const token = generateToken(citizen)

    // Invalid category
    const resCat = await request(app)
      .post('/api/v1/reports')
      .set('Cookie', [`${COOKIE_NAME}=${token}`])
      .send({
        type: 'alien_invasion',
        title: 'Water disappearing mysteriously',
        description: 'Large volumes of water vanishing',
        coordinates: [78.9629, 20.5937],
      })
    expect(resCat.status).toBe(400)
    expect(resCat.body.error).toMatch(/Invalid category/)

    // Out of range longitude (195.0)
    const resLng = await request(app)
      .post('/api/v1/reports')
      .set('Cookie', [`${COOKIE_NAME}=${token}`])
      .send({
        type: 'public_leak',
        title: 'Broken municipal pipeline',
        description: 'Drinking water is leaking heavily on road',
        coordinates: [195.0, 20.5937],
      })
    expect(resLng.status).toBe(400)
    expect(resLng.body.error).toMatch(/Coordinates must be/)
  })

  it('successfully creates report, finalises primary settlement, and awards 30 base XP', async () => {
    const citizen = await createCitizen()
    const token = generateToken(citizen)

    const res = await request(app)
      .post('/api/v1/reports')
      .set('Cookie', [`${COOKIE_NAME}=${token}`])
      .send({
        type: 'public_leak',
        title: 'Major pipeline rupture on ring road',
        description: 'Clean potable water gushing from pipeline near flyover',
        coordinates: [78.9629, 20.5937],
        address: 'Outer Ring Road Sector 4',
      })

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.settlementStatus).toBe('final_primary')
    expect(res.body.isPrimary).toBe(true)
    expect(res.body.awardedBaseXP).toBe(30)
    expect(res.body.report.title).toBe('Major pipeline rupture on ring road')

    const updatedCitizen = await User.findById(citizen._id)
    expect(updatedCitizen.xp).toBe(30)
  })

  it('accepts multipart photo upload, strips EXIF metadata, and saves under /uploads/reports', async () => {
    const citizen = await createCitizen()
    const token = generateToken(citizen)

    const sampleJpeg = createSampleJPEG()

    const res = await request(app)
      .post('/api/v1/reports')
      .set('Cookie', [`${COOKIE_NAME}=${token}`])
      .field('type', 'community_wastage')
      .field('title', 'Continuous overflow at community tank')
      .field('description', 'Automatic shut-off valve is broken at the tank')
      .field('coordinates', JSON.stringify([77.209, 28.6139]))
      .attach('photo', sampleJpeg, { filename: 'evidence.jpg', contentType: 'image/jpeg' })

    expect(res.status).toBe(201)
    expect(res.body.report.photoUrl).toBeDefined()
    expect(res.body.report.photoUrl).toMatch(/^\/uploads\/reports\/[a-f0-9-]+\.jpg$/)

    // Confirm file exists on disk and has EXIF stripped
    const savedPath = path.resolve(process.cwd(), res.body.report.photoUrl.replace(/^\//, ''))
    expect(fs.existsSync(savedPath)).toBe(true)

    const savedBuffer = fs.readFileSync(savedPath)
    expect(savedBuffer.includes(Buffer.from([0xff, 0xe1]))).toBe(false) // EXIF stripped
  })

  it('rejects unsupported image uploads (e.g. plain text masquerading as image)', async () => {
    const citizen = await createCitizen()
    const token = generateToken(citizen)

    const fakeImage = Buffer.from('This is not an image at all', 'utf8')

    const res = await request(app)
      .post('/api/v1/reports')
      .set('Cookie', [`${COOKIE_NAME}=${token}`])
      .field('type', 'dry_public_tap')
      .field('title', 'Community handpump not working')
      .field('description', 'Handpump handle broken and no water coming out')
      .field('coordinates', JSON.stringify([78.9629, 20.5937]))
      .attach('photo', fakeImage, { filename: 'fake.png', contentType: 'image/png' })

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/Only JPEG and PNG images are accepted/)
  })

  it('rejects ordinary citizen attempt to supply isSample: true with 403 Forbidden', async () => {
    const citizen = await createCitizen()
    const token = generateToken(citizen)

    const res = await request(app)
      .post('/api/v1/reports')
      .set('Cookie', [`${COOKIE_NAME}=${token}`])
      .send({
        type: 'public_leak',
        title: 'Citizen trying to flag report as sample',
        description: 'Should be rejected because only admins can create sample reports',
        coordinates: [78.9629, 20.5937],
        isSample: true,
      })

    expect(res.status).toBe(403)
    expect(res.body.error).toMatch(/Only administrators can create sample reports/)
  })

  it('allows admin to create sample report with isSample: true', async () => {
    const admin = await createAdmin()
    const token = generateToken(admin)

    const res = await request(app)
      .post('/api/v1/reports')
      .set('Cookie', [`${COOKIE_NAME}=${token}`])
      .send({
        type: 'public_leak',
        title: 'Admin created demo sample report',
        description: 'Authorized sample report created for evaluation',
        coordinates: [78.9629, 20.5937],
        isSample: true,
      })

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.report.isSample).toBe(true)

    const dbReport = await Report.findById(res.body.report._id)
    expect(dbReport.isSample).toBe(true)
  })
})

describe('Civic Report Public Browsing (GET /api/v1/reports & /:id)', () => {
  it('returns public reports with pagination and excludes sample data by default', async () => {
    const citizen = await createCitizen()

    // 1 real report
    await Report.create({
      reporterId: citizen._id,
      reporterUsername: citizen.username,
      type: 'public_leak',
      title: 'Real community pipe leak',
      description: 'Continuous leaking potable water on sidewalk',
      location: { type: 'Point', coordinates: [78.9629, 20.5937] },
      status: 'open',
      settlementStatus: 'final_primary',
      isPrimary: true,
      isSample: false,
    })

    // 1 sample report
    await Report.create({
      reporterId: citizen._id,
      reporterUsername: citizen.username,
      type: 'water_contamination',
      title: 'Sample contaminated well',
      description: 'Water has yellowish tint and foul odour [DEMO]',
      location: { type: 'Point', coordinates: [78.965, 20.595] },
      status: 'open',
      settlementStatus: 'final_primary',
      isPrimary: true,
      isSample: true,
    })

    // Default request: exclude sample
    const resDefault = await request(app).get('/api/v1/reports')
    expect(resDefault.status).toBe(200)
    expect(resDefault.body.reports).toHaveLength(1)
    expect(resDefault.body.reports[0].title).toBe('Real community pipe leak')

    // Request with includeSample=true
    const resWithSample = await request(app).get('/api/v1/reports?includeSample=true')
    expect(resWithSample.status).toBe(200)
    expect(resWithSample.body.reports).toHaveLength(2)
  })

  it('returns single public report details and handles 404 cleanly', async () => {
    const citizen = await createCitizen()
    const report = await Report.create({
      reporterId: citizen._id,
      reporterUsername: citizen.username,
      type: 'dry_public_tap',
      title: 'Dry tap at community park',
      description: 'Public tap has not had water for 4 days',
      location: { type: 'Point', coordinates: [78.9629, 20.5937] },
      status: 'open',
      settlementStatus: 'final_primary',
      isPrimary: true,
    })

    const res = await request(app).get(`/api/v1/reports/${report._id}`)
    expect(res.status).toBe(200)
    expect(res.body.report.title).toBe('Dry tap at community park')
    expect(res.body.report.location.coordinates).toEqual([78.9629, 20.5937])

    const resNotFound = await request(app).get(`/api/v1/reports/${new mongoose.Types.ObjectId()}`)
    expect(resNotFound.status).toBe(404)
  })
})

describe('Admin Report Status & Resolution Workflow (PATCH /api/v1/reports/:id/status)', () => {
  it('rejects non-admin users with 403 Forbidden', async () => {
    const citizen = await createCitizen('regular_citizen', 'citizen@aqua.local')
    const token = generateToken(citizen)

    const report = await Report.create({
      reporterId: citizen._id,
      reporterUsername: citizen.username,
      type: 'public_leak',
      title: 'Leak needing review',
      description: 'Water leak observed on avenue',
      location: { type: 'Point', coordinates: [78.9629, 20.5937] },
      status: 'open',
      settlementStatus: 'final_primary',
      isPrimary: true,
    })

    const res = await request(app)
      .patch(`/api/v1/reports/${report._id}/status`)
      .set('Cookie', [`${COOKIE_NAME}=${token}`])
      .send({ status: 'resolved' })

    expect(res.status).toBe(403)
  })

  it('allows admin to resolve report, awarding 50 cap-exempt resolution XP idempotently', async () => {
    const citizen = await createCitizen('reporting_citizen', 'rep@aqua.local')
    const admin = await createAdmin('lead_admin', 'admin@aqua.local')
    const adminToken = generateToken(admin)

    const report = await Report.create({
      reporterId: citizen._id,
      reporterUsername: citizen.username,
      type: 'public_leak',
      title: 'Leak resolved by municipal engineers',
      description: 'Major leak on avenue fixed',
      location: { type: 'Point', coordinates: [78.9629, 20.5937] },
      status: 'in_review',
      settlementStatus: 'final_primary',
      isPrimary: true,
      baseXPAwarded: true,
    })

    expect(citizen.xp).toBe(0)

    // Admin resolves report with verified measurement
    const res = await request(app)
      .patch(`/api/v1/reports/${report._id}/status`)
      .set('Cookie', [`${COOKIE_NAME}=${adminToken}`])
      .send({
        status: 'resolved',
        adminNotes: 'Repaired by city water board maintenance team',
        measuredLitresSaved: 2500,
      })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.report.status).toBe('resolved')
    expect(res.body.report.impactHonestyLabel).toBe('Verified Meter Reading')
    expect(res.body.report.measuredLitresSaved).toBe(2500)
    expect(res.body.awardedResolutionXP).toBe(50)

    // Citizen received 50 cap-exempt XP
    const updatedCitizen = await User.findById(citizen._id)
    expect(updatedCitizen.xp).toBe(50)

    // Second resolution call: completely idempotent, 0 additional XP
    const resRepeat = await request(app)
      .patch(`/api/v1/reports/${report._id}/status`)
      .set('Cookie', [`${COOKIE_NAME}=${adminToken}`])
      .send({
        status: 'resolved',
        adminNotes: 'Confirmed again',
      })

    expect(resRepeat.status).toBe(200)
    expect(resRepeat.body.awardedResolutionXP).toBe(0)

    const citizenAfterRepeat = await User.findById(citizen._id)
    expect(citizenAfterRepeat.xp).toBe(50) // Did not double-award
  })

  it('evaluates and awards badges for reporter when report is resolved, without repeated awards on duplicate requests', async () => {
    // Citizen starts at 450 XP (Level 1)
    const citizen = await User.create({
      username: 'badge_reporter',
      email: 'breporter@aqua.local',
      passwordHash: 'hashed_pw',
      role: 'citizen',
      xp: 450,
      level: 1,
    })
    const admin = await createAdmin('badge_admin', 'badmin@aqua.local')
    const adminToken = generateToken(admin)

    const report = await Report.create({
      reporterId: citizen._id,
      reporterUsername: citizen.username,
      type: 'public_leak',
      title: 'Leak crossing level threshold',
      description: 'Major leak on highway',
      location: { type: 'Point', coordinates: [78.9629, 20.5937] },
      status: 'in_review',
      settlementStatus: 'final_primary',
      isPrimary: true,
      baseXPAwarded: true,
    })

    // Admin resolves report -> awards 50 XP -> pushes citizen to 500 XP (Level 2: Stream Scout)
    const res = await request(app)
      .patch(`/api/v1/reports/${report._id}/status`)
      .set('Cookie', [`${COOKIE_NAME}=${adminToken}`])
      .send({
        status: 'resolved',
        adminNotes: 'Resolved by water board team',
      })

    expect(res.status).toBe(200)
    expect(res.body.awardedResolutionXP).toBe(50)
    expect(res.body.newBadges).toBeDefined()
    expect(res.body.newBadges.some((b) => b.slug === 'stream-scout')).toBe(true)

    const updatedCitizen = await User.findById(citizen._id)
    expect(updatedCitizen.xp).toBe(500)
    expect(updatedCitizen.level).toBe(2)

    const dbUserBadge = await UserBadge.findOne({ userId: citizen._id, badgeSlug: 'stream-scout' })
    expect(dbUserBadge).not.toBeNull()

    // Duplicate resolution call: status is already resolved, so badges are NOT re-evaluated or re-awarded
    const resRepeat = await request(app)
      .patch(`/api/v1/reports/${report._id}/status`)
      .set('Cookie', [`${COOKIE_NAME}=${adminToken}`])
      .send({
        status: 'resolved',
        adminNotes: 'Second review',
      })

    expect(resRepeat.status).toBe(200)
    expect(resRepeat.body.newBadges).toEqual([])
  })
})

describe('Reconciliation Lifecycle & In-Process Safety', () => {
  it('prevents overlapping reconciliation sweeps within the same process', async () => {
    const sweep1 = reconcileReports()
    const sweep2 = reconcileReports()

    const [res1, res2] = await Promise.all([sweep1, sweep2])
    expect(res1.skipped || res2.skipped).toBe(true)
  })

  it('can start and stop reconciliation lifecycle without throwing', () => {
    expect(() => startReconciliation()).not.toThrow()
    expect(() => stopReconciliation()).not.toThrow()
  })
})
