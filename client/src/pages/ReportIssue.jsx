/**
 * ReportIssue — AquaLoop Phase 4 Step 2
 *
 * Citizen Civic Water Issue Reporting with interactive Leaflet location picker,
 * manual coordinate entry fallback, pure-JS image sanitisation pipeline,
 * and honest settlement feedback (withheld XP -> primary vs. corroboration).
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import {
  AlertTriangle,
  Camera,
  Crosshair,
  CheckCircle2,
  Clock,
  Sparkles,
  X,
  LogIn,
} from 'lucide-react'
import Button from '../components/ui/Button.jsx'
import Badge from '../components/ui/Badge.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../components/ui/Toast.jsx'
import api from '../services/api.js'
import { createPickerIcon } from '../components/ui/MapMarkerIcons.js'

const INDIA_CENTER = [20.5937, 78.9629]
const DEFAULT_ZOOM = 5

const CATEGORIES = [
  {
    value: 'public_leak',
    label: '💧 Public Leak',
    desc: 'Burst pipeline, leaking valve, or gushing municipal main in public area.',
  },
  {
    value: 'water_contamination',
    label: '⚠️ Water Contamination',
    desc: 'Discoloured, odorous, muddy, or foul water coming from public supply.',
  },
  {
    value: 'community_wastage',
    label: '♻️ Community Wastage',
    desc: 'Overflowing public tanks, unattended open taps, or severe civic water misuse.',
  },
  {
    value: 'dry_public_tap',
    label: '🏜️ Dry Public Tap',
    desc: 'Municipal tap, public standpost, or community handpump completely dry.',
  },
]

// Child component for Leaflet click-to-pick
function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng])
    },
  })

  return position ? (
    <Marker position={position} icon={createPickerIcon()} />
  ) : null
}

// Child component to force size invalidation and center animation
function MapController({ markerPos }) {
  const map = useMap()

  useEffect(() => {
    map.invalidateSize()
    const timer = setTimeout(() => {
      map.invalidateSize()
    }, 250)
    return () => clearTimeout(timer)
  }, [map])

  useEffect(() => {
    if (
      markerPos &&
      Array.isArray(markerPos) &&
      markerPos.length === 2 &&
      !isNaN(markerPos[0]) &&
      !isNaN(markerPos[1])
    ) {
      map.flyTo(markerPos, Math.max(map.getZoom(), 15), { animate: true, duration: 0.8 })
    }
  }, [markerPos, map])

  return null
}

export default function ReportIssue() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    type: '',
    title: '',
    description: '',
    address: '',
    latitude: '',
    longitude: '',
  })
  const [markerPos, setMarkerPos] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [settlementResult, setSettlementResult] = useState(null)

  // Sync marker position with manual coordinate inputs
  function handleMapPick(pos) {
    setMarkerPos(pos)
    setForm((prev) => ({
      ...prev,
      latitude: pos[0].toFixed(6),
      longitude: pos[1].toFixed(6),
    }))
    if (errors.coordinates) {
      setErrors((p) => ({ ...p, coordinates: '' }))
    }
  }

  function handleCoordChange(e) {
    const { name, value } = e.target
    setForm((p) => ({ ...p, [name]: value }))
    const lat = name === 'latitude' ? parseFloat(value) : parseFloat(form.latitude)
    const lng = name === 'longitude' ? parseFloat(value) : parseFloat(form.longitude)

    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      setMarkerPos([lat, lng])
      setErrors((p) => ({ ...p, coordinates: '' }))
    }
  }

  function handleLocateMe() {
    if (!navigator.geolocation) {
      addToast('Geolocation is not supported by your browser.', 'error')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        handleMapPick([lat, lng])
        addToast('Location detected successfully!', 'success')
      },
      (err) => {
        addToast(`Could not retrieve location: ${err.message}`, 'error')
      },
      { timeout: 10000, enableHighAccuracy: true },
    )
  }

  function handlePhotoSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setErrors((p) => ({ ...p, photo: 'Only JPEG and PNG images are accepted.' }))
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors((p) => ({ ...p, photo: 'Image size must be under 5MB.' }))
      return
    }

    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
    setErrors((p) => ({ ...p, photo: '' }))
  }

  function handleClearPhoto() {
    setPhotoFile(null)
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview)
      setPhotoPreview(null)
    }
  }

  function validate() {
    const errs = {}
    if (!form.type) errs.type = 'Please select a report category.'
    if (!form.title.trim() || form.title.trim().length < 3) {
      errs.title = 'Title must be between 3 and 100 characters.'
    }
    if (!form.description.trim() || form.description.trim().length < 10) {
      errs.description = 'Please provide at least 10 characters describing the issue.'
    }

    const lat = parseFloat(form.latitude)
    const lng = parseFloat(form.longitude)
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      errs.coordinates = 'Please select a valid location on the map or enter lat/lng.'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    setSettlementResult(null)

    try {
      const formData = new FormData()
      formData.append('type', form.type)
      formData.append('title', form.title.trim())
      formData.append('description', form.description.trim())
      formData.append('address', form.address.trim())
      formData.append(
        'coordinates',
        JSON.stringify([parseFloat(form.longitude), parseFloat(form.latitude)]),
      )

      if (photoFile) {
        formData.append('photo', photoFile)
      }

      const res = await api.post('/reports', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      const data = res.data
      setSettlementResult(data)
      addToast('Report submitted! Verifying nearby reports...', 'info')
    } catch (err) {
      const msg = err.userMessage || err.message || 'Submission failed'
      setErrors((p) => ({ ...p, form: msg }))
      addToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview)
    }
  }, [photoPreview])

  return (
    <div className="container page-enter" style={{ paddingBlock: 'var(--space-10)', maxWidth: 840 }}>
      {/* Page Header */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
          <AlertTriangle size={28} style={{ color: 'var(--color-danger)' }} />
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-3xl)', margin: 0 }}>
            Report a Civic Water Issue
          </h1>
        </div>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: 'var(--text-base)' }}>
          Flag water leaks, contamination, wastage, or dry taps. Nearby reports within 50 metres are automatically verified to prevent duplicates.
        </p>
      </div>

      {!user ? (
        <div
          style={{
            padding: 'var(--space-6)',
            background: 'var(--surface-raised)',
            border: '1px solid var(--surface-border-strong)',
            borderRadius: 'var(--radius-lg)',
            textAlign: 'center',
          }}
        >
          <LogIn size={36} style={{ color: 'var(--color-primary-500)', margin: '0 auto var(--space-3)' }} />
          <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-2)' }}>Authentication Required</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
            You need to be signed in as an AquaLoop citizen to report water issues and earn conservation XP.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center' }}>
            <Button variant="primary" onClick={() => navigate('/login')}>
              Sign In
            </Button>
            <Button variant="outline" onClick={() => navigate('/register')}>
              Create Account
            </Button>
          </div>
        </div>
      ) : settlementResult ? (
        /* Settlement Outcome Card */
        <div
          style={{
            padding: 'var(--space-8)',
            background: 'var(--surface-raised)',
            border: '2px solid var(--surface-border-strong)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-5)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <CheckCircle2 size={36} style={{ color: 'var(--color-success)' }} />
            <div>
              <h2 style={{ fontSize: 'var(--text-2xl)', margin: 0 }}>Report Submitted & Processed</h2>
              <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: 'var(--text-sm)' }}>
                Issue ID: {settlementResult.report._id}
              </p>
            </div>
          </div>

          <div
            style={{
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-md)',
              background: settlementResult.isPrimary ? 'var(--color-primary-50)' : 'var(--surface-base)',
              border: `1px solid ${settlementResult.isPrimary ? 'var(--color-primary-300)' : 'var(--surface-border)'}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
              {settlementResult.isPrimary ? (
                <>
                  <Sparkles size={18} style={{ color: 'var(--color-primary-600)' }} />
                  <span style={{ fontWeight: 600, color: 'var(--color-primary-800)' }}>
                    Primary Incident Verified
                  </span>
                </>
              ) : (
                <>
                  <Clock size={18} style={{ color: 'var(--color-warning)' }} />
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    Corroborating Existing Incident
                  </span>
                </>
              )}
            </div>
            <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              {settlementResult.isPrimary
                ? `No active issue existed within 50 metres. You are registered as the primary reporter and awarded 30 base XP!`
                : `An ongoing incident was already active within 50 metres. Your report has been linked as corroborating evidence (0 base XP awarded).`}
            </p>
            <div style={{ marginTop: 'var(--space-3)', display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
              <Badge variant={settlementResult.isPrimary ? 'primary' : 'neutral'}>
                {settlementResult.isPrimary ? '+30 Base XP Awarded' : '0 Base XP (Corroboration)'}
              </Badge>
              {settlementResult.isPrimary && (
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                  Eligible for 50 additional bonus XP upon official resolution!
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
            <Button variant="primary" onClick={() => navigate('/impact')}>
              View on Impact Map
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSettlementResult(null)
                setForm({ type: '', title: '', description: '', address: '', latitude: '', longitude: '' })
                setMarkerPos(null)
                handleClearPhoto()
              }}
            >
              Submit Another Report
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            {errors.form && (
              <div
                role="alert"
                style={{
                  padding: 'var(--space-3)',
                  background: 'var(--color-danger-bg)',
                  border: '1px solid var(--color-danger)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-danger)',
                }}
              >
                {errors.form}
              </div>
            )}

            {/* Category Selection */}
            <div className="form-group">
              <label className="form-label">
                Issue Category <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              {errors.type && <span className="form-error" role="alert">{errors.type}</span>}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-3)' }}>
                {CATEGORIES.map(({ value, label, desc }) => (
                  <label
                    key={value}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'var(--space-1)',
                      padding: 'var(--space-3)',
                      border: `2px solid ${form.type === value ? 'var(--color-primary-600)' : 'var(--surface-border-strong)'}`,
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      background: form.type === value ? 'var(--color-primary-50)' : 'var(--surface-base)',
                      transition: 'all var(--duration-quick) var(--ease-standard)',
                    }}
                  >
                    <input
                      type="radio"
                      name="type"
                      value={value}
                      checked={form.type === value}
                      onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                      style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
                    />
                    <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{label}</span>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{desc}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Title */}
            <div className="form-group">
              <label className="form-label" htmlFor="report-title">
                Issue Title <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input
                id="report-title"
                name="title"
                type="text"
                className={`form-input ${errors.title ? 'is-invalid' : ''}`}
                placeholder="e.g. Broken water pipe leaking near bus stop"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                maxLength={100}
                required
              />
              {errors.title && <span className="form-error" role="alert">{errors.title}</span>}
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label" htmlFor="report-desc">
                Description <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <textarea
                id="report-desc"
                name="description"
                rows={3}
                className={`form-input ${errors.description ? 'is-invalid' : ''}`}
                placeholder="Describe what you see, how fast water is leaking, or water contamination signs..."
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                maxLength={1000}
                required
              />
              {errors.description && <span className="form-error" role="alert">{errors.description}</span>}
            </div>

            {/* Map & Coordinates */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                <label className="form-label" style={{ margin: 0 }}>
                  Location <span style={{ color: 'var(--color-danger)' }}>*</span> (Click map or use GPS)
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleLocateMe}
                  style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}
                >
                  <Crosshair size={14} /> Locate Me
                </Button>
              </div>

              {errors.coordinates && <span className="form-error" role="alert">{errors.coordinates}</span>}

              {/* Leaflet Map Picker */}
              <div
                style={{
                  height: 320,
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  border: '1px solid var(--surface-border-strong)',
                  marginBottom: 'var(--space-4)',
                  position: 'relative',
                }}
              >
                <MapContainer
                  center={markerPos || INDIA_CENTER}
                  zoom={markerPos ? 14 : DEFAULT_ZOOM}
                  style={{ height: '100%', width: '100%' }}
                >
                  <MapController markerPos={markerPos} />
                  <TileLayer
                    url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    maxZoom={19}
                  />
                  <LocationMarker position={markerPos} setPosition={handleMapPick} />
                </MapContainer>
              </div>

              {/* Accessible Manual Coordinates & Address Inputs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="latitude">
                    Latitude
                  </label>
                  <input
                    id="latitude"
                    name="latitude"
                    type="number"
                    step="any"
                    placeholder="20.593700"
                    className="form-input"
                    value={form.latitude}
                    onChange={handleCoordChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="longitude">
                    Longitude
                  </label>
                  <input
                    id="longitude"
                    name="longitude"
                    type="number"
                    step="any"
                    placeholder="78.962900"
                    className="form-input"
                    value={form.longitude}
                    onChange={handleCoordChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="address">
                  Street / Landmark (Optional)
                </label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  placeholder="e.g. Near Metro Pillar 124, MG Road"
                  className="form-input"
                  value={form.address}
                  onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                  maxLength={200}
                />
              </div>
            </div>

            {/* Photo Evidence Upload */}
            <div className="form-group">
              <label className="form-label">
                Photo Evidence <span style={{ color: 'var(--text-muted)' }}>(Optional, JPEG/PNG up to 5MB)</span>
              </label>
              {errors.photo && <span className="form-error" role="alert">{errors.photo}</span>}

              {photoPreview ? (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img
                    src={photoPreview}
                    alt="Uploaded issue evidence"
                    style={{
                      maxHeight: 180,
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--surface-border)',
                      objectFit: 'cover',
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleClearPhoto}
                    aria-label="Remove uploaded photo"
                    style={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      background: 'rgba(0,0,0,0.7)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      padding: 4,
                      cursor: 'pointer',
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <label
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 'var(--space-6)',
                    border: '2px dashed var(--surface-border-strong)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    background: 'var(--surface-base)',
                  }}
                >
                  <Camera size={28} style={{ color: 'var(--color-primary-500)', marginBottom: 'var(--space-2)' }} />
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>
                    Click or drag photo here to upload
                  </span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    EXIF and GPS metadata will be automatically stripped before saving
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={handlePhotoSelect}
                    style={{ display: 'none' }}
                  />
                </label>
              )}
            </div>

            {/* Submit Button */}
            <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-4)' }}>
              <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? 'Verifying & Submitting...' : 'Submit Report (30 XP)'}
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}
