/**
 * Dashboard — Phase 1 stub
 * Shows the full layout structure with sidebar, XP bar, and stat card placeholders.
 * All data is static sample data clearly labelled as such.
 * API connections and real data: Phase 3.
 */
import { useState } from 'react'
import {
  LayoutDashboard, Droplets, Trophy, AlertTriangle, BookOpen, Settings, Zap,
} from 'lucide-react'
import Sidebar from '../components/layout/Sidebar.jsx'
import StatCard from '../components/ui/StatCard.jsx'
import XPBar from '../components/ui/XPBar.jsx'
import Avatar from '../components/ui/Avatar.jsx'
import Badge from '../components/ui/Badge.jsx'

const SIDEBAR_LINKS = [
  { to: '/dashboard',   label: 'Overview',    icon: LayoutDashboard },
  { to: '/report',      label: 'Report Issue', icon: AlertTriangle   },
  { to: '/leaderboard', label: 'Leaderboard', icon: Trophy          },
  { to: '/awareness',   label: 'Awareness',   icon: BookOpen        },
  { to: '/impact',      label: 'Impact Map',  icon: Droplets        },
]

const SAMPLE_ACTIONS = [
  { id: 1, category: 'Fix Leak',           date: '2026-10-14', xp: 80 },
  { id: 2, category: 'Rainwater Harvest',  date: '2026-10-13', xp: 100 },
  { id: 3, category: 'Shorter Shower',     date: '2026-10-12', xp: 40  },
]

// Sample user — shown until Phase 2 auth is wired
const SAMPLE_USER = {
  username: 'YourName',
  level: 3,
  xp: 720,
  xpToNext: 280,
  streak: 4,
  totalWaterSaved: null,
  reportsSubmitted: null,
}

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div style={{ display: 'flex', minHeight: '100%' }}>
      <Sidebar
        links={SIDEBAR_LINKS}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((v) => !v)}
        title="Navigation"
      />

      <div
        className="page-enter"
        style={{ flex: 1, overflowX: 'hidden', padding: 'var(--space-8) var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}
      >
        {/* Sample data notice */}
        <div
          role="note"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            padding: 'var(--space-3) var(--space-4)',
            background: '#fff8e1',
            border: '1px dashed #ffca28',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <span aria-hidden="true" style={{ fontSize: '1.1rem' }}>⚠️</span>
          <p style={{ fontSize: 'var(--text-sm)', color: '#8d6e00', margin: 0, lineHeight: 'var(--leading-snug)' }}>
            <strong>Phase 1 — static layout only.</strong> All data shown here is sample data. Live data and real actions require sign-in, which connects in Phase 2.
          </p>
          <Badge variant="sample" style={{ flexShrink: 0 }}>Sample data</Badge>
        </div>

        {/* Profile + XP */}
        <div className="card" style={{ padding: 'var(--space-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
            <Avatar name={SAMPLE_USER.username} size="lg" ring />
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', margin: 0 }}>
                  {SAMPLE_USER.username}
                </h2>
                <Badge variant="primary">Citizen</Badge>
                {SAMPLE_USER.streak >= 3 && (
                  <Badge variant="gold" icon={Zap}>
                    {SAMPLE_USER.streak}d streak
                  </Badge>
                )}
              </div>
              <XPBar xp={SAMPLE_USER.xp} level={SAMPLE_USER.level} xpToNext={SAMPLE_USER.xpToNext} />
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
          <StatCard
            icon={Droplets}
            iconBg="var(--color-primary-50)"
            iconColor="var(--color-primary-600)"
            value="—"
            label="Litres saved"
            honesty="self-reported"
          />
          <StatCard
            icon={Zap}
            iconBg="#fff8e1"
            iconColor="var(--color-gold-600)"
            value={SAMPLE_USER.xp}
            label="Total XP earned"
            honesty="sample"
          />
          <StatCard
            icon={AlertTriangle}
            iconBg="var(--color-danger-bg)"
            iconColor="var(--color-danger)"
            value="—"
            label="Issues reported"
            honesty="sample"
          />
          <StatCard
            icon={Trophy}
            iconBg="var(--color-success-bg)"
            iconColor="var(--color-success)"
            value="—"
            label="Community rank"
            honesty="sample"
          />
        </div>

        {/* Recent actions */}
        <section aria-labelledby="recent-actions-heading">
          <h3
            id="recent-actions-heading"
            style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-lg)', marginBottom: 'var(--space-4)', color: 'var(--text-primary)' }}
          >
            Recent Actions
            <Badge variant="sample" style={{ marginLeft: 'var(--space-2)', verticalAlign: 'middle' }}>Sample data</Badge>
          </h3>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }} aria-label="Recent conservation actions">
              <thead>
                <tr style={{ background: 'var(--surface-raised)', borderBottom: '1px solid var(--surface-border)' }}>
                  {['Action', 'Date', 'XP Earned'].map((h) => (
                    <th key={h} style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SAMPLE_ACTIONS.map((a, i) => (
                  <tr key={a.id} style={{ borderBottom: i < SAMPLE_ACTIONS.length - 1 ? '1px solid var(--surface-border)' : 'none' }}>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)', fontWeight: 500 }}>{a.category}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{a.date}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <Badge variant="gold">+{a.xp} XP</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Phase notice */}
        <div style={{ padding: 'var(--space-4)', background: 'var(--surface-raised)', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)' }}>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', margin: 0 }}>
            <Settings size={15} aria-hidden="true" />
            Action logging, XP tracking, and real leaderboard data are implemented in Phase 3.
          </p>
        </div>
      </div>
    </div>
  )
}
