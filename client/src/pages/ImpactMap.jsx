/**
 * ImpactMap — AquaLoop Phase 4 Step 2
 *
 * Interactive Community Water Map using Leaflet & OpenStreetMap:
 * - Centered on India [20.5937, 78.9629], zoom 5.
 * - OpenStreetMap attribution.
 * - Categorised map pins with popups showing resolution status & honesty labels.
 * - Strict exclusion of sample/demo data from real community impact metrics.
 * - Accessible list view fallback with keyboard navigation.
 */
import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import {
  MapPin,
  List,
  CheckCircle2,
  Droplets,
  PlusCircle,
  Layers,
} from 'lucide-react'
import StatCard from '../components/ui/StatCard.jsx'
import Badge from '../components/ui/Badge.jsx'
import Button from '../components/ui/Button.jsx'
import api from '../services/api.js'
import { createCategoryIcon, getCategoryMetadata } from '../components/ui/MapMarkerIcons.js'

const INDIA_CENTER = [20.5937, 78.9629]
const DEFAULT_ZOOM = 5

function MapController() {
  const map = useMap()

  useEffect(() => {
    map.invalidateSize()
    const timer = setTimeout(() => {
      map.invalidateSize()
    }, 250)
    return () => clearTimeout(timer)
  }, [map])

  return null
}

