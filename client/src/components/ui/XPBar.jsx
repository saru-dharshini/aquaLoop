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

const LEVEL_DATA = {
  1: { name: 'Droplet', startXP: 0, spanXP: 500 },
  2: { name: 'Stream', startXP: 500, spanXP: 1000 },
  3: { name: 'River', startXP: 1500, spanXP: 2000 },
  4: { name: 'Ocean Guardian', startXP: 3500, spanXP: 0 },
}

export default function XPBar({
  xp = 0,
  level = 1,
  showLabel = true,
  compact = false,
}) {
  const currentTier = LEVEL_DATA[level] || LEVEL_DATA[1]
  const isMaxLevel = level >= 4

  const xpInCurrentLevel = isMaxLevel ? Math.max(0, xp - 3500) : Math.max(0, xp - currentTier.startXP)
  const xpToNext = currentTier.spanXP
  const fraction = isMaxLevel ? 1 : xpToNext > 0 ? Math.min(xpInCurrentLevel / xpToNext, 1) : 0
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
      aria-label={`Level ${level} (${currentTier.name}), ${xpInCurrentLevel} of ${xpToNext} XP`}
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
            Lv {level} · {currentTier.name}
          </span>
          {!compact && (
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              {isMaxLevel ? `${xp} XP (Master)` : `${xpInCurrentLevel} / ${xpToNext} XP`}
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
