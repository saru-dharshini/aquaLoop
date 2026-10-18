/**
 * Leaderboard Service — AquaLoop Phase 3B
 *
 * Implements deterministic ranking and tie-breaking:
 * 1. Primary: xp DESC
 * 2. Tie-break 1: streak DESC
 * 3. Tie-break 2: createdAt ASC (seniority)
 * 4. Tie-break 3: _id ASC
 *
 * Sample data handling:
 * - isSample records are filtered out in production (includeSample=false default).
 * - Returns clean 1-indexed ranks.
 */

import User from '../models/User.js'

/**
 * Retrieves paginated leaderboard with tie-breaking and city filtering.
 *
 * @param {object} [params={}]
 * @param {number} [params.limit=50]
 * @param {number} [params.page=1]
 * @param {string} [params.city=null]
 * @param {boolean} [params.includeSample=false]
 * @returns {Promise<{ users: Array<object>, total: number, page: number, totalPages: number }>}
 */
export async function getLeaderboard({
  limit = 50,
  page = 1,
  city = null,
  includeSample = false,
} = {}) {
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 50))
  const safePage = Math.max(1, Number(page) || 1)
  const skip = (safePage - 1) * safeLimit

  const query = {}

  if (!includeSample) {
    query.isSample = { $ne: true }
  }

  if (city && typeof city === 'string' && city.trim()) {
    query.city = new RegExp(`^${city.trim()}$`, 'i')
  }

  const [total, users] = await Promise.all([
    User.countDocuments(query),
    User.find(query)
      .select('username xp level streak totalWaterSavedLitres actionsLogged isSample city avatar createdAt')
      .sort({ xp: -1, streak: -1, createdAt: 1, _id: 1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
  ])

  // Attach 1-indexed ranks
  const rankedUsers = users.map((u, index) => ({
    ...u,
    rank: skip + index + 1,
  }))

  const totalPages = Math.ceil(total / safeLimit) || 1

  return {
    users: rankedUsers,
    total,
    page: safePage,
    totalPages,
  }
}
