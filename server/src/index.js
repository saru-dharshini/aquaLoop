/**
 * AquaLoop — Express Server Entry Point (Phase 1)
 *
 * Phase 1 scope:
 *   - Basic Express setup with CORS, Morgan, rate-limiting
 *   - GET /api/v1/health endpoint
 *   - Environment-variable driven configuration
 *   - No database, no auth, no business logic yet (Phase 2+)
 *
 * Run: npm run dev   (uses node --watch)
 * ENV: Copy .env.example to .env and fill in values
 */

import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'

// Load environment variables from .env (never committed)
dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000
const NODE_ENV = process.env.NODE_ENV || 'development'

// ── Middleware ────────────────────────────────────────────────
// HTTP request logger (compact in production, verbose in dev)
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'))

// CORS — allow requests from Vite dev server and production client
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. curl, mobile apps)
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`))
      }
    },
    credentials: true, // required for httpOnly cookies (Phase 2)
  }),
)

// Parse incoming JSON bodies
app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({ extended: true, limit: '10kb' }))

// Global rate limiter — 200 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
})
app.use('/api', limiter)

// ── Routes ────────────────────────────────────────────────────

/**
 * GET /api/v1/health
 * Returns server status. Used by uptime monitors and CI checks.
 * No authentication required.
 */
app.get('/api/v1/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'aqualoop-api',
    version: '0.1.0',
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  })
})

// Root path — brief API description
app.get('/', (_req, res) => {
  res.status(200).json({
    message: 'AquaLoop API',
    docs: 'See PLAN.md for the full API specification.',
    health: '/api/v1/health',
  })
})

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
  const status = err.status || err.statusCode || 500
  const message =
    NODE_ENV === 'production' && status === 500
      ? 'Internal server error'
      : err.message || 'Internal server error'

  if (status >= 500) {
    console.error('[ERROR]', err)
  }

  res.status(status).json({ error: message })
})

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
  ╭─────────────────────────────────────╮
  │  AquaLoop API — ${NODE_ENV.padEnd(12)}       │
  │  Listening on http://localhost:${PORT}  │
  │  Health: /api/v1/health             │
  ╰─────────────────────────────────────╯
  `)
})

export default app
