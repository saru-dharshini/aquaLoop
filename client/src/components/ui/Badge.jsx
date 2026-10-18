/**
 * Badge — AquaLoop pill / label component
 *
 * Props:
 *   variant : 'primary' | 'success' | 'warning' | 'danger' | 'navy' |
 *             'gold' | 'neutral' | 'sample' | 'self-reported'
 *   size    : 'sm' | 'md'  (default: 'md')
 *   icon    : Lucide icon rendered before children
 *   dot     : boolean — show coloured dot before text
 */
export default function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  icon: Icon,
  dot = false,
  className = '',
  style,
  ...rest
}) {
  const dotColors = {
    primary: 'var(--color-primary-600)',
    success: 'var(--color-success)',
    warning: 'var(--color-warning)',
    danger:  'var(--color-danger)',
    navy:    '#ffffff',
    gold:    'var(--color-navy-900)',
    neutral: 'var(--color-neutral-500)',
    sample:  '#8d6e00',
    'self-reported': '#1565c0',
  }

  return (
    <span
      className={`badge badge-${variant} ${className}`.trim()}
      style={{
        fontSize: size === 'sm' ? 'var(--text-xs)' : undefined,
        ...style,
      }}
      {...rest}
    >
      {dot && (
        <span
          aria-hidden="true"
          style={{
            display: 'inline-block',
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: dotColors[variant] || 'currentColor',
            flexShrink: 0,
          }}
        />
      )}
      {Icon && <Icon size={10} aria-hidden="true" />}
      {children}
    </span>
  )
}
