/**
 * AchievementUnlockModal — AquaLoop Phase 5.3
 *
 * Celebrates newly unlocked citizen achievement badges.
 *
 * Features:
 * - Displays badge name, tier, and icon using actual server data.
 * - Multi-badge queue management: iterates through all newly awarded badges
 *   sequentially without dropping any notifications.
 * - High-DPI canvas confetti burst for each unlocked badge.
 * - Subtle tier styling (Bronze, Silver, Gold, Platinum) with metallic borders and glows.
 * - Accessible focus trapping, Escape key dismissal, and reduced-motion support.
 */

import { useState, useEffect, useRef } from 'react'
import {
  Award,
  Droplet,
  BookOpen,
  Wrench,
  Flame,
  Shield,
  Sparkles,
  Calendar,
  ShieldCheck,
  Crown,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react'
import Modal from './Modal.jsx'
import Button from './Button.jsx'
import Badge from './Badge.jsx'
import { fireConfetti } from '../../utils/confetti.js'

const ICON_MAP = {
  Droplet,
  BookOpen,
  Wrench,
  Flame,
  Shield,
  Sparkles,
  Calendar,
  Award,
  ShieldCheck,
  Crown,
}

const TIER_THEMES = {
  bronze: {
    name: 'Bronze Milestone',
    color: '#8d6e63',
    bg: '#efebe9',
    border: '#bcaaa4',
    glow: 'rgba(141, 110, 99, 0.25)',
  },
  silver: {
    name: 'Silver Milestone',
    color: '#546e7a',
    bg: '#eceff1',
    border: '#b0bec5',
    glow: 'rgba(84, 110, 122, 0.25)',
  },
  gold: {
    name: 'Gold Milestone',
    color: '#f9a825',
    bg: '#fffde7',
    border: '#ffe082',
    glow: 'rgba(249, 168, 37, 0.35)',
  },
  platinum: {
    name: 'Platinum Milestone',
    color: '#0097a7',
    bg: '#e0f7fa',
    border: '#80deea',
    glow: 'rgba(0, 151, 167, 0.35)',
  },
}

export default function AchievementUnlockModal({
  isOpen = false,
  onClose,
  badges = [],
}) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const confettiCleanupRef = useRef(null)

  // Trigger confetti burst on current badge view
  useEffect(() => {
    if (isOpen && badges && badges.length > 0) {
      const handle = fireConfetti({
        particleCount: 75,
        spread: 75,
        startVelocity: 35,
      })
      confettiCleanupRef.current = handle.stop

      return () => {
        if (confettiCleanupRef.current) {
          confettiCleanupRef.current()
          confettiCleanupRef.current = null
        }
      }
    }
  }, [isOpen, currentIndex, badges])

  if (!isOpen || !badges || badges.length === 0) {
    return null
  }

  const currentBadge = badges[currentIndex] || badges[0]
  const totalBadges = badges.length
  const isLast = currentIndex >= totalBadges - 1

  const tierKey = (currentBadge?.tier || 'bronze').toLowerCase()
  const theme = TIER_THEMES[tierKey] || TIER_THEMES.bronze
  const BadgeIcon = ICON_MAP[currentBadge?.icon] || Award

  function handleNext() {
    if (isLast) {
      setCurrentIndex(0)
      onClose?.()
    } else {
      setCurrentIndex((prev) => prev + 1)
    }
  }

  function handleDismiss() {
    setCurrentIndex(0)
    onClose?.()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleDismiss}
      title="Achievement Unlocked"
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
        {/* Multi-badge progression header indicator */}
        {totalBadges > 1 && (
          <span
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              color: 'var(--text-muted)',
              background: 'var(--surface-raised)',
              padding: '2px 10px',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--surface-border)',
            }}
          >
            Badge {currentIndex + 1} of {totalBadges}
          </span>
        )}

        {/* Badge Medal / Icon Halo */}
        <div
          className={`badge-unlocked-card ${tierKey === 'gold' || tierKey === 'platinum' ? 'animate-gold-glow' : ''}`}
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: theme.bg,
            border: `3px solid ${theme.color}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: theme.color,
            boxShadow: `0 0 20px ${theme.glow}`,
          }}
          aria-hidden="true"
        >
          <BadgeIcon size={40} />
        </div>

        {/* Badge Title & Tier Tag */}
        <div>
          <Badge
            variant={tierKey === 'gold' ? 'gold' : tierKey === 'platinum' ? 'primary' : 'neutral'}
            icon={Sparkles}
            size="sm"
          >
            {theme.name.toUpperCase()}
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
            {currentBadge.name}
          </h3>

          <p
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--text-secondary)',
              lineHeight: 'var(--leading-relaxed)',
              margin: 'var(--space-2) 0 0 0',
            }}
          >
            {currentBadge.description}
          </p>
        </div>

        {/* Milestone Confirmation Box */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-3) var(--space-4)',
            background: 'var(--surface-raised)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--surface-border)',
            width: '100%',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-success)',
            fontWeight: 600,
          }}
        >
          <CheckCircle2 size={16} />
          <span>Permanently recorded in your citizen profile</span>
        </div>

        {/* Action Button */}
        <Button
          variant="primary"
          size="md"
          icon={isLast ? CheckCircle2 : ArrowRight}
          style={{ width: '100%', marginTop: 'var(--space-2)' }}
          onClick={handleNext}
        >
          {isLast ? 'Claim Badge' : `Next Badge (${currentIndex + 2}/${totalBadges})`}
        </Button>
      </div>
    </Modal>
  )
}
