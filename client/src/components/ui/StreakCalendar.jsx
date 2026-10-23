/**
 * StreakCalendar — AquaLoop Phase 5.2
 *
 * Displays a rolling 7-day conservation streak calendar strictly anchored
 * to Indian Standard Time (Asia/Kolkata).
 *
 * Data derivation & honesty rules:
 * - Computes today's date and rolling 7-day window via Intl.DateTimeFormat in Asia/Kolkata.
 * - Qualifying days are derived directly from user.lastActiveDateIST, the active streak
 *   window [lastActiveDateIST - (streak - 1) days ... lastActiveDateIST], and user action records.
 * - Does not invent historical activity; unrecorded days are displayed as neutral rest days.
 * - Shows current streak count (with animated counter) and equipped streak freeze shields (0 to 2).
 * - Read-only view: never consumes a freeze or modifies streak state from the client.
 * - Responsive and respects prefers-reduced-motion.
 */

import { useMemo } from 'react'
import { Zap, Shield, Droplet, Clock, Check, AlertCircle } from 'lucide-react'
import Badge from './Badge.jsx'
import useAnimatedNumber from '../../hooks/useAnimatedNumber.js'

const TIMEZONE = 'Asia/Kolkata'

/**
 * Returns today's date formatted as YYYY-MM-DD in Asia/Kolkata.
 */
function getTodayIST() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

/**
 * Converts a Date object or ISO string to YYYY-MM-DD in Asia/Kolkata.
 */
function toDateIST(date) {
  if (!date) return null
  const d = new Date(date)
  if (isNaN(d.getTime())) return null
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

/**
 * Generates an array of rolling consecutive days ending on today (Asia/Kolkata).
 */
function getRolling7DaysIST() {
  const todayStr = getTodayIST()
  // Reference anchor at noon IST to avoid any daylight/midnight edge drift
  const anchor = new Date(`${todayStr}T12:00:00.000+05:30`)
  const days = []

  for (let i = 6; i >= 0; i--) {
    const d = new Date(anchor.getTime() - i * 86400000)
    const dateStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d)

    const dayName = new Intl.DateTimeFormat('en-US', {
      timeZone: TIMEZONE,
      weekday: 'short',
    }).format(d)

    const dayNum = new Intl.DateTimeFormat('en-US', {
      timeZone: TIMEZONE,
      day: 'numeric',
    }).format(d)

    days.push({
      dateStr,
      dayName,
      dayNum,
      isToday: dateStr === todayStr,
    })
  }

  return days
}

