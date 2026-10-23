/**
 * XPBar — AquaLoop Phase 5.2
 *
 * Enhanced animated XP progress bar displaying:
 * - Current level tier (Droplet, Stream, River, Ocean Guardian)
 * - Animated XP value counter via useAnimatedNumber hook
 * - Flowing liquid water-wave gradient fill using Phase 5.1 CSS utilities
 * - Milestone markers for all 4 progression tiers
 * - Next tier target threshold
 * - Screen-reader accessible aria attributes and responsive layout
 *
 * NOTE: Tier boundaries strictly match server/src/utils/levels.js:
 *   Level 1 (Droplet): 0 – 499 XP (threshold: 500)
 *   Level 2 (Stream): 500 – 1,499 XP (threshold: 1,500)
 *   Level 3 (River): 1,500 – 3,499 XP (threshold: 3,500)
 *   Level 4 (Ocean Guardian): 3,500+ XP (Max Level)
 */

import { useEffect, useRef, useState, useMemo } from 'react'
import { Droplet, Waves, Award, Crown, Check } from 'lucide-react'
import useAnimatedNumber from '../../hooks/useAnimatedNumber.js'

const LEVEL_DATA = {
  1: { level: 1, name: 'Droplet', startXP: 0, spanXP: 500, nextThreshold: 500, icon: Droplet },
  2: { level: 2, name: 'Stream', startXP: 500, spanXP: 1000, nextThreshold: 1500, icon: Waves },
  3: { level: 3, name: 'River', startXP: 1500, spanXP: 2000, nextThreshold: 3500, icon: Award },
  4: { level: 4, name: 'Ocean Guardian', startXP: 3500, spanXP: 0, nextThreshold: 3500, icon: Crown },
}

const MILESTONES = [
  { level: 1, name: 'Droplet', threshold: 0, label: '0 XP' },
  { level: 2, name: 'Stream', threshold: 500, label: '500 XP' },
  { level: 3, name: 'River', threshold: 1500, label: '1,500 XP' },
  { level: 4, name: 'Ocean Guardian', threshold: 3500, label: '3,500 XP' },
]

