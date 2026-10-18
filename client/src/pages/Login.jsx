/**
 * Login page — AquaLoop Phase 2
 * Fully connected to POST /api/v1/auth/login via AuthContext.
 */
import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, Droplets, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import Button from '../components/ui/Button.jsx'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirect destination after successful login
  const from = location.state?.from?.pathname || '/dashboard'

  function handleChange(e) {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
    if (errors.form) setErrors((prev) => ({ ...prev, form: '' }))
  }

  function validate() {
    const errs = {}
    if (!formData.email.trim()) {
      errs.email = 'Email address is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = 'Enter a valid email address'
    }
    if (!formData.password) {
      errs.password = 'Password is required'
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
      const result = await login({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      })

      if (result.success) {
        navigate(from, { replace: true })
      } else {
        setErrors({ form: result.error || 'Invalid email or password.' })
      }
    } catch (err) {
      setErrors({ form: err.userMessage || 'Sign in failed. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

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
      <div style={{ width: '100%', maxWidth: 420 }}>
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
            Welcome back
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
            Sign in to track your water conservation
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: 'var(--space-8)' }}>
          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {/* Form-level error */}
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

            {/* Email */}
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">
                Email address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
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
                  id="login-email"
                  className={`input${errors.email ? ' input-error' : ''}`}
                  style={{ paddingLeft: 36 }}
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  aria-invalid={!!errors.email}
                />
              </div>
              {errors.email && (
                <span id="email-error" className="form-error" role="alert">
                  {errors.email}
                </span>
              )}
            </div>

            {/* Password */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" htmlFor="login-password">
                  Password
                </label>
              </div>
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
                  id="login-password"
                  className={`input${errors.password ? ' input-error' : ''}`}
                  style={{ paddingLeft: 36, paddingRight: 40 }}
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  aria-invalid={!!errors.password}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((v) => !v)}
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
                  {showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                </button>
              </div>
              {errors.password && (
                <span id="password-error" className="form-error" role="alert">
                  {errors.password}
                </span>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              style={{ width: '100%', marginTop: 'var(--space-2)' }}
            >
              Sign In
            </Button>
          </form>

          <hr className="divider" />

          <p style={{ textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--text-link)', fontWeight: 500 }}>
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
