import { Link } from 'react-router-dom'
import { Droplets, Code2, ExternalLink } from 'lucide-react'

const FOOTER_LINKS = [
  {
    heading: 'Platform',
    links: [
      { label: 'Home',          to: '/'            },
      { label: 'Awareness',     to: '/awareness'   },
      { label: 'Report Issue',  to: '/report'      },
      { label: 'Leaderboard',   to: '/leaderboard' },
      { label: 'Impact Map',    to: '/impact'      },
    ],
  },
  {
    heading: 'Account',
    links: [
      { label: 'Sign In',        to: '/login'    },
      { label: 'Create Account', to: '/register' },
      { label: 'Dashboard',      to: '/dashboard'},
    ],
  },
  {
    heading: 'About',
    links: [
      { label: 'Open Data Sources', to: '/awareness', ext: false },
      {
        label: 'India-WRIS',
        href: 'https://indiawris.gov.in/',
        ext: true,
      },
      {
        label: 'data.gov.in',
        href: 'https://data.gov.in/',
        ext: true,
      },
    ],
  },
]

export default function Footer() {
  return (
    <footer
      role="contentinfo"
      style={{
        background: 'var(--color-navy-900)',
        color: 'var(--color-primary-100)',
        paddingBlock: 'var(--space-12)',
        marginTop: 'auto',
      }}
    >
      <div className="container">
        {/* Top row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'auto repeat(3, 1fr)',
            gap: 'var(--space-8)',
          }}
        >
          {/* Brand col */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', maxWidth: 240 }}>
            <Link
              to="/"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                fontFamily: 'var(--font-heading)',
                fontSize: 'var(--text-xl)',
                fontWeight: 800,
                color: '#ffffff',
                textDecoration: 'none',
              }}
              aria-label="AquaLoop home"
            >
              <Droplets size={22} aria-hidden="true" style={{ color: 'var(--color-primary-400)' }} />
              AquaLoop
            </Link>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-primary-200)', lineHeight: 'var(--leading-relaxed)' }}>
              Gamified water conservation. Free, transparent, community-driven.
            </p>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary-100)', opacity: 0.6 }}>
              Impact figures are self-reported and clearly labelled. No invented statistics.
            </p>
          </div>

          {/* Link columns */}
          {FOOTER_LINKS.map(({ heading, links }) => (
            <div key={heading} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <h3
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 700,
                  letterSpacing: 'var(--tracking-wider)',
                  textTransform: 'uppercase',
                  color: 'var(--color-primary-400)',
                  marginBottom: 'var(--space-1)',
                }}
              >
                {heading}
              </h3>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {links.map(({ label, to, href, ext }) => (
                  <li key={label}>
                    {href ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 'var(--text-sm)',
                          color: 'var(--color-primary-100)',
                          opacity: 0.8,
                          textDecoration: 'none',
                          transition: 'opacity var(--duration-quick) var(--ease-standard)',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = 0.8)}
                      >
                        {label}
                        {ext && <ExternalLink size={11} aria-hidden="true" />}
                      </a>
                    ) : (
                      <Link
                        to={to}
                        style={{
                          fontSize: 'var(--text-sm)',
                          color: 'var(--color-primary-100)',
                          opacity: 0.8,
                          textDecoration: 'none',
                          transition: 'opacity var(--duration-quick) var(--ease-standard)',
                          display: 'block',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = 0.8)}
                      >
                        {label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <hr style={{ borderColor: 'rgb(255 255 255 / 0.1)', marginBlock: 'var(--space-8)' }} />

        {/* Bottom row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--space-4)',
          }}
        >
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary-200)', opacity: 0.6 }}>
            © {new Date().getFullYear()} AquaLoop — ₹0 operating cost. Free &amp; open.
          </p>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="AquaLoop on GitHub (opens in new tab)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-1)',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-primary-200)',
              opacity: 0.7,
              textDecoration: 'none',
              transition: 'opacity var(--duration-quick) var(--ease-standard)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = 0.7)}
          >
            <Code2 size={14} aria-hidden="true" />
            Source
          </a>
        </div>
      </div>

      {/* Responsive footer columns */}
      <style>{`
        @media (max-width: 768px) {
          footer [style*="grid-template-columns"] {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 480px) {
          footer [style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </footer>
  )
}
