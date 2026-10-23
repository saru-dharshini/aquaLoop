/**
 * AchievementWall — AquaLoop Phase 5.5
 *
 * Polished achievement showcase displaying:
 * - Real badges returned by GET /api/v1/game/badges.
 * - Distinct visual presentation for unlocked vs locked badges.
 * - Accurate unlocked count and overall completion percentage.
 * - Dynamic tier filtering (Bronze, Silver, Gold, Platinum) derived strictly from data.
 * - Interactive badge inspection dialog showing server name, tier, and criteria.
 * - Accessible keyboard navigation and reduced-motion support.
 */

import { useState, useMemo } from 'react'
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
  Lock,
  CheckCircle2,
  Filter,
} from 'lucide-react'
import Badge from './Badge.jsx'
import Button from './Button.jsx'
import Modal from './Modal.jsx'

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

const TIER_METALLICS = {
  bronze: {
    name: 'Bronze Tier',
    color: '#8d6e63',
    bg: '#efebe9',
    border: '#bcaaa4',
  },
  silver: {
    name: 'Silver Tier',
    color: '#546e7a',
    bg: '#eceff1',
    border: '#b0bec5',
  },
  gold: {
    name: 'Gold Tier',
    color: '#f9a825',
    bg: '#fffde7',
    border: '#ffe082',
  },
  platinum: {
    name: 'Platinum Tier',
    color: '#0097a7',
    bg: '#e0f7fa',
    border: '#80deea',
  },
}

