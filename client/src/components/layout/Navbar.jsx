import { NavLink, Link } from 'react-router-dom'
import { Droplets, LayoutDashboard, Map, Trophy, BookOpen, AlertTriangle, Menu } from 'lucide-react'
import { useState } from 'react'

const NAV_LINKS = [
  { to: '/',           label: 'Home',        icon: null           },
  { to: '/awareness',  label: 'Awareness',   icon: BookOpen       },
  { to: '/report',     label: 'Report',      icon: AlertTriangle  },
  { to: '/leaderboard',label: 'Leaderboard', icon: Trophy         },
  { to: '/impact',     label: 'Impact',      icon: Map            },
]

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="navbar" role="banner">
      <div className="navbar-inner">
        {/* Brand */}
        <Link to="/" className="navbar-brand" aria-label="AquaLoop home">
          <Droplets
            size={22}
            aria-hidden="true"
            style={{ color: 'var(--color-primary-600)', flexShrink: 0 }}
          />
          Aqua<span className="brand-dot">Loop</span>
        </Link>

        {/* Desktop navigation */}
        <nav aria-label="Main navigation">
          <ul className="navbar-nav" role="list">
            {NAV_LINKS.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    `navbar-link${isActive ? ' active' : ''}`
                  }
                >
                  {Icon && <Icon size={15} aria-hidden="true" />}
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Auth actions (stubs — Phase 3) */}
        <div className="navbar-actions">
          <Link to="/login" className="btn btn-ghost btn-sm">
            Sign In
          </Link>
          <Link to="/register" className="btn btn-primary btn-sm">
            Get Started
          </Link>

          {/* Mobile menu toggle */}
          <button
            className="navbar-toggle"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            onClick={() => setMobileOpen((v) => !v)}
          >
            <Menu size={20} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Mobile navigation panel */}
      {mobileOpen && (
        <nav
          id="mobile-nav"
          aria-label="Mobile navigation"
          style={{
            position: 'absolute',
            top: 'var(--navbar-height)',
            left: 0,
            right: 0,
            background: 'var(--surface-base)',
            borderBottom: '1px solid var(--surface-border)',
            boxShadow: 'var(--shadow-md)',
            padding: 'var(--space-2)',
            zIndex: 99,
          }}
        >
          <ul
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-1)',
              listStyle: 'none',
            }}
            role="list"
          >
            {NAV_LINKS.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    `navbar-link${isActive ? ' active' : ''}`
                  }
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                  onClick={() => setMobileOpen(false)}
                >
                  {Icon && <Icon size={16} aria-hidden="true" />}
                  {label}
                </NavLink>
              </li>
            ))}
            <li style={{ borderTop: '1px solid var(--surface-border)', paddingTop: 'var(--space-2)', marginTop: 'var(--space-1)', display: 'flex', gap: 'var(--space-2)' }}>
              <Link to="/login" className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => setMobileOpen(false)}>
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => setMobileOpen(false)}>
                Get Started
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  )
}
