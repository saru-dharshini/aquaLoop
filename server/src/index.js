/**
 * AquaLoop — Express Server Entry Point (Phase 2)
 *
 * Security enhancements:
 *   - Production fail-fast startup check via validateEnv()
 *   - Content-Type enforcement (415 on non-JSON auth requests)
 *   - Body size limits with clean 413 error handling
 *   - Helmet security headers
 *   - MongoDB connection with fallback guidance
 *   - Cookie parser for HTTP-only JWT auth
 */

import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import path from 'node:path'
import fs from 'node:fs'

import { validateEnv } from './config/env.js'
import { connectDB, isConnected } from './config/db.js'
import { requireJsonContent } from './middleware/contentType.js'
import authRoutes from './routes/authRoutes.js'
import missionRoutes from './routes/missionRoutes.js'
import actionRoutes from './routes/actionRoutes.js'
import gameRoutes from './routes/gameRoutes.js'
import reportRoutes from './routes/reportRoutes.js'
import { handleGetLeaderboard } from './controllers/gameController.js'
import { reconcileReports } from './services/reportService.js'

// Load environment variables from .env
dotenv.config()

// ── Startup Environment Validation (Fail Fast) ────────────────
const envConfig = validateEnv()
const { isProduction, nodeEnv, port } = envConfig

const app = express()

// ── Security Headers ──────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
)

// ── Logging ───────────────────────────────────────────────────
if (nodeEnv !== 'test') {
  app.use(morgan(isProduction ? 'combined' : 'dev'))
}

// ── CORS ──────────────────────────────────────────────────────
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. curl, test runners, mobile)
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`))
      }
    },
    credentials: true, // required for httpOnly cookies
  }),
)

// ── Cookie Parser ─────────────────────────────────────────────
app.use(cookieParser(envConfig.cookieSecret))

// ── Request Body Parser (Strict 10kb limit) ────────────────────
app.use(express.json({ limit: '10kb' }))

// Global rate limiter — 300 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
})
app.use('/api', globalLimiter)

// ── Routes ────────────────────────────────────────────────────

// Auth API — strictly requires application/json for state-changing requests
app.use('/api/v1/auth', requireJsonContent, authRoutes)

// Gamification APIs — Phase 3B
app.use('/api/v1/missions', missionRoutes)
app.use('/api/v1/actions', actionRoutes)
app.use('/api/v1/game', gameRoutes)
app.get('/api/v1/leaderboard', handleGetLeaderboard)

// Civic Reporting APIs & Static Uploads — Phase 4
app.use(
  '/uploads/reports',
  express.static(path.resolve(process.cwd(), 'uploads', 'reports'), {
    maxAge: '1d',
    etag: true,
  }),
)
app.use('/api/v1/reports', reportRoutes)

/**
 * GET /api/v1/health
 * Returns server and database status. Used by uptime monitors.
 */
app.get('/api/v1/health', (_req, res) => {
  const dbStatus = isConnected() ? 'connected' : 'disconnected'
  res.status(200).json({
    status: 'ok',
    service: 'aqualoop-api',
    version: '0.2.1',
    environment: nodeEnv,
    database: dbStatus,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  })
})

// ── Serve Frontend SPA in Production (if built) ───────────────
const clientDistCandidates = [
  path.resolve(process.cwd(), 'client', 'dist'),
  path.resolve(process.cwd(), '..', 'client', 'dist'),
]
const clientDistPath = clientDistCandidates.find((p) => {
  try {
    return fs.existsSync(path.join(p, 'index.html'))
  } catch {
    return false
  }
})

if (isProduction && clientDistPath) {
  app.use(express.static(clientDistPath))
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next()
    }
    res.sendFile(path.join(clientDistPath, 'index.html'))
  })
} else {
  // Root path — brief API description
  app.get('/', (_req, res) => {
    res.status(200).json({
      message: 'AquaLoop API',
      version: '0.2.1',
      docs: 'See PLAN.md for the full API specification.',
      health: '/api/v1/health',
    })
  })
}

// ── 404 handler ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.originalUrl,
  })
})

// ── Global error handler ──────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  // CORS error
  if (err.message && err.message.startsWith('CORS:')) {
    return res.status(403).json({ error: err.message })
  }

  // Payload too large (body-parser 10kb limit exceeded)
  if (err.status === 413 || err.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'Payload too large: Request body exceeds the 10kb limit.',
    })
  }

  // Malformed JSON body
  if (err.status === 400 && err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({
      error: 'Malformed JSON payload in request body.',
    })
  }

  const status = err.status || err.statusCode || 500
  const message =
    isProduction && status === 500
      ? 'Internal server error'
      : err.message || 'Internal server error'

  if (status >= 500 && nodeEnv !== 'test') {
    console.error('[ERROR]', err)
  }

  res.status(status).json({ error: message })
})

// ── Background Reconciliation Sweeper ─────────────────────────
const RECONCILIATION_INTERVAL_MS = 30000 // Run every 30 seconds
let reconciliationTimer = null

export function startReconciliation() {
  if (!reconciliationTimer && nodeEnv !== 'test') {
    reconciliationTimer = setInterval(async () => {
      try {
        await reconcileReports()
      } catch (err) {
        console.error('[Reconciler] Background sweep failed:', err.message)
      }
    }, RECONCILIATION_INTERVAL_MS)
  }
}

export function stopReconciliation() {
  if (reconciliationTimer) {
    clearInterval(reconciliationTimer)
    reconciliationTimer = null
  }
}

// ── Start ─────────────────────────────────────────────────────
// Only start listening if not running in a test environment
let serverInstance = null

if (nodeEnv !== 'test') {
  connectDB()
  startReconciliation()
  serverInstance = app.listen(port, () => {
    console.log(`
  ╭─────────────────────────────────────╮
  │  AquaLoop API — ${nodeEnv.padEnd(12)}       │
  │  Listening on http://localhost:${port}  │
  │  Health: /api/v1/health             │
  ╰─────────────────────────────────────╯
  `)
  })

  // Graceful shutdown handling
  const shutdown = () => {
    stopReconciliation()
    if (serverInstance) {
      serverInstance.close(() => {
        process.exit(0)
      })
    }
  }
  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)
}

export default app
