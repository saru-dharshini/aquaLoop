/**
 * Toast — notification stack with auto-dismiss
 *
 * Usage:
 *   1. Wrap your app with <ToastProvider>
 *   2. Call useToast() anywhere to get { addToast }
 *   3. addToast({ message, type: 'success'|'error'|'warning'|'info', duration? })
 */
import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

const ICONS = {
  success: CheckCircle,
  error:   XCircle,
  warning: AlertTriangle,
  info:    Info,
}

const COLORS = {
  success: { border: 'var(--color-success)', icon: 'var(--color-success)', bg: 'var(--color-success-bg)' },
  error:   { border: 'var(--color-danger)',  icon: 'var(--color-danger)',  bg: 'var(--color-danger-bg)'  },
  warning: { border: 'var(--color-warning)', icon: 'var(--color-warning)', bg: 'var(--color-warning-bg)' },
  info:    { border: 'var(--color-info)',    icon: 'var(--color-info)',    bg: 'var(--color-info-bg)'    },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback(
    ({ message, type = 'info', duration = 4000 }) => {
      const id = ++idRef.current
      setToasts((prev) => [...prev.slice(-4), { id, message, type }]) // max 5 visible
      if (duration > 0) setTimeout(() => removeToast(id), duration)
      return id
    },
    [removeToast],
  )

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {createPortal(
        <div
          aria-live="polite"
          aria-label="Notifications"
          style={{
            position: 'fixed',
            bottom: 'var(--space-6)',
            right: 'var(--space-6)',
            zIndex: 2000,
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)',
            maxWidth: 380,
            width: 'calc(100% - var(--space-8))',
          }}
        >
          {toasts.map((toast) => {
            const Icon = ICONS[toast.type] || Info
            const colors = COLORS[toast.type] || COLORS.info
            return (
              <div
                key={toast.id}
                role="status"
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-3) var(--space-4)',
                  background: colors.bg,
                  border: `1px solid ${colors.border}`,
                  borderLeft: `4px solid ${colors.border}`,
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-md)',
                  animation: 'toastIn 200ms cubic-bezier(0, 0, 0.2, 1)',
                }}
              >
                <Icon size={18} aria-hidden="true" style={{ color: colors.icon, flexShrink: 0, marginTop: 1 }} />
                <p style={{ flex: 1, fontSize: 'var(--text-sm)', color: 'var(--text-primary)', lineHeight: 'var(--leading-snug)', margin: 0 }}>
                  {toast.message}
                </p>
                <button
                  onClick={() => removeToast(toast.id)}
                  aria-label="Dismiss notification"
                  style={{
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    padding: 2,
                    color: 'var(--text-muted)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    flexShrink: 0,
                  }}
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </div>
            )
          })}
        </div>,
        document.body,
      )}
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          [role="status"] { animation: none !important; }
        }
      `}</style>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
