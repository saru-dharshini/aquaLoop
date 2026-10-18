/**
 * ReportIssue — Phase 1 stub
 * Full form layout for geo-tagged water issue reporting.
 * Map picker and file upload are Phase 4.
 */
import { useState } from 'react'
import { MapPin, Camera, AlertTriangle } from 'lucide-react'
import Button from '../components/ui/Button.jsx'
import Badge from '../components/ui/Badge.jsx'

const CATEGORIES = [
  { value: 'leak',         label: '💧 Water Leak',           desc: 'Pipe or tap leakage in public space' },
  { value: 'contamination',label: '⚠️ Contamination',        desc: 'Polluted or discoloured water source' },
  { value: 'wastage',      label: '♻️ Water Wastage',         desc: 'Ongoing misuse or open taps' },
  { value: 'drought_zone', label: '🏜️ Drought / Dry Zone',   desc: 'Area lacking water supply' },
]

export default function ReportIssue() {
  const [form, setForm] = useState({ category: '', title: '', description: '', address: '' })
  const [errors, setErrors] = useState({})

  function handleChange(e) {
    const { name, value } = e.target
    setForm((p) => ({ ...p, [name]: value }))
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = {}
    if (!form.category)    errs.category = 'Select an issue type'
    if (!form.title.trim()) errs.title = 'Title is required'
    if (form.description.length < 20) errs.description = 'Please describe the issue (min 20 characters)'
    setErrors(errs)
    if (!Object.keys(errs).length) {
      setErrors({ form: 'Issue submission not implemented yet — Phase 4.' })
    }
  }

  return (
    <div className="container page-enter" style={{ paddingBlock: 'var(--space-12)', maxWidth: 680 }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
          <AlertTriangle size={28} aria-hidden="true" style={{ color: 'var(--color-danger)' }} />
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-3xl)', margin: 0 }}>Report a Water Issue</h1>
        </div>
        <p style={{ color: 'var(--text-secondary)' }}>
          Pin a water leak, contamination, or dry zone on the map for your community to see and authorities to act on.
        </p>
        <Badge variant="sample" style={{ marginTop: 'var(--space-2)' }}>Phase 4 — geo-picker and submission not yet active</Badge>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {errors.form && (
            <div role="alert" style={{ padding: 'var(--space-3)', background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-sm)', color: 'var(--color-danger)' }}>
              {errors.form}
            </div>
          )}

          {/* Category */}
          <div className="form-group">
            <span className="form-label">Issue Type</span>
            {errors.category && <span className="form-error" role="alert">{errors.category}</span>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              {CATEGORIES.map(({ value, label, desc }) => (
                <label
                  key={value}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-1)',
                    padding: 'var(--space-3)',
                    border: `2px solid ${form.category === value ? 'var(--color-primary-600)' : 'var(--surface-border-strong)'}`,
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    background: form.category === value ? 'var(--color-primary-50)' : 'var(--surface-base)',
                    transition: 'border-color var(--duration-quick) var(--ease-standard), background var(--duration-quick) var(--ease-standard)',
                  }}
                >
                  <input
                    type="radio"
                    name="category"
                    value={value}
                    checked={form.category === value}
                    onChange={handleChange}
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
            <label className="form-label" htmlFor="report-title">Issue Title</label>
            <input
              id="report-title"
              className={`input${errors.title ? ' input-error' : ''}`}
              name="title"
              placeholder="e.g. Burst pipe on MG Road near bus stop"
              value={form.title}
              onChange={handleChange}
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? 'title-err' : undefined}
            />
            {errors.title && <span id="title-err" className="form-error" role="alert">{errors.title}</span>}
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label" htmlFor="report-desc">Description</label>
            <textarea
              id="report-desc"
              className={`input${errors.description ? ' input-error' : ''}`}
              name="description"
              rows={4}
              placeholder="Describe what you observed. The more detail, the better."
              value={form.description}
              onChange={handleChange}
              style={{ resize: 'vertical', minHeight: 96 }}
              aria-invalid={!!errors.description}
              aria-describedby={errors.description ? 'desc-err' : 'desc-hint'}
            />
            {errors.description
              ? <span id="desc-err" className="form-error" role="alert">{errors.description}</span>
              : <span id="desc-hint" className="form-hint">{form.description.length}/500 characters</span>}
          </div>

          {/* Address */}
          <div className="form-group">
            <label className="form-label" htmlFor="report-address">
              <MapPin size={14} aria-hidden="true" style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
              Approximate Address
            </label>
            <input
              id="report-address"
              className="input"
              name="address"
              placeholder="e.g. 12 Gandhi Nagar, Jaipur"
              value={form.address}
              onChange={handleChange}
            />
            <span className="form-hint">
              Interactive map pin selector coming in Phase 4.
            </span>
          </div>

          {/* Photo upload — Phase 4 stub */}
          <div className="form-group">
            <span className="form-label">
              <Camera size={14} aria-hidden="true" style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
              Photo Evidence (optional)
            </span>
            <div
              style={{
                border: '2px dashed var(--surface-border-strong)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-8)',
                textAlign: 'center',
                background: 'var(--surface-raised)',
                color: 'var(--text-muted)',
                fontSize: 'var(--text-sm)',
              }}
            >
              <Camera size={28} aria-hidden="true" style={{ display: 'block', margin: '0 auto var(--space-2)' }} />
              Photo upload via Cloudinary — Phase 4
            </div>
          </div>

          <Button type="submit" variant="primary" size="lg">
            Submit Report
          </Button>
        </div>
      </form>
    </div>
  )
}