export default function ImpactMap() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters & View Mode
  const [viewMode, setViewMode] = useState('map') // 'map' | 'list'
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [includeSample, setIncludeSample] = useState(true)

  useEffect(() => {
    async function fetchReports() {
      try {
        setLoading(true)
        setError(null)
        const res = await api.get('/reports', {
          params: {
            includeSample: true,
            limit: 100,
          },
        })
        setReports(res.data.reports || [])
      } catch (err) {
        setError(err.userMessage || 'Could not load community reports')
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [])

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (!includeSample && r.isSample) return false
      if (selectedCategory !== 'all' && r.type !== selectedCategory) return false
      if (selectedStatus !== 'all' && r.status !== selectedStatus) return false
      return true
    })
  }, [reports, selectedCategory, selectedStatus, includeSample])

  // Real Community Metrics (Strictly excludes demo/sample data)
  const realMetrics = useMemo(() => {
    const realReports = reports.filter((r) => !r.isSample)
    const totalReal = realReports.length
    const resolvedReal = realReports.filter((r) => r.status === 'resolved').length
    const measuredLitres = realReports.reduce(
      (sum, r) => sum + (Number(r.measuredLitresSaved) || 0),
      0,
    )
    return {
      totalReal,
      resolvedReal,
      measuredLitres,
    }
  }, [reports])

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      {/* Header */}
      <div
        style={{
          borderBottom: '1px solid var(--surface-border)',
          padding: 'var(--space-6) var(--space-6)',
          background: 'var(--surface-raised)',
        }}
      >
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
                <MapPin size={28} style={{ color: 'var(--color-primary-600)' }} />
                <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-3xl)', margin: 0 }}>
                  Community Water Map
                </h1>
              </div>
              <p style={{ color: 'var(--text-secondary)', margin: 0, maxWidth: '60ch' }}>
                Explore live, geo-tagged civic water reports across India. Pin a leak or check on issues in your neighbourhood.
              </p>
            </div>
            <Link to="/report">
              <Button variant="primary" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <PlusCircle size={18} /> Report Issue (+30 XP)
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Real Impact Summary Stats */}
      <div style={{ padding: 'var(--space-6)', background: 'var(--surface-base)', borderBottom: '1px solid var(--surface-border)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
            <StatCard
              icon={MapPin}
              iconBg="var(--color-primary-50)"
              iconColor="var(--color-primary-600)"
              value={realMetrics.totalReal.toLocaleString()}
              label="Real Issues Reported"
              honesty="verified"
            />
            <StatCard
              icon={CheckCircle2}
              iconBg="var(--color-success-bg)"
              iconColor="var(--color-success)"
              value={realMetrics.resolvedReal.toLocaleString()}
              label="Issues Resolved"
              honesty="verified"
            />
            <StatCard
              icon={Droplets}
              iconBg="var(--color-primary-50)"
              iconColor="var(--color-primary-600)"
              value={realMetrics.measuredLitres > 0 ? `${realMetrics.measuredLitres.toLocaleString()} L` : '0 L'}
              label="Measured Litres Saved"
              honesty="verified"
            />
          </div>
        </div>
      </div>

      {/* Control Bar: View Switcher & Filters */}
      <div style={{ padding: 'var(--space-4) var(--space-6)', background: 'var(--surface-raised)', borderBottom: '1px solid var(--surface-border)' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          {/* View Toggle */}
          <div role="tablist" aria-label="View Mode" style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button
              variant={viewMode === 'map' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('map')}
              role="tab"
              aria-selected={viewMode === 'map'}
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}
            >
              <Layers size={14} /> Interactive Map
            </Button>
            <Button
              variant={viewMode === 'list' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              role="tab"
              aria-selected={viewMode === 'list'}
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}
            >
              <List size={14} /> Accessible List View
            </Button>
          </div>

          {/* Filter Dropdowns */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            {/* Category Filter */}
            <select
              aria-label="Filter by category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="form-input"
              style={{ padding: 'var(--space-1) var(--space-3)', fontSize: 'var(--text-xs)', width: 'auto' }}
            >
              <option value="all">All Categories</option>
              <option value="public_leak">💧 Water Leak</option>
              <option value="water_contamination">⚠️ Water Contamination</option>
              <option value="community_wastage">♻️ Community Wastage</option>
              <option value="dry_public_tap">🏜️ Dry Public Tap</option>
            </select>

            {/* Status Filter */}
            <select
              aria-label="Filter by status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="form-input"
              style={{ padding: 'var(--space-1) var(--space-3)', fontSize: 'var(--text-xs)', width: 'auto' }}
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_review">In Review</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>

            {/* Demo / Sample Data Toggle */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', fontSize: 'var(--text-xs)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={includeSample}
                onChange={(e) => setIncludeSample(e.target.checked)}
              />
              Show Sample Data
            </label>
          </div>
        </div>
      </div>

      {/* Main View Area */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
        {loading ? (
          <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading community water reports...
          </div>
        ) : error ? (
          <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--color-danger)' }}>
            {error}
          </div>
        ) : viewMode === 'map' ? (
          /* Leaflet Interactive Map */
          <div style={{ height: 600, width: '100%', position: 'relative' }}>
            <MapContainer
              center={INDIA_CENTER}
              zoom={DEFAULT_ZOOM}
              style={{ height: '100%', width: '100%' }}
            >
              <MapController />
              <TileLayer
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                maxZoom={19}
              />
              {filteredReports.map((report) => {
                if (
                  !report.location ||
                  !Array.isArray(report.location.coordinates) ||
                  report.location.coordinates.length !== 2
                ) {
                  return null
                }
                const [lng, lat] = report.location.coordinates
                const catMeta = getCategoryMetadata(report.type)

                return (
                  <Marker
                    key={report._id}
                    position={[lat, lng]}
                    icon={createCategoryIcon(report.type, report.status)}
                  >
                    <Popup maxWidth={300} minWidth={240}>
                      <div style={{ padding: 'var(--space-1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                          <span
                            style={{
                              fontSize: 'var(--text-xs)',
                              fontWeight: 700,
                              color: catMeta.color,
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                            }}
                          >
                            {catMeta.label}
                          </span>
                          <span
                            style={{
                              fontSize: '10px',
                              padding: '2px 6px',
                              borderRadius: 4,
                              background:
                                report.status === 'resolved'
                                  ? '#dcfce7'
                                  : report.status === 'in_review'
                                    ? '#fef3c7'
                                    : '#fee2e2',
                              color:
                                report.status === 'resolved'
                                  ? '#15803d'
                                  : report.status === 'in_review'
                                    ? '#b45309'
                                    : '#b91c1c',
                              fontWeight: 600,
                              textTransform: 'capitalize',
                            }}
                          >
                            {report.status.replace('_', ' ')}
                          </span>
                        </div>

                        <h4 style={{ margin: '0 0 var(--space-2) 0', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                          {report.title}
                        </h4>

                        <p style={{ margin: '0 0 var(--space-2) 0', fontSize: 'var(--text-xs)', color: '#475569', lineHeight: 1.4 }}>
                          {report.description}
                        </p>

                        {report.address && (
                          <p style={{ margin: '0 0 var(--space-2) 0', fontSize: '11px', color: '#64748b' }}>
                            📍 {report.address}
                          </p>
                        )}

                        {report.photoUrl && (
                          <div style={{ marginBottom: 'var(--space-2)' }}>
                            <img
                              src={report.photoUrl}
                              alt="Issue evidence"
                              style={{ width: '100%', maxHeight: 120, objectFit: 'cover', borderRadius: 4 }}
                            />
                          </div>
                        )}

                        {/* Honesty & Corroboration Metadata */}
                        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b' }}>
                            <span>Corroborations: +{report.corroborationCount || 0}</span>
                            <span>{report.impactHonestyLabel}</span>
                          </div>
                          {report.isSample && (
                            <div style={{ marginTop: 4 }}>
                              <span style={{ fontSize: '9px', background: '#f1f5f9', padding: '2px 4px', borderRadius: 2, color: '#64748b' }}>
                                [Sample Data — Demo Only]
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                )
              })}
            </MapContainer>
          </div>
        ) : (
          /* Accessible List View Fallback */
          <div className="container" style={{ paddingBlock: 'var(--space-6)' }}>
            <h2 className="sr-only">Accessible List of Water Issues</h2>
            {filteredReports.length === 0 ? (
              <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>
                No reports match the selected filters.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    textAlign: 'left',
                    fontSize: 'var(--text-sm)',
                  }}
                  aria-label="Civic water reports table"
                >
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--surface-border)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: 'var(--space-3)' }}>Type</th>
                      <th style={{ padding: 'var(--space-3)' }}>Title & Details</th>
                      <th style={{ padding: 'var(--space-3)' }}>Location</th>
                      <th style={{ padding: 'var(--space-3)' }}>Status</th>
                      <th style={{ padding: 'var(--space-3)' }}>Impact Label</th>
                      <th style={{ padding: 'var(--space-3)' }}>Corroborations</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.map((r) => {
                      const catMeta = getCategoryMetadata(r.type)
                      const [lng, lat] = r.location?.coordinates || [0, 0]
                      return (
                        <tr key={r._id} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                          <td style={{ padding: 'var(--space-3)', whiteSpace: 'nowrap' }}>
                            <span style={{ color: catMeta.color, fontWeight: 600 }}>
                              {catMeta.emoji} {catMeta.label}
                            </span>
                          </td>
                          <td style={{ padding: 'var(--space-3)' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.title}</div>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', maxWidth: 360 }}>
                              {r.description}
                            </div>
                            {r.isSample && (
                              <Badge variant="sample" style={{ marginTop: 4 }}>
                                Demo Data
                              </Badge>
                            )}
                          </td>
                          <td style={{ padding: 'var(--space-3)', whiteSpace: 'nowrap', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                            {lat.toFixed(4)}, {lng.toFixed(4)}
                            {r.address && <div style={{ color: 'var(--text-secondary)' }}>{r.address}</div>}
                          </td>
                          <td style={{ padding: 'var(--space-3)' }}>
                            <Badge
                              variant={
                                r.status === 'resolved'
                                  ? 'success'
                                  : r.status === 'in_review'
                                    ? 'warning'
                                    : 'danger'
                              }
                            >
                              {r.status.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td style={{ padding: 'var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                            {r.impactHonestyLabel}
                            {r.measuredLitresSaved > 0 && ` (${r.measuredLitresSaved.toLocaleString()} L)`}
                          </td>
                          <td style={{ padding: 'var(--space-3)', textAlign: 'center' }}>
                            +{r.corroborationCount || 0}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
