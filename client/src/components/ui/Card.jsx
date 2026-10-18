/**
 * Card — AquaLoop reusable card component
 *
 * Props:
 *   variant  : 'base' | 'raised' | 'flat'  (default: 'base')
 *   padding  : boolean — apply .card-body padding (default: true)
 *   as       : element tag (default: 'div')
 *   header   : ReactNode — rendered in .card-header
 *   footer   : ReactNode — rendered in .card-footer
 *   All other props forwarded to the root element.
 */
import { forwardRef } from 'react'

const Card = forwardRef(function Card(
  {
    children,
    variant = 'base',
    padding = true,
    as: Tag = 'div',
    header,
    footer,
    className = '',
    style,
    ...rest
  },
  ref,
) {
  const variantClass = variant === 'raised' ? 'card card-raised' : variant === 'flat' ? '' : 'card'

  return (
    <Tag
      ref={ref}
      className={`${variantClass} ${className}`.trim()}
      style={style}
      {...rest}
    >
      {header && <div className="card-header">{header}</div>}
      {padding ? <div className="card-body">{children}</div> : children}
      {footer && <div className="card-footer">{footer}</div>}
    </Tag>
  )
})

export default Card
