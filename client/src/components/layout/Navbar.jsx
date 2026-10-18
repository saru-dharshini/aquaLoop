import { NavLink, Link, useNavigate } from 'react-router-dom'
import { Droplets, Trophy, BookOpen, AlertTriangle, Menu, LogOut, LayoutDashboard } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import Avatar from '../ui/Avatar.jsx'

const NAV_LINKS = [
  { to: '/',            label: 'Home',        icon: null           },
  { to: '/awareness',   label: 'Awareness',   icon: BookOpen       },
  { to: '/report',      label: 'Report',      icon: AlertTriangle  },
  { to: '/leaderboard', label: 'Leaderboard', icon: Trophy         },
  { to: '/impact',      label: 'Impact',      icon: null           },
]

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    setMobileOpen(false)
    navigate('/')
  }

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
            {isAuthenticated && (
              <li>
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) =>
                    `navbar-link${isActive ? ' active' : ''}`
                  }
                >
                  <LayoutDashboard size={15} aria-hidden="true" />
                  Dashboard
                </NavLink>
              </li>
            )}
          </ul>
        </nav>

        {/* Auth actions */}
        <div className="navbar-actions">
          {isAuthenticated && user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <Link
                to="/dashboard"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
                title="Go to Dashboard"
              >
                <Avatar name={user.username} size="sm" />
                <span
                  style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: 600,
                    maxWidth: 120,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {user.username}
                </span>
              </Link>
              <button
                onClick={handleLogout}
                className="btn btn-ghost btn-sm"
                aria-label="Sign out of AquaLoop"
                title="Sign Out"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                <LogOut size={14} aria-hidden="true" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Get Started
              </Link>
            </>
          )}

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
            {isAuthenticated && (
              <li>
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) =>
                    `navbar-link${isActive ? ' active' : ''}`
                  }
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                  onClick={() => setMobileOpen(false)}
                >
                  <LayoutDashboard size={16} aria-hidden="true" />
                  Dashboard
                </NavLink>
              </li>
            )}
            <li
              style={{
                borderTop: '1px solid var(--surface-border)',
                paddingTop: 'var(--space-2)',
                marginTop: 'var(--space-1)',
                display: 'flex',
                gap: 'var(--space-2)',
              }}
            >
              {isAuthenticated && user ? (
                <button
                  onClick={handleLogout}
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%' }}
                >
                  <LogOut size={14} aria-hidden="true" />
                  Sign Out ({user.username})
                </button>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => setMobileOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => setMobileOpen(false)}
                  >
                    Get Started
                  </Link>
                </>
              )}
            </li>
          </ul>
        </nav>
      )}
    </header>
  )
}
