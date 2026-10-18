import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div
      className="container page-enter"
      style={{
        paddingBlock: 'var(--space-16)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 'var(--space-6)',
      }}
    >
      <p
        aria-hidden="true"
        style={{ fontSize: '4rem', lineHeight: 1 }}
      >
        💧
      </p>
      <div>
        <h1
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'var(--text-4xl)',
            color: 'var(--color-navy-900)',
            marginBottom: 'var(--space-2)',
          }}
        >
          404
        </h1>
        <h2
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'var(--text-xl)',
            fontWeight: 500,
            color: 'var(--text-secondary)',
            marginBottom: 'var(--space-4)',
          }}
        >
          This page dried up
        </h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '30ch', margin: '0 auto' }}>
          The page you're looking for doesn't exist or has moved.
        </p>
      </div>
      <Link to="/" className="btn btn-primary">
        <Home size={16} aria-hidden="true" />
        Back to Home
      </Link>
    </div>
  )
}
