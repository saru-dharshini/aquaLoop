/**
 * Badge Service — AquaLoop Phase 3B
 *
 * Handles badge catalogue seeding, criteria evaluation, and atomic duplicate-free unlocking.
 */

import Badge from '../models/Badge.js'
import UserBadge from '../models/UserBadge.js'
import User from '../models/User.js'
import UserMission from '../models/UserMission.js'
import Action from '../models/Action.js'

export const DEFAULT_BADGES = [
  {
    slug: 'first-drop',
    name: 'First Drop',
    description: 'Logged your first water-saving action.',
    tier: 'bronze',
    icon: 'Droplet',
    condition: { type: 'actions_count', threshold: 1 },
  },
  {
    slug: 'curious-stream',
    name: 'Curious Stream',
    description: 'Completed all beginner water literacy quizzes.',
    tier: 'bronze',
    icon: 'BookOpen',
    condition: { type: 'learning_count', threshold: 3 },
  },
  {
    slug: 'leak-hunter',
    name: 'Leak Hunter',
    description: 'Reported or repaired 3 verified pipeline leaks.',
    tier: 'silver',
    icon: 'Wrench',
    condition: { type: 'verified_count', threshold: 3 },
  },
  {
    slug: 'streak-week',
    name: '7-Day Flow',
    description: 'Conserved water for 7 consecutive days.',
    tier: 'silver',
    icon: 'Flame',
    condition: { type: 'streak_days', threshold: 7 },
  },
  {
    slug: 'stream-scout',
    name: 'Stream Scout',
    description: 'Advanced to Level 2 in the AquaLoop community.',
    tier: 'silver',
    icon: 'Shield',
    condition: { type: 'level', threshold: 2 },
  },
  {
    slug: 'greywater-guru',
    name: 'Greywater Guru',
    description: 'Diverted and reused greywater on 10 occasions.',
    tier: 'gold',
    icon: 'Sparkles',
    condition: { type: 'actions_count', threshold: 10 },
  },
  {
    slug: 'streak-month',
    name: 'Month of Rain',
    description: 'Maintained an unbroken 30-day conservation streak.',
    tier: 'gold',
    icon: 'Calendar',
    condition: { type: 'streak_days', threshold: 30 },
  },
  {
    slug: 'river-guardian',
    name: 'River Guardian',
    description: 'Advanced to Level 3 in the AquaLoop community.',
    tier: 'gold',
    icon: 'Award',
    condition: { type: 'level', threshold: 3 },
  },
  {
    slug: 'civic-sentinel',
    name: 'Civic Sentinel',
    description: 'Contributed to the resolution of 5 community water hazards.',
    tier: 'platinum',
    icon: 'ShieldCheck',
    condition: { type: 'verified_count', threshold: 5 },
  },
  {
    slug: 'ocean-guardian',
    name: 'Ocean Guardian',
    description: 'Attained the highest conservation honor in AquaLoop.',
    tier: 'platinum',
    icon: 'Crown',
    condition: { type: 'level', threshold: 4 },
  },
]

/**
 * Ensures initial default badges exist in database.
 */
export async function ensureDefaultBadges() {
  const count = await Badge.countDocuments({})
  if (count === 0) {
    await Badge.insertMany(DEFAULT_BADGES)
  }
}

/**
 * Gets all available badges.
 */
export async function getAllBadges() {
  await ensureDefaultBadges()
  return Badge.find({}).lean()
}

/**
 * Gets all badges unlocked by a specific citizen.
 */
export async function getUserBadges(userId) {
  const earned = await UserBadge.find({ userId }).lean()
  const slugs = earned.map((b) => b.badgeSlug)
  const badgeDocs = await Badge.find({ slug: { $in: slugs } }).lean()

  const earnedMap = new Map(earned.map((e) => [e.badgeSlug, e.earnedAt]))
  return badgeDocs.map((b) => ({
    ...b,
    earnedAt: earnedMap.get(b.slug) || null,
  }))
}

/**
 * Evaluates unlock criteria for a user and grants any newly earned badges.
 *
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @returns {Promise<Array<object>>} newly awarded badges
 */
export async function checkAndAwardBadges(userId) {
  await ensureDefaultBadges()

  const [user, existingBadges, completedQuizzesCount, verifiedActionsCount] =
    await Promise.all([
      User.findById(userId),
      UserBadge.find({ userId }).select('badgeSlug').lean(),
      UserMission.countDocuments({ userId, status: 'completed' }),
      Action.countDocuments({ userId, verificationStatus: 'verified' }),
    ])

  if (!user) return []

  const earnedSlugs = new Set(existingBadges.map((b) => b.badgeSlug))
  const allBadges = await Badge.find({}).lean()
  const newlyAwarded = []

  for (const badge of allBadges) {
    if (earnedSlugs.has(badge.slug)) continue

    let unlocked = false
    const { type, threshold } = badge.condition

    switch (type) {
      case 'actions_count':
        unlocked = (user.actionsLogged || 0) >= threshold
        break
      case 'learning_count':
        unlocked = completedQuizzesCount >= threshold
        break
      case 'streak_days':
        unlocked = (user.streak || 0) >= threshold
        break
      case 'level':
        unlocked = (user.level || 1) >= threshold
        break
      case 'verified_count':
        unlocked = verifiedActionsCount >= threshold
        break
    }

    if (unlocked) {
      try {
        const ub = await UserBadge.create({
          userId,
          badgeSlug: badge.slug,
          earnedAt: new Date(),
        })

        // Also push into User.badges array
        await User.updateOne(
          { _id: userId },
          {
            $push: {
              badges: {
                badgeId: badge._id,
                earnedAt: ub.earnedAt,
              },
            },
          },
        )

        newlyAwarded.push(badge)
        earnedSlugs.add(badge.slug)
      } catch (err) {
        if (err.code !== 11000) {
          throw err
        }
      }
    }
  }

  return newlyAwarded
}
