/**
 * Button — AquaLoop reusable button component
 *
 * Props:
 *   variant   : 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'  (default: 'primary')
 *   size      : 'sm' | 'md' | 'lg'  (default: 'md')
 *   as        : element tag or component (default: 'button')
 *   loading   : boolean — shows spinner, disables interaction
 *   icon      : Lucide icon component rendered before children
 *   iconRight : Lucide icon component rendered after children
 *   All other props (type, onClick, disabled, href, …) are forwarded.
 */
import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'

const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    as: Tag = 'button',
    loading = false,
    icon: Icon,
    iconRight: IconRight,
    className = '',
    disabled,
    ...rest
  },
  ref,
) {
  const sizeClass = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : ''

  return (
    <Tag
      ref={ref}
      className={`btn btn-${variant} ${sizeClass} ${className}`.trim()}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <Loader2
          size={size === 'lg' ? 18 : 15}
          aria-hidden="true"
          style={{
            animation: 'spin 0.8s linear infinite',
          }}
        />
      ) : (
        Icon && <Icon size={size === 'lg' ? 18 : 15} aria-hidden="true" />
      )}
      {children}
      {!loading && IconRight && (
        <IconRight size={size === 'lg' ? 18 : 15} aria-hidden="true" />
      )}
    </Tag>
  )
})

export default Button
