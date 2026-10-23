/**
 * QuestRoadmap — AquaLoop Phase 5.4
 *
 * Interactive visual progression pathway across the 4 platform tiers:
 * - Level 1: Droplet (0 XP)
 * - Level 2: Stream (500 XP)
 * - Level 3: River (1,500 XP)
 * - Level 4: Ocean Guardian (3,500 XP)
 *
 * Features:
 * - Strictly derives progression and locked status from server-provided user XP/level.
 * - Does not invent fake perks, rewards, or mission requirements.
 * - Shows completed milestones, current active tier progress, and locked future ranks.
 * - Fully accessible with role="region", semantic headings, and reduced-motion support.
 */

import { Droplet, Waves, Trophy, Crown, CheckCircle2, Lock, Sparkles } from 'lucide-react'
import Badge from './Badge.jsx'

const QUEST_STAGES = [
  {
    level: 1,
    name: 'Droplet',
    threshold: 0,
    icon: Droplet,
    summary: 'Citizen Onboarding & First Habits',
    description: 'Begin water literacy learning quizzes and record your initial home conservation actions.',
  },
  {
    level: 2,
    name: 'Stream',
    threshold: 500,
    icon: Waves,
    summary: 'Consistent Flow & Literacy Mastery',
    description: 'Sustain daily conservation streaks, master water footprint quizzes, and earn freeze shields.',
  },
  {
    level: 3,
    name: 'River',
    threshold: 1500,
    icon: Trophy,
    summary: 'Civic Action & Hazard Reporting',
    description: 'Report civic pipeline leaks on the interactive map and verify high-volume greywater diversion.',
  },
  {
    level: 4,
    name: 'Ocean Guardian',
    threshold: 3500,
    icon: Crown,
    summary: 'Master Conservation Honor',
    description: 'The highest civic stewardship rank in AquaLoop. Demonstrates profound community water impact.',
  },
]

export default function QuestRoadmap({
  user = null,
  className = '',
  style = {},
}) {
  const safeXP = Number.isFinite(Number(user?.xp)) ? Math.max(0, Math.floor(Number(user?.xp))) : 0
  const safeLevel = Math.min(Math.max(1, Number(user?.level) || 1), 4)

  return (
    <div
      className={`card ${className}`.trim()}
      style={{
        padding: 'var(--space-6)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-6)',
        background: 'var(--surface-base)',
        border: '1px solid var(--surface-border)',
        ...style,
      }}
      role="region"
      aria-label="Conservation Quest Progression Roadmap"
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-4)',
          flexWrap: 'wrap',
          borderBottom: '1px solid var(--surface-border)',
          paddingBottom: 'var(--space-4)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <h3
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'var(--text-lg)',
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: 0,
              }}
            >
              Conservation Quest Roadmap
            </h3>
            <Badge variant="primary">Platform Journey</Badge>
          </div>
          <p
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--text-secondary)',
              margin: '4px 0 0 0',
            }}
          >
            Track your advancement from first droplet to master Ocean Guardian.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Badge variant="gold" icon={Sparkles} size="md">
            Current: Level {safeLevel} · {QUEST_STAGES[safeLevel - 1]?.name}
          </Badge>
        </div>
      </div>

      {/* Visual Roadmap Rail & Nodes */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--space-4)',
          position: 'relative',
        }}
      >
        {QUEST_STAGES.map((stage) => {
          const isAchieved = safeXP >= stage.threshold || safeLevel >= stage.level
          const isCurrent = safeLevel === stage.level
          const isLocked = !isAchieved
          const StageIcon = stage.icon

          const remainingXP = isLocked ? stage.threshold - safeXP : 0

          return (
            <div
              key={stage.level}
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: 'var(--space-4)',
                borderRadius: 'var(--radius-md)',
                background: isCurrent
                  ? 'var(--color-primary-50)'
                  : isAchieved
                    ? 'var(--surface-raised)'
                    : 'var(--surface-base)',
                border: isCurrent
                  ? '2px solid var(--color-primary-600)'
                  : isAchieved
                    ? '1px solid var(--color-primary-200)'
                    : '1px dashed var(--surface-border)',
                opacity: isLocked ? 0.75 : 1,
                transition: 'transform var(--duration-quick) var(--ease-standard)',
              }}
              aria-label={`Level ${stage.level}: ${stage.name}. ${
                isAchieved
                  ? isCurrent
                    ? 'Current rank in progress'
                    : 'Milestone attained'
                  : `Locked. Requires ${stage.threshold} XP (${remainingXP} XP remaining)`
              }`}
            >
              <div>
                {/* Top Status & Milestone Number */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 'var(--space-3)',
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: isCurrent
                        ? 'var(--color-primary-600)'
                        : isAchieved
                          ? 'var(--color-primary-100)'
                          : 'var(--surface-raised)',
                      color: isCurrent
                        ? '#ffffff'
                        : isAchieved
                          ? 'var(--color-primary-700)'
                          : 'var(--text-muted)',
                      border: isLocked ? '1px solid var(--surface-border)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: isCurrent ? '0 0 10px rgba(0, 151, 167, 0.4)' : 'none',
                    }}
                    aria-hidden="true"
                  >
                    {isAchieved && !isCurrent ? (
                      <CheckCircle2 size={20} />
                    ) : isLocked ? (
                      <Lock size={18} />
                    ) : (
                      <StageIcon size={20} />
                    )}
                  </div>

                  <Badge
                    variant={isCurrent ? 'gold' : isAchieved ? 'success' : 'neutral'}
                    size="sm"
                  >
                    {isCurrent ? 'Current' : isAchieved ? 'Attained' : 'Locked'}
                  </Badge>
                </div>

                {/* Stage Title */}
                <h4
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 'var(--text-base)',
                    fontWeight: 700,
                    margin: '0 0 4px 0',
                    color: isCurrent ? 'var(--color-primary-800)' : 'var(--text-primary)',
                  }}
                >
                  Lv {stage.level} · {stage.name}
                </h4>

                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: isLocked ? 'var(--text-muted)' : 'var(--color-primary-700)',
                    textTransform: 'uppercase',
                    letterSpacing: 'var(--tracking-wide)',
                    display: 'block',
                    marginBottom: 'var(--space-2)',
                  }}
                >
                  {stage.threshold === 0 ? 'Starting Rank' : `Requires ${stage.threshold.toLocaleString()} XP`}
                </span>

                {/* Focus Summary */}
                <p
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-secondary)',
                    lineHeight: 'var(--leading-relaxed)',
                    margin: 0,
                  }}
                >
                  {stage.description}
                </p>
              </div>

              {/* Bottom Progress Footnote */}
              <div
                style={{
                  borderTop: '1px solid var(--surface-border)',
                  paddingTop: 'var(--space-2)',
                  marginTop: 'var(--space-3)',
                  fontSize: '11px',
                  color: isLocked ? 'var(--text-muted)' : 'var(--color-primary-800)',
                  fontWeight: 500,
                }}
              >
                {isCurrent ? (
                  <span>★ Active Rank</span>
                ) : isAchieved ? (
                  <span style={{ color: 'var(--color-success)' }}>✓ Milestone Completed</span>
                ) : (
                  <span>🔒 {remainingXP.toLocaleString()} XP remaining</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
