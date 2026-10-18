/**
 * Sidebar — collapsible desktop navigation panel
 * Shown on pages that need secondary navigation (Dashboard, Report, etc.)
 *
 * Props:
 *   links    : Array<{ to, label, icon, badge? }>
 *   isOpen   : boolean (controlled externally)
 *   onToggle : () => void
 *   title    : string (section heading)
 */
import { NavLink } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Sidebar({ links = [], isOpen = true, onToggle, title }) {
  return (
    <aside
      aria-label="Sidebar navigation"
      style={{
        width: isOpen ? 'var(--sidebar-width)' : 56,
        minWidth: isOpen ? 'var(--sidebar-width)' : 56,
        background: 'var(--surface-raised)',
        borderRight: '1px solid var(--surface-border)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
        padding: 'var(--space-4) var(--space-2)',
        transition: 'width var(--duration-standard) var(--ease-standard), min-width var(--duration-standard) var(--ease-standard)',
        overflow: 'hidden',
        flexShrink: 0,
        minHeight: 0,
      }}
    >
      {/* Collapse toggle */}
      <div style={{ display: 'flex', justifyContent: isOpen ? 'space-between' : 'center', alignItems: 'center', padding: 'var(--space-1) var(--space-2)' }}>
        {isOpen && title && (
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: 'var(--tracking-wider)', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            {title}
          </span>
        )}
        {onToggle && (
          <button
            onClick={onToggle}
            aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              border: 'none',
              background: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              flexShrink: 0,
              transition: 'background var(--duration-quick) var(--ease-standard)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-overlay)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
          >
            {isOpen ? <ChevronLeft size={16} aria-hidden="true" /> : <ChevronRight size={16} aria-hidden="true" />}
          </button>
        )}
      </div>

      {/* Nav links */}
      <nav aria-label="Sidebar links">
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }} role="list">
          {links.map(({ to, label, icon: Icon, badge }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  justifyContent: isOpen ? 'flex-start' : 'center',
                  padding: 'var(--space-2)',
                  width: '100%',
                  overflow: 'hidden',
                  position: 'relative',
                }}
                title={!isOpen ? label : undefined}
              >
                {Icon && <Icon size={18} aria-hidden="true" style={{ flexShrink: 0 }} />}
                {isOpen && (
                  <>
                    <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {label}
                    </span>
                    {badge != null && (
                      <span
                        style={{
                          fontSize: 'var(--text-xs)',
                          fontWeight: 700,
                          background: 'var(--color-primary-600)',
                          color: '#fff',
                          borderRadius: 'var(--radius-pill)',
                          padding: '0 6px',
                          lineHeight: '18px',
                          flexShrink: 0,
                        }}
                      >
                        {badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
