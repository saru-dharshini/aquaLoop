/**
 * Level progression utility — AquaLoop Phase 3B
 *
 * Implements the approved 4-tier level curve:
 * - Level 1: Droplet (0 – 499 XP)
 * - Level 2: Stream (500 – 1,499 XP)
 * - Level 3: River (1,500 – 3,499 XP)
 * - Level 4: Ocean Guardian (3,500+ XP)
 */

export const LEVEL_TIERS = [
  { level: 1, name: 'Droplet', minXP: 0, maxXP: 499, span: 500 },
  { level: 2, name: 'Stream', minXP: 500, maxXP: 1499, span: 1000 },
  { level: 3, name: 'River', minXP: 1500, maxXP: 3499, span: 2000 },
  { level: 4, name: 'Ocean Guardian', minXP: 3500, maxXP: Infinity, span: null },
]

/**
 * Computes level number from cumulative XP.
 * @param {number} xp
 * @returns {number} 1 | 2 | 3 | 4
 */
export function computeLevel(xp = 0) {
  const safeXP = Math.max(0, Math.floor(xp || 0))
  if (safeXP < 500) return 1
  if (safeXP < 1500) return 2
  if (safeXP < 3500) return 3
  return 4
}

/**
 * Computes complete level progress details for a given XP.
 * @param {number} xp
 * @returns {{ level: number, name: string, xp: number, xpInLevel: number, xpToNext: number, percentage: number }}
 */
export function getLevelDetails(xp = 0) {
  const safeXP = Math.max(0, Math.floor(xp || 0))
  const level = computeLevel(safeXP)
  const tier = LEVEL_TIERS.find((t) => t.level === level) || LEVEL_TIERS[0]

  if (level === 4) {
    return {
      level: 4,
      name: 'Ocean Guardian',
      xp: safeXP,
      xpInLevel: safeXP - 3500,
      xpToNext: 0,
      percentage: 100,
    }
  }

  const xpInLevel = safeXP - tier.minXP
  const xpToNext = tier.span
  const percentage = Math.min(100, Math.floor((xpInLevel / xpToNext) * 100))

  return {
    level,
    name: tier.name,
    xp: safeXP,
    xpInLevel,
    xpToNext,
    percentage,
  }
}
