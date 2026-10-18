/**
 * Register page — AquaLoop Phase 2
 * Fully connected to POST /api/v1/auth/register via AuthContext.
 */
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Mail, Lock, Eye, EyeOff, Droplets, ShieldCheck, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import Button from '../components/ui/Button.jsx'

const FIELD_RULES = {
  username: (v) => {
    if (!v.trim()) return 'Username is required'
    if (v.length < 3) return 'Username must be at least 3 characters'
    if (v.length > 30) return 'Username must be at most 30 characters'
    if (!/^[a-zA-Z0-9_]+$/.test(v)) return 'Letters, numbers, and underscores only'
    return ''
  },
  email: (v) => {
    if (!v.trim()) return 'Email address is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Enter a valid email address'
    return ''
  },
  password: (v) => {
    if (!v) return 'Password is required'
    if (v.length < 8) return 'Password must be at least 8 characters'
    return ''
  },
  confirmPassword: (v, all) => {
    if (!v) return 'Please confirm your password'
    if (v !== all.password) return 'Passwords do not match'
    return ''
  },
}

export default function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [showPw, setShowPw] = useState(false)
  const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleChange(e) {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
    if (errors.form) setErrors((prev) => ({ ...prev, form: '' }))
  }

  function validate() {
    const errs = {}
    for (const [field, rule] of Object.entries(FIELD_RULES)) {
      const msg = rule(formData[field], formData)
      if (msg) errs[field] = msg
    }
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      const result = await register({
        username: formData.username.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      })

      if (result.success) {
        navigate('/dashboard', { replace: true })
      } else {
        setErrors({ form: result.error || 'Registration failed. Please check your information.' })
      }
    } catch (err) {
      setErrors({ form: err.userMessage || 'An unexpected error occurred. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const fields = [
    { id: 'reg-username', name: 'username', label: 'Username', type: 'text', autoComplete: 'username', placeholder: 'coolconserver', Icon: User },
    { id: 'reg-email',    name: 'email',    label: 'Email address', type: 'email', autoComplete: 'email', placeholder: 'you@example.com', Icon: Mail },
  ]

  return (
    <div
      className="page-enter"
      style={{
        minHeight: 'calc(100vh - var(--navbar-height))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-8) var(--space-4)',
        background: 'linear-gradient(160deg, var(--color-primary-50) 0%, var(--surface-base) 60%)',
      }}
    >
      <div style={{ width: '100%', maxWidth: 460 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-4)' }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-primary-50)',
                border: '1px solid var(--color-primary-100)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Droplets size={28} aria-hidden="true" style={{ color: 'var(--color-primary-600)' }} />
            </div>
          </div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-1)' }}>
            Create your account
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
            Free forever. No credit card required.
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: 'var(--space-8)' }}>
          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {errors.form && (
              <div
                role="alert"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  padding: 'var(--space-3)',
                  background: 'var(--color-danger-bg)',
                  border: '1px solid var(--color-danger)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-danger)',
                }}
              >
                <AlertCircle size={16} aria-hidden="true" style={{ flexShrink: 0 }} />
                <span>{errors.form}</span>
              </div>
            )}

            {fields.map(({ id, name, label, type, autoComplete, placeholder, Icon }) => (
              <div key={name} className="form-group">
                <label className="form-label" htmlFor={id}>
                  {label}
                </label>
                <div style={{ position: 'relative' }}>
                  <Icon
                    size={16}
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      left: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)',
                      pointerEvents: 'none',
                    }}
                  />
                  <input
                    id={id}
                    className={`input${errors[name] ? ' input-error' : ''}`}
                    style={{ paddingLeft: 36 }}
                    type={type}
                    name={name}
                    autoComplete={autoComplete}
                    placeholder={placeholder}
                    value={formData[name]}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    aria-describedby={errors[name] ? `${name}-error` : undefined}
                    aria-invalid={!!errors[name]}
                  />
                </div>
                {errors[name] && (
                  <span id={`${name}-error`} className="form-error" role="alert">
                    {errors[name]}
                  </span>
                )}
              </div>
            ))}

            {/* Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-password">
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  id="reg-password"
                  className={`input${errors.password ? ' input-error' : ''}`}
                  style={{ paddingLeft: 36, paddingRight: 40 }}
                  type={showPw ? 'text' : 'password'}
                  name="password"
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  aria-describedby={errors.password ? 'pw-error' : 'pw-hint'}
                  aria-invalid={!!errors.password}
                />
                <button
                  type="button"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPw((v) => !v)}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    padding: 4,
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  {showPw ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                </button>
              </div>
              {errors.password ? (
                <span id="pw-error" className="form-error" role="alert">
                  {errors.password}
                </span>
              ) : (
                <span id="pw-hint" className="form-hint">
                  At least 8 characters
                </span>
              )}
            </div>

            {/* Confirm password */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-confirm">
                Confirm password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  id="reg-confirm"
                  className={`input${errors.confirmPassword ? ' input-error' : ''}`}
                  style={{ paddingLeft: 36 }}
                  type={showPw ? 'text' : 'password'}
                  name="confirmPassword"
                  autoComplete="new-password"
                  placeholder="Repeat password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  aria-describedby={errors.confirmPassword ? 'confirm-error' : undefined}
                  aria-invalid={!!errors.confirmPassword}
                />
              </div>
              {errors.confirmPassword && (
                <span id="confirm-error" className="form-error" role="alert">
                  {errors.confirmPassword}
                </span>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              style={{ width: '100%', marginTop: 'var(--space-2)' }}
            >
              Create Account
            </Button>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                justifyContent: 'center',
                marginTop: 'var(--space-1)',
              }}
            >
              <ShieldCheck size={14} aria-hidden="true" style={{ color: 'var(--color-success)', flexShrink: 0 }} />
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                Free forever. No payment required.
              </span>
            </div>
          </form>

          <hr className="divider" />

          <p style={{ textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--text-link)', fontWeight: 500 }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
