import { Link } from 'react-router-dom'
import {
  Droplets,
  ArrowRight,
  ShieldCheck,
  Zap,
  MapPin,
  BarChart3,
} from 'lucide-react'

const FEATURES = [
  {
    icon: Zap,
    color: 'var(--color-gold-400)',
    bg: '#fff8e1',
    title: 'Earn XP for Every Drop',
    description:
      'Log water-saving actions — fixing leaks, harvesting rainwater, shorter showers — and earn verified XP towards community rank.',
  },
  {
    icon: MapPin,
    color: 'var(--color-danger)',
    bg: 'var(--color-danger-bg)',
    title: 'Report Water Issues',
    description:
      'Spot a leak or contaminated source? Pin it on the map and alert your community. Track resolution status in real time.',
  },
  {
    icon: BarChart3,
    color: 'var(--color-primary-600)',
    bg: 'var(--color-primary-50)',
    title: 'Track Real Impact',
    description:
      'See your community\'s aggregated savings — clearly labelled as self-reported until verified. No inflated numbers.',
  },
  {
    icon: ShieldCheck,
    color: 'var(--color-success)',
    bg: 'var(--color-success-bg)',
    title: 'Transparent by Design',
    description:
      'Every data point shows its source. Sample data is tagged. Self-reported figures are marked. Honesty is a feature.',
  },
]

export default function Home() {
  return (
    <div className="page-enter">
      {/* ── Hero ────────────────────────────────────────────── */}
      <section
        aria-labelledby="hero-heading"
        style={{
          background: 'linear-gradient(160deg, var(--color-primary-50) 0%, var(--surface-base) 55%)',
          borderBottom: '1px solid var(--surface-border)',
          paddingBlock: 'var(--space-16)',
        }}
      >
        <div className="container" style={{ textAlign: 'center', maxWidth: 'var(--container-md)' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              marginBottom: 'var(--space-6)',
              padding: 'var(--space-1) var(--space-3)',
              background: 'var(--color-primary-50)',
              border: '1px solid var(--color-primary-100)',
              borderRadius: 'var(--radius-pill)',
            }}
          >
            <Droplets size={14} aria-hidden="true" style={{ color: 'var(--color-primary-600)' }} />
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-primary-700)', letterSpacing: 'var(--tracking-wider)', textTransform: 'uppercase' }}>
              Water Conservation Platform
            </span>
          </div>

          <h1
            id="hero-heading"
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(2rem, 5vw, var(--text-5xl))',
              fontWeight: 800,
              letterSpacing: 'var(--tracking-tight)',
              color: 'var(--color-navy-900)',
              marginBottom: 'var(--space-6)',
              lineHeight: 1.1,
            }}
          >
            Every drop saved<br />
            <span style={{ color: 'var(--color-primary-600)' }}>earns your community</span>
          </h1>

          <p
            style={{
              fontSize: 'var(--text-lg)',
              color: 'var(--text-secondary)',
              maxWidth: '38ch',
              margin: '0 auto var(--space-8)',
              lineHeight: 'var(--leading-relaxed)',
            }}
          >
            Log conservation actions, report water issues, and see your
            neighbourhood's real, verified environmental impact — all for free.
          </p>

          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary btn-lg">
              Start Conserving
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link to="/impact" className="btn btn-secondary btn-lg">
              View Community Impact
            </Link>
          </div>

          {/* Honesty notice */}
          <p
            style={{
              marginTop: 'var(--space-6)',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-1)',
            }}
          >
            <ShieldCheck size={13} aria-hidden="true" style={{ color: 'var(--color-success)' }} />
            Impact figures are self-reported and clearly labelled. No invented data.
          </p>
        </div>
      </section>

      {/* ── Features Grid ───────────────────────────────────── */}
      <section
        aria-labelledby="features-heading"
        style={{ paddingBlock: 'var(--space-16)', background: 'var(--surface-raised)' }}
      >
        <div className="container">
          <h2
            id="features-heading"
            style={{
              textAlign: 'center',
              fontFamily: 'var(--font-heading)',
              fontSize: 'var(--text-3xl)',
              marginBottom: 'var(--space-2)',
              color: 'var(--color-navy-900)',
            }}
          >
            How AquaLoop works
          </h2>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: 'var(--space-12)' }}>
            A transparent loop — you act, community grows, impact is tracked honestly.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 'var(--space-6)',
            }}
          >
            {FEATURES.map(({ icon: Icon, color, bg, title, description }) => (
              <article
                key={title}
                className="card"
                style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 'var(--radius-sm)',
                    background: bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={22} aria-hidden="true" style={{ color }} />
                </div>
                <div>
                  <h3
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: 'var(--text-lg)',
                      fontWeight: 600,
                      marginBottom: 'var(--space-2)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {title}
                  </h3>
                  <p style={{ fontSize: 'var(--text-sm)', lineHeight: 'var(--leading-relaxed)', color: 'var(--text-secondary)' }}>
                    {description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Sample Impact Banner ─────────────────────────────── */}
      <section
        aria-labelledby="impact-preview-heading"
        style={{
          paddingBlock: 'var(--space-12)',
          background: 'var(--surface-base)',
          borderTop: '1px solid var(--surface-border)',
        }}
      >
        <div className="container" style={{ textAlign: 'center' }}>
          <h2
            id="impact-preview-heading"
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'var(--text-2xl)',
              marginBottom: 'var(--space-2)',
              color: 'var(--color-navy-900)',
            }}
          >
            Community at a glance
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-8)', fontSize: 'var(--text-sm)' }}>
            Figures below are placeholder values.{' '}
            <span className="badge badge-sample" style={{ verticalAlign: 'middle' }}>
              Sample data
            </span>
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 'var(--space-4)',
              maxWidth: 720,
              margin: '0 auto',
            }}
          >
            {[
              { value: '—',     label: 'Litres saved',     note: 'Self-reported' },
              { value: '—',     label: 'Issues reported',  note: 'Community' },
              { value: '—',     label: 'Active members',   note: 'Registered' },
              { value: '—',     label: 'Issues resolved',  note: 'Verified' },
            ].map(({ value, label, note }) => (
              <div
                key={label}
                className="stat-card"
                style={{ textAlign: 'center', alignItems: 'center' }}
              >
                <p
                  className="stat-card-value"
                  aria-label={`${label}: no data yet`}
                  style={{ fontSize: 'var(--text-4xl)', color: 'var(--color-primary-600)' }}
                >
                  {value}
                </p>
                <p className="stat-card-label">{label}</p>
                <span className="badge badge-sample">{note}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Footer ──────────────────────────────────────── */}
      <section
        style={{
          paddingBlock: 'var(--space-16)',
          background: 'var(--color-navy-900)',
          textAlign: 'center',
        }}
      >
        <div className="container">
          <Droplets
            size={40}
            aria-hidden="true"
            style={{ color: 'var(--color-primary-400)', marginBottom: 'var(--space-4)', display: 'block', margin: '0 auto var(--space-4)' }}
          />
          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              color: '#ffffff',
              fontSize: 'var(--text-2xl)',
              marginBottom: 'var(--space-4)',
            }}
          >
            Ready to make every litre count?
          </h2>
          <p style={{ color: 'var(--color-primary-200)', marginBottom: 'var(--space-8)', fontSize: 'var(--text-base)' }}>
            Join your community, log actions, and build a verified impact record. Free, always.
          </p>
          <Link to="/register" className="btn btn-primary btn-lg">
            Create your free account
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  )
}
