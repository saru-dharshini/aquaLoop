/**
 * Leaderboard — AquaLoop Phase 3B
 * Connected to live REST API with deterministic tie-breaking, city filtering, and sample data tagging.
 */

import { useState, useEffect } from 'react'
import { Trophy, Medal, Zap, Filter, Loader2 } from 'lucide-react'
import Avatar from '../components/ui/Avatar.jsx'
import Badge from '../components/ui/Badge.jsx'
import { api } from '../services/api.js'

const CITIES = ['All Cities', 'Mumbai', 'Pune', 'Bengaluru', 'Chennai', 'Delhi', 'Jaipur', 'Hyderabad']

const MEDAL_COLORS = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' }

export default function Leaderboard() {
  const [selectedCity, setSelectedCity] = useState('All Cities')
  const [leaders, setLeaders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true
    async function fetchLeaderboard() {
      setLoading(true)
      setError(null)
      try {
        const cityParam = selectedCity !== 'All Cities' ? selectedCity : undefined
        const res = await api.get('/leaderboard', {
          params: { city: cityParam, includeSample: true },
        })
        if (isMounted) {
          setLeaders(res.data.users || [])
        }
      } catch (err) {
        if (isMounted) {
          setError(err.userMessage || 'Failed to load leaderboard.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    fetchLeaderboard()
    return () => {
      isMounted = false
    }
  }, [selectedCity])

  const top3 = leaders.slice(0, 3)

  return (
    <div className="container page-enter" style={{ paddingBlock: 'var(--space-12)' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-4)' }}>
          <Trophy size={36} aria-hidden="true" style={{ color: 'var(--color-gold-400)' }} />
        </div>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-3xl)' }}>
          Community Leaderboard
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 'var(--space-2)' }}>
          Top conservation leaders ranked by validated XP and active streaks.
        </p>

        {/* City Filter Pills */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 'var(--space-2)',
            flexWrap: 'wrap',
            marginTop: 'var(--space-6)',
          }}
          role="group"
          aria-label="Filter leaderboard by city"
        >
          <Filter size={16} aria-hidden="true" style={{ color: 'var(--text-muted)' }} />
          {CITIES.map((c) => {
            const active = selectedCity === c
            return (
              <button
                key={c}
                type="button"
                onClick={() => setSelectedCity(c)}
                style={{
                  padding: 'var(--space-1) var(--space-3)',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: active ? 600 : 500,
                  background: active ? 'var(--color-primary-600)' : 'var(--surface-raised)',
                  color: active ? '#ffffff' : 'var(--text-secondary)',
                  border: `1px solid ${active ? 'var(--color-primary-600)' : 'var(--surface-border)'}`,
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                }}
              >
                {c}
              </button>
            )
          })}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <Loader2 className="spin" size={32} style={{ color: 'var(--color-primary-600)' }} />
        </div>
      ) : error ? (
        <div
          role="alert"
          style={{
            maxWidth: 500,
            margin: '0 auto',
            padding: 'var(--space-4)',
            background: '#ffebee',
            border: '1px solid #ef5350',
            borderRadius: 'var(--radius-md)',
            color: '#c62828',
            textAlign: 'center',
          }}
        >
          {error}
        </div>
      ) : leaders.length === 0 ? (
        <div
          className="card"
          style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center', padding: 'var(--space-8)' }}
        >
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>
            No conservation leaders found for {selectedCity}. Be the first to log an action!
          </p>
        </div>
      ) : (
        <>
          {/* Podium (Top 3) */}
          {top3.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: top3.length === 1 ? '1fr' : top3.length === 2 ? '1fr 1.15fr' : '1fr 1.15fr 1fr',
                gap: 'var(--space-4)',
                maxWidth: 600,
                margin: '0 auto var(--space-10)',
                alignItems: 'flex-end',
              }}
              aria-label="Top leaderboard positions"
            >
              {top3.length >= 3 ? (
                [top3[1], top3[0], top3[2]].map((u, i) => {
                  const realRank = i === 0 ? 2 : i === 1 ? 1 : 3
                  const height = realRank === 1 ? 140 : realRank === 2 ? 110 : 90
                  return (
                    <div
                      key={u.username}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 'var(--space-2)',
                        order: realRank === 1 ? 2 : realRank === 2 ? 1 : 3,
                      }}
                    >
                      <Avatar name={u.username} size={realRank === 1 ? 'lg' : 'md'} ring={realRank === 1} />
                      <Medal size={20} aria-hidden="true" style={{ color: MEDAL_COLORS[realRank] }} />
                      <span
                        style={{
                          fontFamily: 'var(--font-heading)',
                          fontWeight: 700,
                          fontSize: 'var(--text-sm)',
                          color: 'var(--text-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--space-1)',
                        }}
                      >
                        {u.username}
                        {u.isSample && <Badge variant="sample">Sample</Badge>}
                      </span>
                      <Badge variant="gold" icon={Zap}>
                        {u.xp} XP
                      </Badge>
                      <div
                        style={{
                          width: '100%',
                          height,
                          background:
                            realRank === 1
                              ? 'var(--color-gold-400)'
                              : realRank === 2
                              ? 'var(--color-neutral-300)'
                              : '#cd7f32',
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
                })
              ) : (
                top3.map((u) => (
                  <div
                    key={u.username}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                    }}
                  >
                    <Avatar name={u.username} size="lg" ring />
                    <Medal size={20} aria-hidden="true" style={{ color: MEDAL_COLORS[u.rank] || '#FFD700' }} />
                    <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700 }}>{u.username}</span>
                    <Badge variant="gold" icon={Zap}>{u.xp} XP</Badge>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Full table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }} aria-label="Full leaderboard">
              <thead>
                <tr style={{ background: 'var(--surface-raised)', borderBottom: '1px solid var(--surface-border)' }}>
                  {['Rank', 'Citizen', 'City', 'Level', 'Streak', 'XP'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: 'var(--space-3) var(--space-4)',
                        textAlign: 'left',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: 'var(--tracking-wide)',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leaders.map((u, i) => (
                  <tr
                    key={u.username}
                    style={{
                      borderBottom: i < leaders.length - 1 ? '1px solid var(--surface-border)' : 'none',
                      background: u.rank <= 3 ? 'rgba(255 202 40 / 0.04)' : undefined,
                    }}
                  >
                    <td
                      style={{
                        padding: 'var(--space-3) var(--space-4)',
                        fontFamily: 'var(--font-heading)',
                        fontWeight: 700,
                        color: MEDAL_COLORS[u.rank] || 'var(--text-muted)',
                        fontSize: 'var(--text-base)',
                      }}
                    >
                      {u.rank <= 3 ? (
                        <Medal size={18} aria-label={`Rank ${u.rank}`} style={{ color: MEDAL_COLORS[u.rank] }} />
                      ) : (
                        `#${u.rank}`
                      )}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <Avatar name={u.username} size="sm" />
                        <span style={{ fontWeight: 500, fontSize: 'var(--text-sm)' }}>{u.username}</span>
                        {u.isSample && <Badge variant="sample">Sample data</Badge>}
                      </div>
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                      {u.city || '—'}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <Badge variant="primary">Lv {u.level || 1}</Badge>
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      {u.streak ? <Badge variant="gold">🔥 {u.streak}d</Badge> : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <Badge variant="gold" icon={Zap}>
                        {u.xp} XP
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
