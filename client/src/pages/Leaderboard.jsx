/**
 * Leaderboard — Phase 1 stub with realistic layout
 * Shows community ranking structure. All data is sample data.
 * Real data wired in Phase 3.
 */
import { Trophy, Medal, Zap } from 'lucide-react'
import Avatar from '../components/ui/Avatar.jsx'
import Badge from '../components/ui/Badge.jsx'

const SAMPLE_LEADERS = [
  { rank: 1,  username: 'Priya_S',       xp: 4820, level: 12, city: 'Mumbai'    },
  { rank: 2,  username: 'RaviKumar',      xp: 4410, level: 11, city: 'Pune'      },
  { rank: 3,  username: 'AnjaliW',        xp: 3990, level: 10, city: 'Bengaluru' },
  { rank: 4,  username: 'HarshV',         xp: 3550, level: 9,  city: 'Jaipur'    },
  { rank: 5,  username: 'SnehaM',         xp: 3120, level: 8,  city: 'Chennai'   },
  { rank: 6,  username: 'Deepak_R',       xp: 2900, level: 7,  city: 'Hyderabad' },
  { rank: 7,  username: 'NehaN',          xp: 2650, level: 7,  city: 'Kolkata'   },
  { rank: 8,  username: 'ArunK',          xp: 2400, level: 6,  city: 'Delhi'     },
  { rank: 9,  username: 'MeenaB',         xp: 2200, level: 6,  city: 'Ahmedabad' },
  { rank: 10, username: 'SureshT',        xp: 2050, level: 5,  city: 'Surat'     },
]

const MEDAL_COLORS = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' }

export default function Leaderboard() {
  const top3 = SAMPLE_LEADERS.slice(0, 3)

  return (
    <div className="container page-enter" style={{ paddingBlock: 'var(--space-12)' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-4)' }}>
          <Trophy size={36} aria-hidden="true" style={{ color: 'var(--color-gold-400)' }} />
        </div>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-3xl)' }}>Community Leaderboard</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 'var(--space-2)' }}>
          Top conservers ranked by XP — updated daily.{' '}
          <Badge variant="sample">Sample data</Badge>
        </p>
      </div>

      {/* Podium */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.15fr 1fr',
          gap: 'var(--space-4)',
          maxWidth: 600,
          margin: '0 auto var(--space-10)',
          alignItems: 'flex-end',
        }}
        aria-label="Top 3 leaderboard positions"
      >
        {[top3[1], top3[0], top3[2]].filter(Boolean).map((u, i) => {
          const realRank = i === 0 ? 2 : i === 1 ? 1 : 3
          const height = realRank === 1 ? 150 : realRank === 2 ? 120 : 100
          return (
            <div
              key={u.username}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)', order: realRank === 1 ? 2 : realRank === 2 ? 1 : 3 }}
            >
              <Avatar name={u.username} size={realRank === 1 ? 'lg' : 'md'} />
              <Medal size={20} aria-hidden="true" style={{ color: MEDAL_COLORS[realRank] }} />
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{u.username}</span>
              <Badge variant="gold" icon={Zap}>{u.xp} XP</Badge>
              <div
                style={{
                  width: '100%',
                  height,
                  background: realRank === 1 ? 'var(--color-gold-400)' : realRank === 2 ? 'var(--color-neutral-300)' : '#cd7f32',
                  borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 800,
                  fontSize: 'var(--text-2xl)',
                  color: realRank === 1 ? 'var(--color-navy-900)' : '#ffffff',
                }}
                aria-hidden="true"
              >
                {realRank}
              </div>
            </div>
          )
        })}
      </div>

      {/* Full table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }} aria-label="Full leaderboard">
          <thead>
            <tr style={{ background: 'var(--surface-raised)', borderBottom: '1px solid var(--surface-border)' }}>
              {['Rank', 'User', 'City', 'Level', 'XP'].map((h) => (
                <th key={h} style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SAMPLE_LEADERS.map((u, i) => (
              <tr key={u.rank} style={{ borderBottom: i < SAMPLE_LEADERS.length - 1 ? '1px solid var(--surface-border)' : 'none', background: u.rank <= 3 ? 'rgba(255 202 40 / 0.04)' : undefined }}>
                <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-heading)', fontWeight: 700, color: MEDAL_COLORS[u.rank] || 'var(--text-muted)', fontSize: 'var(--text-base)' }}>
                  {u.rank <= 3 ? <Medal size={18} aria-label={`Rank ${u.rank}`} style={{ color: MEDAL_COLORS[u.rank] }} /> : `#${u.rank}`}
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <Avatar name={u.username} size="sm" />
                    <span style={{ fontWeight: 500, fontSize: 'var(--text-sm)' }}>{u.username}</span>
                  </div>
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{u.city}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}><Badge variant="primary">Lv {u.level}</Badge></td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}><Badge variant="gold" icon={Zap}>{u.xp}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{ textAlign: 'center', marginTop: 'var(--space-6)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
        City filter, pagination, and real data arrive in Phase 3.
      </p>
    </div>
  )
}
