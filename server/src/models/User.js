/**
 * User model — AquaLoop Phase 2
 *
 * Security notes:
 * - passwordHash is NEVER returned in API responses (select: false)
 * - email is lowercased and trimmed before save
 * - All XP/level/badges are server-controlled; client never sends them
 * - role is assigned server-side only
 */

import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 12

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username must be at most 30 characters'],
      match: [/^[a-zA-Z0-9_]+$/, 'Username may only contain letters, numbers, and underscores'],
      unique: true,
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email address'],
      unique: true,
    },

    // Never returned in queries — select:false
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },

    role: {
      type: String,
      enum: ['citizen', 'admin'],
      default: 'citizen',
    },

    // Avatar — Cloudinary URL (Phase 4); null until set
    avatar: {
      type: String,
      default: null,
    },

    // ── Game state — server-controlled, never client-trusted ──────
    // XP and level are computed/awarded exclusively on the server.
    // Client displays values returned from /auth/me or other endpoints.
    xp: {
      type: Number,
      default: 0,
      min: 0,
    },
    level: {
      type: Number,
      default: 1,
      min: 1,
    },
    streak: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastActiveDate: {
      type: Date,
      default: null,
    },
    badges: [
      {
        badgeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Badge' },
        earnedAt: { type: Date, default: Date.now },
      },
    ],

    // ── Aggregate stats — labelled "self-reported" where appropriate
    totalWaterSavedLitres: { type: Number, default: 0 },
    actionsLogged:         { type: Number, default: 0 },
    reportsSubmitted:      { type: Number, default: 0 },
  },
  {
    timestamps: true,   // adds createdAt, updatedAt
    toJSON: {
      virtuals: true,
      // Remove sensitive fields when serialising to JSON
      transform(_doc, ret) {
        delete ret.passwordHash
        delete ret.__v
        return ret
      },
    },
  },
)

// ── Indexes ───────────────────────────────────────────────────
// Note: email and username indexes are created via unique: true in schema definition
userSchema.index({ xp: -1 })      // for leaderboard queries (Phase 3)

// ── Pre-save hook: hash password if modified ──────────────────
userSchema.pre('save', async function () {
  if (!this.isModified('passwordHash')) return
  // passwordHash field stores the raw password temporarily before this hook runs
  this.passwordHash = await bcrypt.hash(this.passwordHash, SALT_ROUNDS)
})

// ── Instance method: verify password ─────────────────────────
userSchema.methods.verifyPassword = async function (plaintext) {
  // passwordHash must be explicitly selected when calling this
  return bcrypt.compare(plaintext, this.passwordHash)
}

// ── Safe public projection ────────────────────────────────────
// Use this to return user data without sensitive fields
userSchema.statics.publicFields = function () {
  return '-passwordHash -__v'
}

const User = mongoose.model('User', userSchema)
export default User
