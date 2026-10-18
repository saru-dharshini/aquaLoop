/**
 * AquaLoop Demo User Seeding Script — Phase 2
 *
 * Populates two demo accounts for local testing and evaluation:
 *   1. Citizen account:
 *      Email:    citizen@aqualoop.local
 *      Password: DemoCitizen123!
 *      Role:     citizen
 *
 *   2. Admin account:
 *      Email:    admin@aqualoop.local
 *      Password: DemoAdmin123!
 *      Role:     admin
 *
 * ⚠️  FOR DEVELOPMENT AND LOCAL DEMO USE ONLY.
 *     Never use in production. Never commit production credentials.
 *
 * Run:
 *   npm run seed --prefix server
 */

import dotenv from 'dotenv'
import mongoose from 'mongoose'
import User from '../models/User.js'

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aqualoop'

const DEMO_USERS = [
  {
    username: 'democitizen',
    email: 'citizen@aqualoop.local',
    password: 'DemoCitizen123!',
    role: 'citizen',
    xp: 250,
    level: 2,
    streak: 3,
  },
  {
    username: 'demoadmin',
    email: 'admin@aqualoop.local',
    password: 'DemoAdmin123!',
    role: 'admin',
    xp: 1200,
    level: 5,
    streak: 12,
  },
]

async function seed() {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Refusing to run demo seed script in production environment.')
    process.exit(1)
  }

  console.log(`[Seed] Connecting to MongoDB at ${MONGODB_URI}…`)
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
  } catch (err) {
    console.error('❌ Could not connect to MongoDB:', err.message)
    console.error('\nEnsure local MongoDB or Atlas cluster is reachable.')
    process.exit(1)
  }

  console.log('[Seed] Connected. Seeding demo accounts…')

  for (const demo of DEMO_USERS) {
    const existing = await User.findOne({ email: demo.email })
    if (existing) {
      console.log(`ℹ️  Account already exists: ${demo.email} (${demo.role}) — skipping.`)
      continue
    }

    const user = new User({
      username: demo.username,
      email: demo.email,
      passwordHash: demo.password, // Pre-save hook hashes this
      role: demo.role,
      xp: demo.xp,
      level: demo.level,
      streak: demo.streak,
    })

    await user.save()
    console.log(`✅ Created ${demo.role}: ${demo.email} (Password: ${demo.password})`)
  }

  console.log('\n[Seed] Complete! You can now log in using the demo accounts.')
  await mongoose.disconnect()
  process.exit(0)
}

seed().catch((err) => {
  console.error('[Seed] Error:', err)
  process.exit(1)
})
