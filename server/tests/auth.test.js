/**
 * Authentication & Authorization Integration Tests — AquaLoop Phase 2
 *
 * Uses:
 *   - mongodb-memory-server for isolated, ephemeral in-memory database
 *   - supertest for HTTP assertions against Express app
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'

// Ensure test environment
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-secret-key-at-least-32-characters-long-aqua'

// Import app and modules after setting env
import app from '../src/index.js'
import User from '../src/models/User.js'
import { validateEnv, KNOWN_INSECURE_SECRETS } from '../src/config/env.js'

let mongoServer

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create()
  const mongoUri = mongoServer.getUri()
  await mongoose.connect(mongoUri)
})

afterAll(async () => {
  await mongoose.disconnect()
  if (mongoServer) {
    await mongoServer.stop()
  }
})

beforeEach(async () => {
  // Clear users between tests for isolation
  await User.deleteMany({})
})

describe('POST /api/v1/auth/register', () => {
  it('registers a new citizen successfully with HTTP-only cookie and safe payload', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'aquawarrior',
        email: 'warrior@example.com',
        password: 'SecurePassword123!',
      })

    expect(res.status).toBe(201)
    expect(res.body.message).toContain('Registration successful')
    expect(res.body.user).toBeDefined()
    expect(res.body.user.username).toBe('aquawarrior')
    expect(res.body.user.email).toBe('warrior@example.com')
    expect(res.body.user.role).toBe('citizen')
    // Crucial: passwordHash and internal fields must never be exposed
    expect(res.body.user.passwordHash).toBeUndefined()
    expect(res.body.user.__v).toBeUndefined()

    // Assert HTTP-only cookie is set
    const cookies = res.headers['set-cookie']
    expect(cookies).toBeDefined()
    const cookieHeader = Array.isArray(cookies) ? cookies.join(';') : cookies
    expect(cookieHeader).toContain('aqualoop_token=')
    expect(cookieHeader.toLowerCase()).toContain('httponly')
  })

  it('rejects registration with duplicate email with 409 Conflict', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'userone',
        email: 'duplicate@example.com',
        password: 'Password123!',
      })

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'usertwo',
        email: 'duplicate@example.com',
        password: 'Password123!',
      })

    expect(res.status).toBe(409)
    expect(res.body.error).toMatch(/email.*already exists/i)
  })

  it('rejects registration with duplicate username with 409 Conflict', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'sameusername',
        email: 'user1@example.com',
        password: 'Password123!',
      })

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'sameusername',
        email: 'user2@example.com',
        password: 'Password123!',
      })

    expect(res.status).toBe(409)
    expect(res.body.error).toMatch(/username.*already taken/i)
  })

  it('validates input fields (short password, bad email, short username)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'ab', // < 3 chars
        email: 'not-an-email',
        password: 'short', // < 8 chars
      })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Validation failed')
    expect(res.body.details).toHaveLength(3)
  })
})

describe('POST /api/v1/auth/login', () => {
  beforeEach(async () => {
    // Seed user
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'logintester',
        email: 'login@example.com',
        password: 'Password123!',
      })
  })

  it('signs in successfully with correct credentials and returns HTTP-only cookie', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'login@example.com',
        password: 'Password123!',
      })

    expect(res.status).toBe(200)
    expect(res.body.message).toContain('Signed in successfully')
    expect(res.body.user).toBeDefined()
    expect(res.body.user.email).toBe('login@example.com')
    expect(res.body.user.passwordHash).toBeUndefined()

    const cookies = res.headers['set-cookie']
    expect(cookies).toBeDefined()
    const cookieHeader = Array.isArray(cookies) ? cookies.join(';') : cookies
    expect(cookieHeader).toContain('aqualoop_token=')
  })

  it('rejects incorrect password with 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'login@example.com',
        password: 'WrongPassword!',
      })

    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Invalid email address or password.')
  })

  it('rejects non-existent email with uniform 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'nobody@example.com',
        password: 'Password123!',
      })

    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Invalid email address or password.')
  })
})

describe('POST /api/v1/auth/logout', () => {
  it('clears auth cookie on logout', async () => {
    const res = await request(app).post('/api/v1/auth/logout')

    expect(res.status).toBe(200)
    expect(res.body.message).toContain('Signed out successfully')

    const cookies = res.headers['set-cookie']
    expect(cookies).toBeDefined()
    const cookieHeader = Array.isArray(cookies) ? cookies.join(';') : cookies
    expect(cookieHeader).toMatch(/aqualoop_token=(?:;|expires=)/)
  })
})

describe('GET /api/v1/auth/me (Protected Route)', () => {
  it('returns 401 when no auth cookie is present', async () => {
    const res = await request(app).get('/api/v1/auth/me')

    expect(res.status).toBe(401)
    expect(res.body.error).toMatch(/Authentication required/i)
  })

  it('returns user profile when authenticated with cookie', async () => {
    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'meuser',
        email: 'me@example.com',
        password: 'Password123!',
      })

    const cookie = registerRes.headers['set-cookie']

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', cookie)

    expect(res.status).toBe(200)
    expect(res.body.user).toBeDefined()
    expect(res.body.user.username).toBe('meuser')
    expect(res.body.user.email).toBe('me@example.com')
    expect(res.body.user.passwordHash).toBeUndefined()
  })

  it('returns 401 when invalid token provided', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', ['aqualoop_token=invalid.tampered.jwt'])

    expect(res.status).toBe(401)
    expect(res.body.error).toMatch(/invalid.*session/i)
  })
})

describe('Role-based Access Control (requireRole)', () => {
  it('denies citizen user access to admin-only test endpoint with 403', async () => {
    const citizenRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'normalcitizen',
        email: 'citizen@example.com',
        password: 'Password123!',
      })

    const cookie = citizenRes.headers['set-cookie']

    const res = await request(app)
      .get('/api/v1/auth/admin-test')
      .set('Cookie', cookie)

    expect(res.status).toBe(403)
    expect(res.body.error).toMatch(/insufficient permissions/i)
  })

  it('grants admin user access to admin-only endpoint with 200', async () => {
    // Create admin user directly in database
    const adminUser = new User({
      username: 'adminboss',
      email: 'adminboss@example.com',
      passwordHash: 'AdminSecret123!',
      role: 'admin',
    })
    await adminUser.save()

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'adminboss@example.com',
        password: 'AdminSecret123!',
      })

    const cookie = loginRes.headers['set-cookie']

    const res = await request(app)
      .get('/api/v1/auth/admin-test')
      .set('Cookie', cookie)

    expect(res.status).toBe(200)
    expect(res.body.message).toBe('Admin authorization confirmed.')
    expect(res.body.user.role).toBe('admin')
  })
})

describe('Security Edge Cases: Token Expiry & Tampering', () => {
  it('rejects expired JWT token with 401 and code TOKEN_EXPIRED', async () => {
    const expiredToken = jwt.sign(
      { id: new mongoose.Types.ObjectId(), role: 'citizen', email: 'expired@example.com' },
      process.env.JWT_SECRET,
      { algorithm: 'HS256', expiresIn: '-10s' },
    )

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', [`aqualoop_token=${expiredToken}`])

    expect(res.status).toBe(401)
    expect(res.body.code).toBe('TOKEN_EXPIRED')
    expect(res.body.error).toMatch(/Session expired/i)
  })

  it('rejects JWT signed with an untrusted or foreign secret', async () => {
    const foreignSecret = 'unauthorized-foreign-key-32-chars-minimum!'
    const foreignToken = jwt.sign(
      { id: new mongoose.Types.ObjectId(), role: 'admin', email: 'attacker@example.com' },
      foreignSecret,
      { algorithm: 'HS256', expiresIn: '1h' },
    )

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', [`aqualoop_token=${foreignToken}`])

    expect(res.status).toBe(401)
    expect(res.body.error).toMatch(/Invalid session token/i)
  })
})

describe('Security Edge Cases: Content-Type & Payload Limits', () => {
  it('rejects non-JSON Content-Type (e.g. form urlencoded) on state-changing requests with 415', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send('email=login@example.com&password=Password123!')

    expect(res.status).toBe(415)
    expect(res.body.error).toMatch(/Unsupported Media Type/i)
  })

  it('rejects oversized JSON payload exceeding 10kb limit with 413', async () => {
    const hugeString = 'a'.repeat(12 * 1024) // 12kb
    const res = await request(app)
      .post('/api/v1/auth/register')
      .set('Content-Type', 'application/json')
      .send({
        username: 'normaluser',
        email: 'normal@example.com',
        password: 'Password123!',
        extraData: hugeString,
      })

    expect(res.status).toBe(413)
    expect(res.body.error).toMatch(/Payload too large/i)
  })
})

describe('Security Edge Cases: Production Environment Validation', () => {
  it('fails fast when JWT_SECRET is missing in production', () => {
    expect(() => {
      validateEnv({
        NODE_ENV: 'production',
        JWT_SECRET: '',
        COOKIE_SECRET: 'valid-secure-cookie-secret-min-32-chars!',
      })
    }).toThrow(/JWT_SECRET.*missing or empty/i)
  })

  it('fails fast when JWT_SECRET matches a known insecure default in production', () => {
    expect(() => {
      validateEnv({
        NODE_ENV: 'production',
        JWT_SECRET: KNOWN_INSECURE_SECRETS[0],
        COOKIE_SECRET: 'valid-secure-cookie-secret-min-32-chars!',
      })
    }).toThrow(/default or known insecure/i)
  })

  it('fails fast when JWT_SECRET is shorter than 32 characters in production', () => {
    expect(() => {
      validateEnv({
        NODE_ENV: 'production',
        JWT_SECRET: 'too-short-secret',
        COOKIE_SECRET: 'valid-secure-cookie-secret-min-32-chars!',
      })
    }).toThrow(/at least 32 characters/i)
  })

  it('fails fast when COOKIE_SECRET is missing or default in production', () => {
    expect(() => {
      validateEnv({
        NODE_ENV: 'production',
        JWT_SECRET: 'valid-secure-jwt-secret-min-32-chars-long!',
        COOKIE_SECRET: '',
      })
    }).toThrow(/COOKIE_SECRET.*missing or empty/i)

    expect(() => {
      validateEnv({
        NODE_ENV: 'production',
        JWT_SECRET: 'valid-secure-jwt-secret-min-32-chars-long!',
        COOKIE_SECRET: KNOWN_INSECURE_SECRETS[1],
      })
    }).toThrow(/default or known insecure/i)
  })

  it('passes validation when valid 32+ character secrets are supplied in production', () => {
    const config = validateEnv({
      NODE_ENV: 'production',
      JWT_SECRET: 'production-jwt-secret-minimum-32-characters-length!',
      COOKIE_SECRET: 'production-cookie-secret-minimum-32-characters-length!',
    })

    expect(config.isProduction).toBe(true)
    expect(config.jwtSecret).toBe('production-jwt-secret-minimum-32-characters-length!')
    expect(config.cookieSecret).toBe('production-cookie-secret-minimum-32-characters-length!')
  })

  it('permits default fallbacks in development without throwing', () => {
    const config = validateEnv({
      NODE_ENV: 'development',
    })

    expect(config.isProduction).toBe(false)
    expect(config.jwtSecret).toBeDefined()
    expect(config.cookieSecret).toBeDefined()
  })
})
