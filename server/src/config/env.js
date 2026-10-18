/**
 * Environment Configuration and Validation — AquaLoop Phase 2
 *
 * Enforces production security standards:
 * - Fails fast during startup if required secrets are missing, empty, or using insecure defaults
 * - Never logs or exposes secret values
 * - Provides convenient development defaults only when NODE_ENV !== 'production'
 */

export const KNOWN_INSECURE_SECRETS = [
  'aqualoop-dev-secret-change-in-production-min-32-chars!',
  'aqualoop-cookie-secret-change-in-production-min-32-chars!',
  'secret',
  'changeme',
  'password',
  'default',
]

const MIN_SECRET_LENGTH = 32

/**
 * Validates environment variables. Throws descriptive errors in production if insecure.
 * @param {Record<string, string | undefined>} [env=process.env]
 * @returns {{ isProduction: boolean, jwtSecret: string, cookieSecret: string, jwtExpiresIn: string, nodeEnv: string, port: number }}
 */
export function validateEnv(env = process.env) {
  const nodeEnv = env.NODE_ENV || 'development'
  const isProduction = nodeEnv === 'production'
  const port = parseInt(env.PORT || '5000', 10)

  let jwtSecret = env.JWT_SECRET
  let cookieSecret = env.COOKIE_SECRET
  const jwtExpiresIn = env.JWT_EXPIRES_IN || '7d'

  if (isProduction) {
    // 1. JWT_SECRET production assertions
    if (!jwtSecret || jwtSecret.trim() === '') {
      throw new Error(
        'FATAL: JWT_SECRET environment variable is missing or empty in production.',
      )
    }
    if (KNOWN_INSECURE_SECRETS.includes(jwtSecret)) {
      throw new Error(
        'FATAL: JWT_SECRET cannot use default or known insecure values in production.',
      )
    }
    if (jwtSecret.length < MIN_SECRET_LENGTH) {
      throw new Error(
        `FATAL: JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters long in production.`,
      )
    }

    // 2. COOKIE_SECRET production assertions
    if (!cookieSecret || cookieSecret.trim() === '') {
      throw new Error(
        'FATAL: COOKIE_SECRET environment variable is missing or empty in production.',
      )
    }
    if (KNOWN_INSECURE_SECRETS.includes(cookieSecret)) {
      throw new Error(
        'FATAL: COOKIE_SECRET cannot use default or known insecure values in production.',
      )
    }
    if (cookieSecret.length < MIN_SECRET_LENGTH) {
      throw new Error(
        `FATAL: COOKIE_SECRET must be at least ${MIN_SECRET_LENGTH} characters long in production.`,
      )
    }
  } else {
    // Development/test fallbacks
    if (!jwtSecret) {
      jwtSecret = KNOWN_INSECURE_SECRETS[0]
    }
    if (!cookieSecret) {
      cookieSecret = KNOWN_INSECURE_SECRETS[1]
    }
  }

  return {
    isProduction,
    jwtSecret,
    cookieSecret,
    jwtExpiresIn,
    nodeEnv,
    port,
  }
}
