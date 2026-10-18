/**
 * Avatar — user avatar with initials fallback and optional ring
 *
 * Props:
 *   src     : image URL (optional)
 *   name    : user's display name (used for initials + alt text)
 *   size    : 'sm' (28px) | 'md' (40px) | 'lg' (56px) | 'xl' (80px)  default: 'md'
 *   ring    : boolean — show online indicator dot
 *   ringColor: CSS color for the dot  default: '--color-success'
 */
const SIZES = {
  sm: { wh: 28, font: 'var(--text-xs)' },
  md: { wh: 40, font: 'var(--text-sm)' },
  lg: { wh: 56, font: 'var(--text-base)' },
  xl: { wh: 80, font: 'var(--text-xl)' },
}

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// Deterministic hue from name string for consistent colour per user
function nameToHue(name = '') {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return Math.abs(hash) % 360
}

export default function Avatar({
  src,
  name = 'User',
  size = 'md',
  ring = false,
  ringColor = 'var(--color-success)',
  className = '',
  style,
}) {
  const { wh, font } = SIZES[size] || SIZES.md
  const initials = getInitials(name)
  const hue = nameToHue(name)

  const containerStyle = {
    position: 'relative',
    display: 'inline-flex',
    flexShrink: 0,
    width: wh,
    height: wh,
    borderRadius: '50%',
    ...style,
  }

  const innerStyle = {
    width: wh,
    height: wh,
    borderRadius: '50%',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: src
      ? 'var(--color-neutral-100)'
      : `hsl(${hue}, 55%, 88%)`,
    color: `hsl(${hue}, 55%, 30%)`,
    fontFamily: 'var(--font-heading)',
    fontSize: font,
    fontWeight: 700,
    userSelect: 'none',
    flexShrink: 0,
  }

  return (
    <span className={className} style={containerStyle} aria-label={name} role="img">
      <span style={innerStyle}>
        {src ? (
          <img
            src={src}
            alt={name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
        ) : (
          initials
        )}
      </span>
      {ring && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: 1,
            right: 1,
            width: Math.max(8, wh * 0.22),
            height: Math.max(8, wh * 0.22),
            borderRadius: '50%',
            background: ringColor,
            border: '2px solid var(--surface-base)',
          }}
        />
      )}
    </span>
  )
}
