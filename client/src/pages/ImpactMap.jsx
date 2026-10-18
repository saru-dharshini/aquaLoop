/**
 * ImpactMap — Phase 1 stub
 * Shows community impact with map placeholder and stat cards.
 * Real Leaflet map and live data: Phase 4/5.
 */
import { BarChart3, MapPin, Droplets, Users, CheckCircle } from 'lucide-react'
import StatCard from '../components/ui/StatCard.jsx'
import Badge from '../components/ui/Badge.jsx'

export default function ImpactMap() {
  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      {/* Header */}
      <div
        style={{
          borderBottom: '1px solid var(--surface-border)',
          padding: 'var(--space-8) var(--space-6)',
          background: 'var(--surface-raised)',
        }}
      >
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
            <BarChart3 size={28} aria-hidden="true" style={{ color: 'var(--color-primary-600)' }} />
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-3xl)', margin: 0 }}>Community Impact</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '55ch' }}>
            Aggregated water conservation impact from all community members. Every figure is clearly labelled with its source and confidence level.
          </p>
          <Badge variant="sample" style={{ marginTop: 'var(--space-3)' }}>Sample data — live aggregation in Phase 5</Badge>
        </div>
      </div>

      {/* Stats */}
      <div style={{ padding: 'var(--space-8) var(--space-6)', background: 'var(--surface-base)', borderBottom: '1px solid var(--surface-border)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
            <StatCard icon={Droplets} iconBg="var(--color-primary-50)" iconColor="var(--color-primary-600)"
              value="—" label="Litres saved this month" honesty="self-reported" />
            <StatCard icon={Users} iconBg="var(--color-success-bg)" iconColor="var(--color-success)"
              value="—" label="Active community members" honesty="sample" />
            <StatCard icon={MapPin} iconBg="var(--color-danger-bg)" iconColor="var(--color-danger)"
              value="—" label="Issues reported" honesty="sample" />
            <StatCard icon={CheckCircle} iconBg="var(--color-success-bg)" iconColor="var(--color-success)"
              value="—" label="Issues resolved" honesty="sample" />
          </div>
        </div>
      </div>

      {/* Map placeholder */}
      <div style={{ flex: 1, padding: 'var(--space-8) var(--space-6)' }}>
        <div className="container">
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', marginBottom: 'var(--space-4)' }}>
            Issue Map
          </h2>
          <div
            style={{
              width: '100%',
              minHeight: 400,
              background: 'var(--surface-raised)',
              border: '2px dashed var(--surface-border-strong)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-3)',
              color: 'var(--text-muted)',
            }}
            role="img"
            aria-label="Map placeholder — Leaflet with OpenStreetMap tiles coming in Phase 4"
          >
            <MapPin size={40} aria-hidden="true" style={{ color: 'var(--color-primary-400)' }} />
            <p style={{ fontSize: 'var(--text-base)', fontWeight: 500, textAlign: 'center', margin: 0 }}>
              Interactive map — Leaflet + OpenStreetMap
            </p>
            <Badge variant="sample">Phase 4 — map rendering not yet active</Badge>
            <p style={{ fontSize: 'var(--text-xs)', textAlign: 'center', maxWidth: '32ch', margin: 0 }}>
              Will show geo-tagged community reports as pins with status, category, and upvote data.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
