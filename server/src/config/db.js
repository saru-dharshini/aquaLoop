/**
 * Database connection — AquaLoop Phase 2
 *
 * Supports both local MongoDB Community Server and MongoDB Atlas M0.
 * Set MONGODB_URI in .env.  If unset, falls back to local MongoDB on
 * the default port 27017.
 *
 * Local MongoDB setup (free, no account needed):
 *   https://www.mongodb.com/try/download/community
 *   Default URI: mongodb://localhost:27017/aqualoop
 *
 * MongoDB Atlas M0 (free cloud, account required):
 *   https://cloud.mongodb.com → Create Free Cluster → Connect → Drivers
 *   URI pattern: mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/aqualoop
 *
 * The application starts even without a database — routes that need
 * DB access will return 503 until the connection is ready.
 */

import mongoose from 'mongoose'

const DEFAULT_URI = 'mongodb://localhost:27017/aqualoop'

export async function connectDB() {
  const uri = process.env.MONGODB_URI || DEFAULT_URI
  const isAtlas = uri.startsWith('mongodb+srv')

  mongoose.set('strictQuery', true)

  mongoose.connection.on('connecting', () => {
    console.log(`[DB] Connecting to ${isAtlas ? 'MongoDB Atlas' : 'local MongoDB'}…`)
  })
  mongoose.connection.on('connected', () => {
    console.log(`[DB] Connected ✓  (${mongoose.connection.name})`)
  })
  mongoose.connection.on('error', (err) => {
    console.error('[DB] Connection error:', err.message)
  })
  mongoose.connection.on('disconnected', () => {
    console.warn('[DB] Disconnected')
  })

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,   // fail fast during startup
      socketTimeoutMS: 45_000,
    })
  } catch (err) {
    console.error('\n[DB] ❌ Could not connect to MongoDB.\n')
    console.error('Reason:', err.message)
    console.error(`
─────────────────────────────────────────────────────────────
  AquaLoop needs MongoDB to run the database routes.
  Auth, user management, and data storage will not work
  until a connection is established.

  Option 1 — Local MongoDB Community Server (free, no account):
    Download: https://www.mongodb.com/try/download/community
    Start:    mongod --dbpath ./data/db
    URI:      mongodb://localhost:27017/aqualoop  (default)

  Option 2 — MongoDB Atlas M0 (free cloud, needs an account):
    https://cloud.mongodb.com
    Add to server/.env:
    MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/aqualoop

  The server will continue without DB — health check still works.
─────────────────────────────────────────────────────────────
`)
    // Do NOT exit — let the server run so /health still responds
  }
}

export function isConnected() {
  return mongoose.connection.readyState === 1
}

export default mongoose
