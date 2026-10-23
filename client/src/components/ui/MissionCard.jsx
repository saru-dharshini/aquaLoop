/**
 * MissionCard — AquaLoop Phase 5.4
 *
 * Reusable, interactive card for conservation and literacy missions:
 * - Learning Quizzes (category: 'learning')
 * - Home & Habit Actions (category: 'action')
 * - Civic Hazard Reporting (category: 'civic')
 *
 * Features:
 * - Category icons and difficulty indicators derived strictly from server data.
 * - Displays base XP, bonus XP, and estimated litres saved per day.
 * - Handles user status (completed with score %, cooldown active, pending).
 * - Interactive hover elevation (.interactive-card) and accessible markup.
 * - Respects prefers-reduced-motion.
 */

import { BookOpen, Droplets, AlertTriangle, CheckCircle2, Clock, Sparkles, ArrowRight } from 'lucide-react'
import Badge from './Badge.jsx'
import Button from './Button.jsx'

const CATEGORY_CONFIG = {
  learning: {
    icon: BookOpen,
    label: 'Literacy Quiz',
    color: 'var(--color-primary-600)',
    bg: 'var(--color-primary-50)',
  },
  action: {
    icon: Droplets,
    label: 'Action Mission',
    color: 'var(--color-primary-700)',
    bg: 'var(--color-primary-50)',
  },
  civic: {
    icon: AlertTriangle,
    label: 'Civic Mission',
    color: 'var(--color-warning)',
    bg: 'var(--color-warning-bg)',
  },
}

export default function MissionCard({
  mission,
  onStartQuiz,
  onLogAction,
  className = '',
  style = {},
}) {
  if (!mission) return null

  const isLearning = mission.category === 'learning'
  const isCompleted = Boolean(mission.userStatus?.isCompleted)
  const isCooldown = Boolean(mission.userStatus?.isCooldownActive)
  const scorePercent = mission.userStatus?.scorePercent

  const categoryConf = CATEGORY_CONFIG[mission.category] || CATEGORY_CONFIG.action
  const CategoryIcon = categoryConf.icon

  return (
    <div
      className={`card interactive-card ${className}`.trim()}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 'var(--space-5)',
        border: isCompleted ? '1px solid var(--color-success-bg)' : '1px solid var(--surface-border)',
        background: isCompleted ? 'var(--surface-base)' : 'var(--surface-base)',
        position: 'relative',
        ...style,
      }}
      role="article"
      aria-label={`${mission.title} - ${categoryConf.label}`}
    >
      <div>
        {/* Top Meta Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-2)',
            marginBottom: 'var(--space-3)',
          }}
        >
          {/* Category Chip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 'var(--radius-sm)',
                background: categoryConf.bg,
                color: categoryConf.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
              aria-hidden="true"
            >
              <CategoryIcon size={16} />
            </div>
            <span
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: 'var(--tracking-wide)',
              }}
            >
              {categoryConf.label}
            </span>
          </div>

          {/* XP Reward Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Badge variant="gold" icon={Sparkles} size="sm">
              +{mission.baseXP} XP
            </Badge>
            {mission.bonusXP > 0 && (
              <Badge variant="success" size="sm">
                +{mission.bonusXP} bonus
              </Badge>
            )}
          </div>
        </div>

        {/* Title */}
        <h4
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'var(--text-base)',
            fontWeight: 600,
            color: 'var(--text-primary)',
            margin: '0 0 var(--space-2) 0',
            lineHeight: 'var(--leading-snug)',
          }}
        >
          {mission.title}
        </h4>

        {/* Description */}
        <p
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-secondary)',
            lineHeight: 'var(--leading-relaxed)',
            margin: '0 0 var(--space-3) 0',
          }}
        >
          {mission.description}
        </p>

        {/* Water Impact (if estimated savings provided by server) */}
        {mission.estimatedLitresSavedPerDay > 0 && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-1)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-pill)',
              background: 'var(--color-primary-50)',
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--color-primary-800)',
              marginBottom: 'var(--space-3)',
            }}
          >
            <span>💧 Est. savings: ~{mission.estimatedLitresSavedPerDay} L / day</span>
          </div>
        )}
      </div>

      {/* Footer Row: Status & Actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-2)',
          borderTop: '1px solid var(--surface-border)',
          paddingTop: 'var(--space-3)',
          marginTop: 'var(--space-3)',
          flexWrap: 'wrap',
        }}
      >
        {/* Status / Difficulty Badges */}
        <div>
          {isLearning ? (
            isCompleted ? (
              <Badge variant="success" icon={CheckCircle2} size="sm">
                Passed {scorePercent != null ? `(${scorePercent}%)` : ''}
              </Badge>
            ) : isCooldown ? (
              <Badge variant="warning" icon={Clock} size="sm">
                Cooldown active
              </Badge>
            ) : (
              <Badge variant="neutral" size="sm">
                {mission.difficulty || 'easy'}
              </Badge>
            )
          ) : (
            <Badge
              variant={mission.verificationType === 'photo_proof' ? 'primary' : 'self-reported'}
              size="sm"
            >
              {mission.verificationType === 'photo_proof'
                ? 'Photo proof eligible'
                : 'Self-reported'}
            </Badge>
          )}
        </div>

        {/* CTA Button */}
        <div>
          {isLearning ? (
            <Button
              size="sm"
              variant={isCompleted ? 'outline' : 'primary'}
              disabled={isCooldown}
              icon={isCompleted ? undefined : ArrowRight}
              onClick={() => onStartQuiz?.(mission)}
            >
              {isCompleted ? 'Retake Quiz' : 'Start Quiz'}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="primary"
              onClick={() => onLogAction?.(mission)}
            >
              Log Action
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
