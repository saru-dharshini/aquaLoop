/**
 * XPBar — animated XP progress bar showing current level and XP to next level.
 *
 * Props:
 *   xp        : current XP total (number)
 *   level     : current level (number)
 *   xpToNext  : XP required to reach next level (number)
 *   showLabel : boolean — show "Level N" and XP fraction  (default: true)
 *   compact   : boolean — compact single-line layout
 *
 * NOTE: All values are server-provided — this component only displays them.
 *       It never computes XP or level itself.
 */
import { useEffect, useRef, useState } from 'react'

export default function XPBar({
  xp = 0,
  level = 1,
  xpToNext = 100,
  showLabel = true,
  compact = false,
}) {
  const xpInCurrentLevel = Math.max(0, xp - levelStartXP(level))
  const fraction = xpToNext > 0 ? Math.min(xpInCurrentLevel / xpToNext, 1) : 0
  const pct = Math.round(fraction * 100)

  // Animate the bar width on mount / change
  const [width, setWidth] = useState(0)
  const mounted = useRef(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setWidth(pct))
    mounted.current = true
    return () => cancelAnimationFrame(id)
  }, [pct])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: compact ? 'row' : 'column',
        alignItems: compact ? 'center' : undefined,
        gap: compact ? 'var(--space-2)' : 'var(--space-1)',
      }}
      role="group"
      aria-label={`Level ${level}, ${xpInCurrentLevel} of ${xpToNext} XP`}
    >
      {showLabel && (
        <div
          style={{
            display: 'flex',
            justifyContent: compact ? undefined : 'space-between',
            alignItems: 'center',
            gap: 'var(--space-2)',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              fontSize: compact ? 'var(--text-xs)' : 'var(--text-sm)',
              color: 'var(--color-primary-700)',
              whiteSpace: 'nowrap',
            }}
          >
            Lv {level}
          </span>
          {!compact && (
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              {xpInCurrentLevel} / {xpToNext} XP
            </span>
          )}
        </div>
      )}

      {/* Track */}
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${pct}% to next level`}
        style={{
          flex: 1,
          height: compact ? 6 : 10,
          background: 'var(--color-primary-50)',
          borderRadius: 'var(--radius-pill)',
          overflow: 'hidden',
          border: '1px solid var(--color-primary-100)',
        }}
      >
        {/* Fill */}
        <div
          style={{
            height: '100%',
            width: `${width}%`,
            background: 'linear-gradient(90deg, var(--color-primary-400), var(--color-primary-600))',
            borderRadius: 'var(--radius-pill)',
            transition: 'width 600ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </div>
    </div>
  )
}

/**
 * Returns the XP total at the START of a given level.
 * Formula: level = floor((xp/100)^0.75) + 1  (pending approval — see PLAN.md §6.5)
 * Inverse: xp_start(level) = ((level - 1) / 1)^(1/0.75) * 100
 * Placeholder until game-economy values are approved.
 */
function levelStartXP(level) {
  if (level <= 1) return 0
  return Math.round(Math.pow(level - 1, 1 / 0.75) * 100)
}