export default function AchievementWall({
  badges = [],
  userBadgeIds = new Set(),
  className = '',
  style = {},
}) {
  const [selectedTier, setSelectedTier] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'unlocked' | 'locked'
  const [inspectingBadge, setInspectingBadge] = useState(null)

  // Derive dynamic list of tiers actually present in badge catalog
  const availableTiers = useMemo(() => {
    const tiers = new Set()
    badges.forEach((b) => {
      if (b.tier) tiers.add(b.tier.toLowerCase())
    })
    return Array.from(tiers)
  }, [badges])

  // Compute accurate completion stats
  const totalCount = badges.length
  const unlockedCount = useMemo(() => {
    return badges.filter((b) => userBadgeIds.has(b.slug || b.badgeSlug)).length
  }, [badges, userBadgeIds])

  const completionPct = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0

  // Filter badges
  const filteredBadges = useMemo(() => {
    return badges.filter((b) => {
      const isUnlocked = userBadgeIds.has(b.slug || b.badgeSlug)
      if (selectedTier !== 'all' && b.tier?.toLowerCase() !== selectedTier) {
        return false
      }
      if (statusFilter === 'unlocked' && !isUnlocked) return false
      if (statusFilter === 'locked' && isUnlocked) return false
      return true
    })
  }, [badges, userBadgeIds, selectedTier, statusFilter])

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
      aria-label="Citizen Achievements & Badges Showcase"
    >
      {/* Header & Milestone Statistics */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
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
              Platform Achievements & Badges
            </h3>
            <Badge variant="gold" icon={Sparkles}>
              Milestones
            </Badge>
          </div>
          <p
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--text-secondary)',
              margin: '4px 0 0 0',
            }}
          >
            Unlocked through verified water savings, daily streaks, and literacy quizzes.
          </p>
        </div>

        {/* Completion Progress Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            padding: 'var(--space-2) var(--space-4)',
            background: 'var(--surface-raised)',
            borderRadius: 'var(--radius-pill)',
            border: '1px solid var(--surface-border)',
          }}
        >
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-muted)' }}>
            COLLECTION:
          </span>
          <strong style={{ fontSize: 'var(--text-sm)', color: 'var(--color-primary-800)' }}>
            {unlockedCount} / {totalCount} Badges ({completionPct}%)
          </strong>
        </div>
      </div>

      {/* Filter Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 'var(--space-3)',
          flexWrap: 'wrap',
        }}
      >
        {/* Tier Buttons */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setSelectedTier('all')}
            style={{
              padding: '4px 12px',
              borderRadius: 'var(--radius-pill)',
              border: `1px solid ${selectedTier === 'all' ? 'var(--color-primary-600)' : 'var(--surface-border)'}`,
              background: selectedTier === 'all' ? 'var(--color-primary-600)' : 'var(--surface-raised)',
              color: selectedTier === 'all' ? '#ffffff' : 'var(--text-secondary)',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all var(--duration-quick) var(--ease-standard)',
            }}
          >
            All Tiers ({totalCount})
          </button>

          {availableTiers.map((tier) => {
            const count = badges.filter((b) => b.tier?.toLowerCase() === tier).length
            const isSelected = selectedTier === tier
            const tierMeta = TIER_METALLICS[tier] || TIER_METALLICS.bronze

            return (
              <button
                key={tier}
                type="button"
                onClick={() => setSelectedTier(tier)}
                style={{
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-pill)',
                  border: `1px solid ${isSelected ? tierMeta.color : 'var(--surface-border)'}`,
                  background: isSelected ? tierMeta.color : 'var(--surface-base)',
                  color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  cursor: 'pointer',
                  transition: 'all var(--duration-quick) var(--ease-standard)',
                }}
              >
                {tier} ({count})
              </button>
            )
          })}
        </div>

        {/* Status Filter (All / Unlocked / Locked) */}
        <div style={{ display: 'flex', gap: 'var(--space-1)', alignItems: 'center' }}>
          <Filter size={14} style={{ color: 'var(--text-muted)', marginRight: 2 }} />
          {['all', 'unlocked', 'locked'].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              style={{
                padding: '2px 8px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: statusFilter === status ? 'var(--surface-overlay)' : 'transparent',
                color: statusFilter === status ? 'var(--color-primary-700)' : 'var(--text-muted)',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'capitalize',
                cursor: 'pointer',
              }}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Badges Grid */}
      {filteredBadges.length === 0 ? (
        <div
          style={{
            padding: 'var(--space-8) var(--space-4)',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: 'var(--text-sm)',
            background: 'var(--surface-raised)',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--surface-border)',
          }}
        >
          No badges found matching the selected filters.
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 'var(--space-4)',
          }}
        >
          {filteredBadges.map((b) => {
          const isUnlocked = userBadgeIds.has(b.slug || b.badgeSlug)
          const tierKey = (b.tier || 'bronze').toLowerCase()
          const tierMeta = TIER_METALLICS[tierKey] || TIER_METALLICS.bronze
          const BadgeIcon = ICON_MAP[b.icon] || Award

          return (
            <div
              key={b.slug}
              className={`card interactive-card ${isUnlocked ? 'badge-unlocked-card' : ''}`}
              onClick={() => setInspectingBadge(b)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setInspectingBadge(b)
                }
              }}
              aria-label={`${b.name} (${b.tier} tier) - ${isUnlocked ? 'Unlocked' : 'Locked'}`}
              style={{
                padding: 'var(--space-5)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'pointer',
                opacity: isUnlocked ? 1 : 0.68,
                background: isUnlocked ? 'var(--surface-base)' : 'var(--surface-raised)',
                border: isUnlocked
                  ? `2px solid ${tierMeta.color}`
                  : '1px solid var(--surface-border)',
                boxShadow: isUnlocked ? `0 2px 8px ${tierMeta.color}20` : 'none',
              }}
            >
              <div>
                {/* Header: Icon & Status */}
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
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: isUnlocked ? tierMeta.bg : 'var(--surface-base)',
                      border: isUnlocked ? `2px solid ${tierMeta.border}` : '1px solid var(--surface-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isUnlocked ? tierMeta.color : 'var(--text-muted)',
                    }}
                    aria-hidden="true"
                  >
                    {isUnlocked ? <BadgeIcon size={20} /> : <Lock size={18} />}
                  </div>

                  <Badge
                    variant={isUnlocked ? 'success' : 'neutral'}
                    icon={isUnlocked ? CheckCircle2 : Lock}
                    size="sm"
                  >
                    {isUnlocked ? 'Unlocked' : 'Locked'}
                  </Badge>
                </div>

                {/* Badge Name & Tier */}
                <h4
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 'var(--text-base)',
                    fontWeight: 700,
                    margin: '0 0 2px 0',
                    color: isUnlocked ? 'var(--text-primary)' : 'var(--text-secondary)',
                  }}
                >
                  {b.name}
                </h4>

                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: tierMeta.color,
                    textTransform: 'uppercase',
                    letterSpacing: 'var(--tracking-wide)',
                    display: 'block',
                    marginBottom: 'var(--space-2)',
                  }}
                >
                  {tierMeta.name}
                </span>

                {/* Description */}
                <p
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-secondary)',
                    lineHeight: 'var(--leading-relaxed)',
                    margin: 0,
                  }}
                >
                  {b.description}
                </p>
              </div>

              {/* Bottom Inspect Hint */}
              <div
                style={{
                  borderTop: '1px solid var(--surface-border)',
                  paddingTop: 'var(--space-2)',
                  marginTop: 'var(--space-3)',
                  fontSize: '10px',
                  color: isUnlocked ? 'var(--color-primary-700)' : 'var(--text-muted)',
                  fontWeight: 500,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>{isUnlocked ? '✓ Attained' : '🔒 Milestone Required'}</span>
                <span style={{ textDecoration: 'underline' }}>Inspect Details</span>
              </div>
            </div>
          )
        })}
      </div>
      )}

      {/* Badge Inspection Detail Dialog */}
      {inspectingBadge && (
        <Modal
          isOpen={Boolean(inspectingBadge)}
          onClose={() => setInspectingBadge(null)}
          title="Badge Details"
          size="sm"
        >
          {(() => {
            const isUnlocked = userBadgeIds.has(inspectingBadge.slug || inspectingBadge.badgeSlug)
            const tierKey = (inspectingBadge.tier || 'bronze').toLowerCase()
            const tierMeta = TIER_METALLICS[tierKey] || TIER_METALLICS.bronze
            const BadgeIcon = ICON_MAP[inspectingBadge.icon] || Award

            return (
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
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    background: tierMeta.bg,
                    border: `3px solid ${tierMeta.color}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: tierMeta.color,
                    boxShadow: isUnlocked ? `0 0 16px ${tierMeta.color}40` : 'none',
                  }}
                  aria-hidden="true"
                >
                  {isUnlocked ? <BadgeIcon size={36} /> : <Lock size={32} />}
                </div>

                <div>
                  <Badge
                    variant={isUnlocked ? 'success' : 'neutral'}
                    icon={isUnlocked ? CheckCircle2 : Lock}
                    size="sm"
                  >
                    {isUnlocked ? 'UNLOCKED MILESTONE' : 'LOCKED MILESTONE'}
                  </Badge>

                  <h3
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: 'var(--text-xl)',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      margin: 'var(--space-2) 0 4px 0',
                    }}
                  >
                    {inspectingBadge.name}
                  </h3>

                  <span
                    style={{
                      fontSize: 'var(--text-xs)',
                      fontWeight: 600,
                      color: tierMeta.color,
                      textTransform: 'uppercase',
                      letterSpacing: 'var(--tracking-wide)',
                    }}
                  >
                    {tierMeta.name}
                  </span>
                </div>

                <div
                  style={{
                    padding: 'var(--space-4)',
                    background: 'var(--surface-raised)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--surface-border)',
                    width: '100%',
                    textAlign: 'left',
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
                    <strong>Requirement:</strong> {inspectingBadge.description}
                  </p>

                  <div
                    style={{
                      borderTop: '1px solid var(--surface-border)',
                      paddingTop: 'var(--space-2)',
                      fontSize: '11px',
                      color: isUnlocked ? 'var(--color-success)' : 'var(--text-muted)',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                    }}
                  >
                    {isUnlocked ? (
                      <>
                        <CheckCircle2 size={14} />
                        <span>Verified in your citizen profile</span>
                      </>
                    ) : (
                      <>
                        <Lock size={14} />
                        <span>Complete requirement to permanently earn</span>
                      </>
                    )}
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="md"
                  style={{ width: '100%', marginTop: 'var(--space-2)' }}
                  onClick={() => setInspectingBadge(null)}
                >
                  Close
                </Button>
              </div>
            )
          })()}
        </Modal>
      )}
    </div>
  )
}
