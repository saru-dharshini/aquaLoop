/**
 * StatCard — metric display card with icon, value, label, and honesty badge slot.
 *
 * Props:
 *   icon      : Lucide icon component
 *   iconBg    : CSS background for the icon container
 *   iconColor : CSS color for the icon
 *   value     : string | number — the main metric
 *   label     : string — short descriptor
 *   sublabel  : string — secondary info (e.g. "vs last month")
 *   honesty   : 'sample' | 'self-reported' | null — shows honesty badge
 *   trend     : { direction: 'up'|'down'|'flat', value: string } (optional)
 */
import Badge from './Badge.jsx'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

const TREND_ICONS = { up: TrendingUp, down: TrendingDown, flat: Minus }
const TREND_COLORS = {
  up:   'var(--color-success)',
  down: 'var(--color-danger)',
  flat: 'var(--text-muted)',
}

export default function StatCard({
  icon: Icon,
  iconBg = 'var(--color-primary-50)',
  iconColor = 'var(--color-primary-600)',
  value = '—',
  label = '',
  sublabel,
  honesty,
  trend,
  style,
  className = '',
}) {
  const TrendIcon = trend ? TREND_ICONS[trend.direction] || Minus : null

  return (
    <div className={`stat-card ${className}`.trim()} style={style}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
        {Icon && (
          <div
            className="stat-card-icon"
            style={{ background: iconBg, color: iconColor }}
            aria-hidden="true"
          >
            <Icon size={22} />
          </div>
        )}
        {honesty && (
          <Badge
            variant={honesty === 'sample' ? 'sample' : honesty === 'verified' ? 'success' : 'self-reported'}
            size="sm"
          >
            {honesty === 'sample' ? 'Sample data' : honesty === 'verified' ? 'Verified' : 'Self-reported'}
          </Badge>
        )}
      </div>

      <p className="stat-card-value">{value}</p>
      <p className="stat-card-label">{label}</p>

      {(sublabel || trend) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', marginTop: 'var(--space-1)' }}>
          {TrendIcon && (
            <TrendIcon
              size={13}
              aria-hidden="true"
              style={{ color: TREND_COLORS[trend.direction] }}
            />
          )}
          {sublabel && (
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              {sublabel}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
