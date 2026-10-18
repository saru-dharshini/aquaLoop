/**
 * Modal — accessible focus-trap dialog
 *
 * Props:
 *   isOpen    : boolean
 *   onClose   : () => void
 *   title     : string (rendered in header, used for aria-labelledby)
 *   size      : 'sm' | 'md' | 'lg'  (default: 'md')
 *   hideClose : boolean — hide the ✕ close button
 *   children  : dialog body content
 *   footer    : ReactNode — rendered below body
 */
import { useEffect, useRef, useCallback } from 'react'
import { X } from 'lucide-react'
import { createPortal } from 'react-dom'

const SIZES = { sm: 400, md: 560, lg: 760 }

export default function Modal({
  isOpen,
  onClose,
  title,
  size = 'md',
  hideClose = false,
  children,
  footer,
}) {
  const dialogRef = useRef(null)
  const titleId = `modal-title-${useRef(Math.random().toString(36).slice(2)).current}`

  // Close on Escape
  const handleKeyDown = useCallback(
    (e) => { if (e.key === 'Escape') onClose?.() },
    [onClose],
  )

  // Focus trap
  useEffect(() => {
    if (!isOpen) return
    const dialog = dialogRef.current
    if (!dialog) return

    const focusable = dialog.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    function trap(e) {
      if (e.key !== 'Tab') return
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus() }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus() }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    dialog.addEventListener('keydown', trap)
    first?.focus()

    // Lock body scroll
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      dialog.removeEventListener('keydown', trap)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  return createPortal(
    <div
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-4)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.() }}
    >
      {/* Backdrop */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgb(0 0 0 / 0.45)',
          backdropFilter: 'none',
          animation: 'fadeIn 150ms ease',
        }}
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: SIZES[size] || SIZES.md,
          background: 'var(--surface-base)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--surface-border)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          animation: 'slideUp 200ms cubic-bezier(0, 0, 0.2, 1)',
        }}
      >
        {/* Header */}
        {(title || !hideClose) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 'var(--space-4) var(--space-6)',
              borderBottom: '1px solid var(--surface-border)',
              flexShrink: 0,
            }}
          >
            {title && (
              <h2
                id={titleId}
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'var(--text-lg)',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  margin: 0,
                }}
              >
                {title}
              </h2>
            )}
            {!hideClose && (
              <button
                onClick={onClose}
                aria-label="Close dialog"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  border: 'none',
                  background: 'none',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  marginLeft: 'auto',
                  flexShrink: 0,
                  transition: 'background var(--duration-quick) var(--ease-standard), color var(--duration-quick) var(--ease-standard)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--surface-overlay)'
                  e.currentTarget.style.color = 'var(--text-primary)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'none'
                  e.currentTarget.style.color = 'var(--text-muted)'
                }}
              >
                <X size={18} aria-hidden="true" />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div style={{ padding: 'var(--space-6)', overflowY: 'auto', flex: 1 }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            style={{
              padding: 'var(--space-4) var(--space-6)',
              borderTop: '1px solid var(--surface-border)',
              background: 'var(--surface-raised)',
              borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
              display: 'flex',
              gap: 'var(--space-2)',
              justifyContent: 'flex-end',
              flexShrink: 0,
            }}
          >
            {footer}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @media (prefers-reduced-motion: reduce) {
          [role="dialog"] { animation: none !important; }
        }
      `}</style>
    </div>,
    document.body,
  )
}