export default function XPBar({
  xp = 0,
  level = 1,
  showLabel = true,
  showMilestones = true,
  compact = false,
}) {
  const safeXP = Number.isFinite(Number(xp)) ? Math.max(0, Math.floor(Number(xp))) : 0
  const safeLevel = Math.min(Math.max(1, Number(level) || 1), 4)

  const currentTier = LEVEL_DATA[safeLevel] || LEVEL_DATA[1]
  const isMaxLevel = safeLevel >= 4

  const xpInCurrentLevel = isMaxLevel ? safeXP - 3500 : Math.max(0, safeXP - currentTier.startXP)
  const xpToNext = currentTier.spanXP
  const fraction = isMaxLevel ? 1 : xpToNext > 0 ? Math.min(xpInCurrentLevel / xpToNext, 1) : 0
  const pct = Math.round(fraction * 100)
  const xpRemaining = isMaxLevel ? 0 : Math.max(0, currentTier.nextThreshold - safeXP)

  // Animated numbers for smooth counters
  const animatedXPInLevel = useAnimatedNumber(xpInCurrentLevel, { duration: 600 })
  const animatedTotalXP = useAnimatedNumber(safeXP, { duration: 600 })

  // Animate the bar width on mount or change
  const [width, setWidth] = useState(0)
  const mountedRef = useRef(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setWidth(pct))
    mountedRef.current = true
    return () => cancelAnimationFrame(id)
  }, [pct])

  const nextTierName = useMemo(() => {
    if (isMaxLevel) return 'Master'
    const nextTier = LEVEL_DATA[safeLevel + 1]
    return nextTier ? nextTier.name : 'Max'
  }, [safeLevel, isMaxLevel])

  const screenReaderText = isMaxLevel
    ? `Level 4: Ocean Guardian. ${safeXP} total XP. Maximum rank attained.`
    : `Level ${safeLevel}: ${currentTier.name}. ${xpInCurrentLevel} of ${xpToNext} XP in current tier (${pct}%). ${xpRemaining} XP required to reach ${nextTierName}.`

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: compact ? 'row' : 'column',
        alignItems: compact ? 'center' : undefined,
        gap: compact ? 'var(--space-2)' : 'var(--space-3)',
        width: '100%',
      }}
      role="group"
      aria-label={screenReaderText}
    >
      {/* Header Label Row */}
      {showLabel && (
        <div
          style={{
            display: 'flex',
            justifyContent: compact ? undefined : 'space-between',
            alignItems: 'baseline',
            gap: 'var(--space-2)',
            flexShrink: 0,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                fontSize: compact ? 'var(--text-xs)' : 'var(--text-base)',
                color: 'var(--color-primary-700)',
                letterSpacing: 'var(--tracking-tight)',
              }}
            >
              Lv {safeLevel} · {currentTier.name}
            </span>
            {!compact && !isMaxLevel && (
              <span
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-muted)',
                  background: 'var(--surface-raised)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-pill)',
                  border: '1px solid var(--surface-border)',
                }}
              >
                Next: {nextTierName} ({currentTier.nextThreshold} XP)
              </span>
            )}
          </div>

          {!compact && (
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              {isMaxLevel ? (
                <strong style={{ color: 'var(--color-gold-600)' }}>
                  {animatedTotalXP.toLocaleString()} XP (Max Rank)
                </strong>
              ) : (
                <span>
                  <strong>{animatedXPInLevel.toLocaleString()}</strong> / {xpToNext.toLocaleString()} XP
                  <span style={{ color: 'var(--text-muted)', marginLeft: 'var(--space-2)' }}>
                    ({xpRemaining.toLocaleString()} XP remaining)
                  </span>
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Progress Track */}
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${pct}% progress to Level ${safeLevel + 1}`}
        style={{
          position: 'relative',
          flex: 1,
          height: compact ? 6 : 14,
          background: 'var(--color-primary-50)',
          borderRadius: 'var(--radius-pill)',
          overflow: 'hidden',
          border: '1px solid var(--color-primary-100)',
          boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.05)',
        }}
      >
        {/* Animated Water Wave Fill */}
        <div
          className="animate-water-wave"
          style={{
            height: '100%',
            width: `${width}%`,
            background: isMaxLevel
              ? 'linear-gradient(90deg, var(--color-gold-400), var(--color-gold-600), var(--color-gold-400))'
              : 'linear-gradient(90deg, var(--color-primary-600) 0%, var(--color-primary-400) 50%, var(--color-primary-600) 100%)',
            borderRadius: 'var(--radius-pill)',
            transition: 'width 600ms cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 0 8px rgba(0, 151, 167, 0.3)',
          }}
        />
      </div>

      {/* Milestone Checkpoint Nodes (Full View Only) */}
      {!compact && showMilestones && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            paddingTop: 'var(--space-1)',
            gap: 'var(--space-1)',
          }}
          aria-hidden="true"
        >
          {MILESTONES.map((m) => {
            const isAchieved = safeXP >= m.threshold
            const isCurrent = safeLevel === m.level
            const isTarget = safeLevel + 1 === m.level

            return (
              <div
                key={m.level}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flex: 1,
                  textAlign: 'center',
                  opacity: isAchieved ? 1 : isTarget ? 0.9 : 0.45,
                }}
              >
                {/* Node Pill / Indicator */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: isAchieved
                      ? 'var(--color-primary-600)'
                      : isTarget
                        ? 'var(--color-primary-100)'
                        : 'var(--surface-raised)',
                    color: isAchieved ? '#ffffff' : 'var(--color-primary-700)',
                    border: isTarget
                      ? '2px solid var(--color-primary-600)'
                      : isAchieved
                        ? 'none'
                        : '1px solid var(--surface-border)',
                    boxShadow: isCurrent ? '0 0 0 3px rgba(0, 151, 167, 0.2)' : 'none',
                    marginBottom: 4,
                  }}
                >
                  {isAchieved ? <Check size={12} strokeWidth={3} /> : <span style={{ fontSize: 10, fontWeight: 700 }}>{m.level}</span>}
                </div>

                {/* Node Label */}
                <span
                  style={{
                    fontSize: 'clamp(10px, 2.5vw, 12px)',
                    fontWeight: isAchieved || isTarget ? 600 : 500,
                    color: isAchieved ? 'var(--text-primary)' : 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%',
                  }}
                >
                  {m.name}
                </span>

                {/* Threshold XP */}
                <span style={{ fontSize: 'clamp(9px, 2.2vw, 10px)', color: 'var(--text-muted)', marginTop: 1 }}>
                  {m.label}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