export default function StreakCalendar({
  user = null,
  actions = [],
  className = '',
  style = {},
}) {
  const todayStr = useMemo(() => getTodayIST(), [])
  const rollingDays = useMemo(() => getRolling7DaysIST(), [])

  const streak = Number(user?.streak) || 0
  const streakFreezes = Number(user?.streakFreezes) || 0
  const lastActiveDateIST = user?.lastActiveDateIST || null
  const animatedStreak = useAnimatedNumber(streak, { duration: 600 })

  // Build a set of confirmed active dates from explicit user actions
  const confirmedActionDates = useMemo(() => {
    const set = new Set()
    if (Array.isArray(actions)) {
      actions.forEach((a) => {
        const d = a.dateIST || toDateIST(a.createdAt) || toDateIST(a.date)
        if (d) set.add(d)
      })
    }
    return set
  }, [actions])

  // Derive qualifying streak days:
  // If user has streak S > 0 ending on lastActiveDateIST, the S consecutive days
  // up to lastActiveDateIST are mathematically guaranteed qualifying streak days.
  const qualifyingDates = useMemo(() => {
    const set = new Set(confirmedActionDates)

    if (streak > 0 && lastActiveDateIST) {
      const anchor = new Date(`${lastActiveDateIST}T12:00:00.000+05:30`)
      for (let i = 0; i < streak; i++) {
        const d = new Date(anchor.getTime() - i * 86400000)
        const dateStr = toDateIST(d)
        if (dateStr) set.add(dateStr)
      }
    }

    return set
  }, [confirmedActionDates, streak, lastActiveDateIST])

  const isTodayCompleted = qualifyingDates.has(todayStr) || lastActiveDateIST === todayStr

  return (
    <div
      className={`card ${className}`.trim()}
      style={{
        padding: 'var(--space-6)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-5)',
        background: 'var(--surface-base)',
        border: '1px solid var(--surface-border)',
        ...style,
      }}
      role="region"
      aria-label={`Conservation streak: ${streak} days. ${streakFreezes} streak freeze shields available.`}
    >
      {/* Header Row: Streak Count + Freeze Status */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-4)',
          flexWrap: 'wrap',
        }}
      >
        {/* Streak Metrics */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-md)',
              background: streak > 0 ? '#fff8e1' : 'var(--surface-raised)',
              border: streak > 0 ? '1px solid #ffe082' : '1px solid var(--surface-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: streak > 0 ? 'var(--color-gold-600)' : 'var(--text-muted)',
              flexShrink: 0,
            }}
            aria-hidden="true"
          >
            <Zap size={24} className={streak > 0 ? 'animate-droplet-pulse' : ''} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <h3
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'var(--text-xl)',
                  fontWeight: 700,
                  margin: 0,
                  color: 'var(--text-primary)',
                  lineHeight: 1.2,
                }}
              >
                {animatedStreak} {streak === 1 ? 'Day' : 'Days'} Streak
              </h3>

              {isTodayCompleted ? (
                <Badge variant="success" icon={Check} size="sm">
                  Active Today
                </Badge>
              ) : streak > 0 ? (
                <Badge variant="warning" icon={Clock} size="sm">
                  Pending Today
                </Badge>
              ) : (
                <Badge variant="neutral" size="sm">
                  Start Flow
                </Badge>
              )}
            </div>

            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Rolling 7-day conservation calendar (Asia/Kolkata IST)
            </p>
          </div>
        </div>

        {/* Streak Freeze Shields Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-2) var(--space-3)',
            background: streakFreezes > 0 ? 'var(--color-primary-50)' : 'var(--surface-raised)',
            border: `1px solid ${streakFreezes > 0 ? 'var(--color-primary-200)' : 'var(--surface-border)'}`,
            borderRadius: 'var(--radius-md)',
          }}
          title={
            streakFreezes > 0
              ? `${streakFreezes}/2 Freezes Equipped: Automatically protects your streak if you miss 1 day.`
              : '0/2 Freezes: Reach 7-day streak milestones to earn freeze shields.'
          }
        >
          <Shield
            size={18}
            style={{
              color: streakFreezes > 0 ? 'var(--color-primary-700)' : 'var(--text-muted)',
              flexShrink: 0,
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                color: streakFreezes > 0 ? 'var(--color-primary-800)' : 'var(--text-muted)',
              }}
            >
              {streakFreezes}/2 Streak Freezes
            </span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              {streakFreezes > 0 ? 'Automatic shield active' : 'Earn at 7-day mark'}
            </span>
          </div>
        </div>
      </div>

      {/* 7-Day Rolling Calendar Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 'clamp(4px, 1.5vw, var(--space-2))',
          paddingTop: 'var(--space-2)',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
        role="list"
        aria-label="Past 7 days activity status"
      >
        {rollingDays.map((d) => {
          const isQualifying = qualifyingDates.has(d.dateStr)
          const isToday = d.isToday

          return (
            <div
              key={d.dateStr}
              role="listitem"
              aria-label={`${d.dayName} ${d.dayNum}: ${
                isToday
                  ? isQualifying
                    ? 'Today (Conserved water)'
                    : 'Today (Pending action)'
                  : isQualifying
                    ? 'Conserved water'
                    : 'No action recorded'
              }`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: 'var(--space-3) clamp(2px, 1vw, var(--space-1))',
                borderRadius: 'var(--radius-md)',
                background: isToday
                  ? isQualifying
                    ? 'var(--color-primary-50)'
                    : '#fffde7'
                  : isQualifying
                    ? 'var(--surface-raised)'
                    : 'transparent',
                border: isToday
                  ? `2px solid ${isQualifying ? 'var(--color-primary-600)' : 'var(--color-gold-400)'}`
                  : isQualifying
                    ? '1px solid var(--color-primary-100)'
                    : '1px dashed var(--surface-border)',
                transition: 'transform var(--duration-quick) var(--ease-standard)',
              }}
            >
              {/* Day Name */}
              <span
                style={{
                  fontSize: 'clamp(10px, 2.4vw, 12px)',
                  fontWeight: isToday ? 700 : 500,
                  color: isToday ? 'var(--color-primary-800)' : 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: 'var(--tracking-wider)',
                  marginBottom: 2,
                }}
              >
                {d.dayName}
              </span>

              {/* Day Number */}
              <span
                style={{
                  fontSize: 'clamp(10px, 2.2vw, 12px)',
                  color: 'var(--text-muted)',
                  marginBottom: 'var(--space-2)',
                }}
              >
                {d.dayNum}
              </span>

              {/* Status Indicator Icon */}
              <div
                style={{
                  width: 'clamp(26px, 6.5vw, 32px)',
                  height: 'clamp(26px, 6.5vw, 32px)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isQualifying
                    ? 'var(--color-primary-600)'
                    : isToday
                      ? 'var(--surface-base)'
                      : 'var(--surface-raised)',
                  color: isQualifying
                    ? '#ffffff'
                    : isToday
                      ? 'var(--color-gold-600)'
                      : 'var(--text-muted)',
                  border: isQualifying
                    ? 'none'
                    : isToday
                      ? '1.5px dashed var(--color-gold-400)'
                      : '1px solid var(--surface-border)',
                  boxShadow: isQualifying
                    ? '0 2px 6px rgba(0, 151, 167, 0.35)'
                    : 'none',
                }}
              >
                {isQualifying ? (
                  <Droplet size={15} fill="currentColor" />
                ) : isToday ? (
                  <Clock size={14} />
                ) : (
                  <span style={{ fontSize: 13, opacity: 0.5 }}>·</span>
                )}
              </div>

              {/* Today Badge / Caption */}
              <span
                style={{
                  fontSize: 'clamp(9px, 2vw, 10px)',
                  fontWeight: isToday ? 700 : 500,
                  color: isToday
                    ? isQualifying
                      ? 'var(--color-primary-700)'
                      : 'var(--color-gold-700)'
                    : isQualifying
                      ? 'var(--color-primary-700)'
                      : 'var(--text-muted)',
                  marginTop: 'var(--space-2)',
                  whiteSpace: 'nowrap',
                }}
              >
                {isToday ? (isQualifying ? 'Done' : 'Today') : isQualifying ? 'Saved' : 'Rest'}
              </span>
            </div>
          )
        })}
      </div>

      {/* Footer / Tip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          paddingTop: 'var(--space-3)',
          borderTop: '1px solid var(--surface-border)',
          fontSize: 'var(--text-xs)',
          color: 'var(--text-secondary)',
        }}
      >
        <AlertCircle size={14} style={{ color: 'var(--color-primary-600)', flexShrink: 0 }} />
        <span>
          {isTodayCompleted ? (
            <>
              <strong>Streak safe for today!</strong> Return tomorrow in Indian Standard Time (IST) to keep your streak flowing.
            </>
          ) : (
            <>
              <strong>Action required today:</strong> Log a water-saving action or claim your Daily Bonus to advance your streak to {streak + 1} days!
            </>
          )}
        </span>
      </div>
    </div>
  )
}
