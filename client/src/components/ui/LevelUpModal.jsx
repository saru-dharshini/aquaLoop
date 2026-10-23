/**
 * LevelUpModal — AquaLoop Phase 5.3
 *
 * Celebrates genuine citizen tier promotions:
 * - Level 1: Droplet (0 – 499 XP)
 * - Level 2: Stream (500 – 1,499 XP)
 * - Level 3: River (1,500 – 3,499 XP)
 * - Level 4: Ocean Guardian (3,500+ XP)
 *
 * Features:
 * - Triggers zero-dependency canvas confetti upon presentation.
 * - Displays server-provided level and XP without fabricating perks.
 * - Screen-reader accessible dialog with Escape-key and backdrop dismissal.
 * - Respects prefers-reduced-motion.
 */

import { useEffect, useRef } from 'react'
import { Trophy, Crown, Waves, Droplet, ArrowRight, Sparkles } from 'lucide-react'
import Modal from './Modal.jsx'
import Button from './Button.jsx'
import Badge from './Badge.jsx'
import { fireConfetti } from '../../utils/confetti.js'

const TIER_DETAILS = {
  1: {
    name: 'Droplet',
    icon: Droplet,
    color: '#0097a7',
    tagline: 'Your conservation journey begins.',
    description: 'You have taken your first decisive steps toward citizen water stewardship.',
  },
  2: {
    name: 'Stream',
    icon: Waves,
    color: '#26c6da',
    tagline: 'Steady daily habits creating ripples.',
    description: 'Your continuous conservation efforts are flowing into verified neighborhood impact.',
  },
  3: {
    name: 'River',
    icon: Trophy,
    color: '#f9a825',
    tagline: 'A powerful current of civic impact.',
    description: 'You are now among the top water savers, driving measurable urban water resilience.',
  },
  4: {
    name: 'Ocean Guardian',
    icon: Crown,
    color: '#e91e63',
    tagline: 'Highest honor in the AquaLoop platform.',
    description: 'Master of water literacy and conservation. You protect the flow for all.',
  },
}

export default function LevelUpModal({
  isOpen = false,
  onClose,
  level = 2,
  xp = 0,
}) {
  const safeLevel = Math.min(Math.max(1, Number(level) || 1), 4)
  const tier = TIER_DETAILS[safeLevel] || TIER_DETAILS[1]
  const TierIcon = tier.icon
  const confettiCleanupRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      const handle = fireConfetti({
        particleCount: 85,
        spread: 80,
        startVelocity: 38,
      })
      confettiCleanupRef.current = handle.stop

      return () => {
        if (confettiCleanupRef.current) {
          confettiCleanupRef.current()
          confettiCleanupRef.current = null
        }
      }
    }
  }, [isOpen])

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tier Promotion"
      size="sm"
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          padding: 'var(--space-2) 0',
          gap: 'var(--space-4)',
        }}
      >
        {/* Tier Celebration Badge Halo */}
        <div
          className="shimmer-container"
          style={{
            width: 76,
            height: 76,
            borderRadius: '50%',
            background: 'var(--surface-raised)',
            border: `3px solid ${tier.color}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: tier.color,
            boxShadow: `0 0 24px ${tier.color}40`,
            marginBottom: 'var(--space-1)',
          }}
          aria-hidden="true"
        >
          <TierIcon size={38} className="animate-droplet-pulse" />
        </div>

        {/* Level & Title */}
        <div>
          <Badge variant="gold" icon={Sparkles} size="sm">
            RANK ADVANCED
          </Badge>
          <h3
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'var(--text-2xl)',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: 'var(--space-2) 0 4px 0',
            }}
          >
            Level {safeLevel} · {tier.name}
          </h3>
          <p
            style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              color: 'var(--color-primary-700)',
              margin: 0,
            }}
          >
            {tier.tagline}
          </p>
        </div>

        {/* Description & Current XP */}
        <div
          style={{
            padding: 'var(--space-4)',
            background: 'var(--surface-raised)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--surface-border)',
            width: '100%',
          }}
        >
          <p
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--text-secondary)',
              lineHeight: 'var(--leading-relaxed)',
              margin: '0 0 var(--space-3) 0',
            }}
          >
            {tier.description}
          </p>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid var(--surface-border)',
              paddingTop: 'var(--space-2)',
              fontSize: 'var(--text-xs)',
            }}
          >
            <span style={{ color: 'var(--text-muted)' }}>Current Verified XP</span>
            <strong style={{ color: 'var(--color-primary-800)' }}>
              {Number(xp || 0).toLocaleString()} XP
            </strong>
          </div>
        </div>

        {/* Acknowledge Button */}
        <Button
          variant="primary"
          size="md"
          icon={ArrowRight}
          style={{ width: '100%', marginTop: 'var(--space-2)' }}
          onClick={onClose}
        >
          Continue Conserving
        </Button>
      </div>
    </Modal>
  )
}
