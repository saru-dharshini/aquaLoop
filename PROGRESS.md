# AquaLoop — Progress Tracker

> **Last Updated:** 2026-10-18
> **Canonical Root:** `C:\Users\HP\OneDrive\Desktop\aquaLoop`
> **Current Phase:** Phase 2 — Database, Authentication, and Security Hardening (COMPLETE — awaiting user approval to stage/commit)
> **Next Phase Gate:** Phase 3 — Core Gamification: Actions, XP, Badges, and Leaderboard (requires explicit user approval)

---

## Current Project State

Phase 2 is **fully implemented, security-hardened, and verified**. All 4 approved security fixes have been implemented:
1. Insecure production fallback secrets are eliminated via a fail-fast environment validation module (`validateEnv`).
2. Authentication endpoints strictly reject non-JSON (e.g. urlencoded) payloads with `415 Unsupported Media Type` to block form-based CSRF vectors.
3. JWT verification is pinned explicitly to `HS256`.
4. Comprehensive security edge-case tests (expired tokens, foreign signatures, 415 media types, 413 oversized payloads, production env assertions) are in place.

All **23 backend integration tests pass**. The frontend builds cleanly (0 errors), and the linter passes with 0 errors.

---

## Work Completed

### Phase 0 — Planning ✅
- [x] Full project inspection (both candidate directories)
- [x] Canonical root confirmed: `C:\Users\HP\OneDrive\Desktop\aquaLoop`
- [x] `PLAN.md` and `PROGRESS.md` created in canonical root
- [x] Git isolated at canonical root (separate from `C:\Users\HP\.git`)

### Phase 1 — Foundation ✅
- [x] Persistent workspace rules (`.agents/rules/aqualoop-rules.md`)
- [x] Root `.gitignore` and `.gitattributes` (LF line endings)
- [x] Vite 8 + React 19 client scaffold with complete "Living Water" CSS design system
- [x] Express 5 server baseline with `/api/v1/health`
- [x] 8 page routes scaffolded and 11 UI components created

### Phase 2 — Database, Authentication & Security Hardening ✅

#### Backend (`server/`)
- [x] **Database connection (`server/src/config/db.js`)**: Mongoose 8+ connection supporting both local MongoDB Community Server (`mongodb://localhost:27017/aqualoop`) and MongoDB Atlas M0. Clear startup error and setup instructions if DB is unreachable without crashing the server.
- [x] **User model (`server/src/models/User.js`)**:
  - Validated fields: `username` (3–30 chars, alphanumeric/underscore), `email` (normalized lowercase, unique), `passwordHash` (`select: false`, bcrypt hashed with 12 salt rounds)
  - Role-based control: `role: 'citizen' | 'admin'` (defaults to `citizen`, assigned server-side only)
  - Server-controlled game state: `xp`, `level`, `streak`, `badges`, `totalWaterSavedLitres`, `actionsLogged`, `reportsSubmitted`
  - Safe projection: `toJSON` strips `passwordHash` and `__v`; static `publicFields()` helper
- [x] **Security Fix 1 — Production Environment Validation (`server/src/config/env.js`)**:
  - `validateEnv()` fails fast on startup in production if `JWT_SECRET` or `COOKIE_SECRET` is missing, empty, shorter than 32 characters, or matches known insecure defaults (`KNOWN_INSECURE_SECRETS`).
  - Never prints or leaks secrets in error messages or logs.
  - Keeps development defaults strictly isolated to `NODE_ENV !== 'production'`.
- [x] **Security Fix 2 — Content-Type Enforcement (`server/src/middleware/contentType.js`)**:
  - `requireJsonContent` enforces `Content-Type: application/json` on state-changing requests (`POST`, `PUT`, `PATCH`).
  - Returns `415 Unsupported Media Type` for URL-encoded forms or unsupported content types.
  - Prevents cross-origin HTML form POST CSRF attacks.
- [x] **Security Fix 3 — Algorithm Pinning & Cookie Management (`server/src/utils/jwt.js`)**:
  - `signToken`: Explicitly specifies `{ algorithm: 'HS256' }`.
  - `verifyToken`: Explicitly pins `{ algorithms: ['HS256'] }`.
  - HTTP-only cookie configuration: `httpOnly: true`, `secure: isProduction`, `sameSite: isProduction ? 'strict' : 'lax'`.
  - `clearAuthCookie`: Clears cookie matching all path and security attributes.
- [x] **Zod Validation (`server/src/utils/validation.js`)**: `registerSchema` and `loginSchema` with `validateBody` middleware compatible with Zod 4 (`issues` extraction).
- [x] **Auth Middleware (`server/src/middleware/auth.js`)**:
  - `requireAuth`: Reads token from HTTP-only cookie (with Bearer fallback for automated testing), verifies JWT, loads active user from database. Returns `401` if missing, invalid, or expired (`TOKEN_EXPIRED`).
  - `requireRole(...roles)`: Server-enforced RBAC. Returns `403` if user lacks required role.
- [x] **Rate Limiting (`server/src/middleware/rateLimiter.js`)**: Strict rate limiters on `/register` (max 15/hr) and `/login` (max 20/15min).
- [x] **Auth Controllers (`server/src/controllers/authController.js`)**:
  - `POST /api/v1/auth/register`: Duplicate check on email & username, creates user, issues HTTP-only cookie, returns 201 + safe user object.
  - `POST /api/v1/auth/login`: Validates credentials with bcrypt, uniform error message on bad password or nonexistent email, sets cookie, returns 200 + safe user object.
  - `POST /api/v1/auth/logout`: Clears HTTP-only cookie, returns 200.
  - `GET /api/v1/auth/me`: Protected session check, returns 200 + authenticated user profile.
  - `GET /api/v1/auth/admin-test`: Role-protected test endpoint, confirms admin authorization.
- [x] **Server Integration (`server/src/index.js`)**:
  - Startup `validateEnv()` guard.
  - Security headers via `helmet`.
  - Body parser with strict 10kb limit and dedicated `413 Payload Too Large` / `400 Malformed JSON` error handlers.
  - Mounted `requireJsonContent` on `/api/v1/auth`.
  - `/api/v1/health` reports version and database connectivity status.
- [x] **Demo Seed Script (`server/src/scripts/seed.js`)**: Safely creates demo citizen (`citizen@aqualoop.local` / `DemoCitizen123!`) and demo admin (`admin@aqualoop.local` / `DemoAdmin123!`). Blocks execution in production.

#### Frontend (`client/`)
- [x] **Centralized API Client (`client/src/services/api.js`)**: Axios instance with `baseURL: '/api/v1'`, `withCredentials: true`, and automatic response error normalization.
- [x] **Live AuthContext (`client/src/context/AuthContext.jsx`)**:
  - Replaced stubs with real API integration: `login`, `register`, `logout`, `refreshUser`.
  - Automatic session restoration: Calls `GET /auth/me` on mount; silently falls back to guest if no session.
  - Strict security: Tokens are NEVER stored in localStorage or sessionStorage.
- [x] **Login Page (`client/src/pages/Login.jsx`)**: Connected to real `login()`, shows loading spinner on button, displays field errors and backend alert banners, redirects to return URL upon sign-in.
- [x] **Register Page (`client/src/pages/Register.jsx`)**: Connected to real `register()`, client-side regex checks, handles duplicate conflicts, redirect to `/dashboard`.
- [x] **Navbar (`client/src/components/layout/Navbar.jsx`)**: Dynamically shows username, Avatar, Dashboard link, and Sign Out button when authenticated; shows Sign In & Get Started when guest.
- [x] **Dashboard (`client/src/pages/Dashboard.jsx`)**: Displays authenticated user's real username, role badge, XP, level, and streak; falls back to demo values if unauthenticated.
- [x] **Component fixes**: Updated `Modal.jsx` to use React's `useId()` for cleaner accessibility; removed unused variable in `Leaderboard.jsx`.

---

## Verification and Test Results

### 1. Backend Integration Tests (Vitest + Supertest + MongoMemoryServer)
Command: `npm test` inside `server/`
```
 ✓ tests/auth.test.js (23 tests)
   ✓ POST /api/v1/auth/register (4)
     ✓ registers a new citizen successfully with HTTP-only cookie and safe payload
     ✓ rejects registration with duplicate email with 409 Conflict
     ✓ rejects registration with duplicate username with 409 Conflict
     ✓ validates input fields (short password, bad email, short username)
   ✓ POST /api/v1/auth/login (3)
     ✓ signs in successfully with correct credentials and returns HTTP-only cookie
     ✓ rejects incorrect password with 401 Unauthorized
     ✓ rejects non-existent email with uniform 401 Unauthorized
   ✓ POST /api/v1/auth/logout (1)
     ✓ clears auth cookie on logout
   ✓ GET /api/v1/auth/me (Protected Route) (3)
     ✓ returns 401 when no auth cookie is present
     ✓ returns user profile when authenticated with cookie
     ✓ returns 401 when invalid token provided
   ✓ Role-based Access Control (requireRole) (2)
     ✓ denies citizen user access to admin-only test endpoint with 403
     ✓ grants admin user access to admin-only endpoint with 200
   ✓ Security Edge Cases: Token Expiry & Tampering (2)
     ✓ rejects expired JWT token with 401 and code TOKEN_EXPIRED
     ✓ rejects JWT signed with an untrusted or foreign secret
   ✓ Security Edge Cases: Content-Type & Payload Limits (2)
     ✓ rejects non-JSON Content-Type (e.g. form urlencoded) on state-changing requests with 415
     ✓ rejects oversized JSON payload exceeding 10kb limit with 413
   ✓ Security Edge Cases: Production Environment Validation (6)
     ✓ fails fast when JWT_SECRET is missing in production
     ✓ fails fast when JWT_SECRET matches a known insecure default in production
     ✓ fails fast when JWT_SECRET is shorter than 32 characters in production
     ✓ fails fast when COOKIE_SECRET is missing or default in production
     ✓ passes validation when valid 32+ character secrets are supplied in production
     ✓ permits default fallbacks in development without throwing

 Test Files  1 passed (1)
      Tests  23 passed (23)
```

### 2. Frontend Production Build (Vite)
Command: `npm run build` inside `client/`
```
✓ 2038 modules transformed.
dist/index.html                   1.24 kB │ gzip:   0.65 kB
dist/assets/index-Qd3aQSeD.css   14.50 kB │ gzip:   3.51 kB
dist/assets/index-BiuSYthP.js   411.73 kB │ gzip: 126.31 kB
✓ built in 780ms — 0 errors
```

### 3. Frontend Lint (Oxlint)
Command: `npm run lint` inside `client/`
```
Found 0 errors (4 fast-refresh / purity stylistic hints).
Finished in 31ms on 26 files.
```

### 4. Live Server Endpoints (PowerShell Invoke-RestMethod)
- `GET http://localhost:5000/api/v1/health` → Status 200 OK:
  ```json
  {
    "status": "ok",
    "service": "aqualoop-api",
    "version": "0.2.1",
    "environment": "development",
    "database": "disconnected",
    "uptime": 16
  }
  ```
- `POST http://localhost:5000/api/v1/auth/login` with `application/x-www-form-urlencoded` → Status 415 Unsupported Media Type:
  ```json
  {
    "error": "Unsupported Media Type: Request Content-Type must be application/json."
  }
  ```

---

## Files Changed / Created

### New Backend Files:
- `server/src/config/env.js` — Fail-fast environment validation
- `server/src/middleware/contentType.js` — 415 Content-Type enforcer
- `server/src/config/db.js` — Mongoose database connection with fallback instructions
- `server/src/models/User.js` — User schema, bcrypt pre-save hashing, public projections
- `server/src/utils/jwt.js` — JWT signing, verification, algorithm pinning, cookie configuration
- `server/src/utils/validation.js` — Zod registration and login schemas & middleware
- `server/src/middleware/auth.js` — `requireAuth` and `requireRole` middleware
- `server/src/middleware/rateLimiter.js` — Express rate limiters for auth endpoints
- `server/src/controllers/authController.js` — Register, login, logout, me, admin-test controllers
- `server/src/routes/authRoutes.js` — Express route bindings for `/api/v1/auth`
- `server/src/scripts/seed.js` — Demo accounts seeding script
- `server/vitest.config.js` — Vitest configuration for server tests
- `server/tests/auth.test.js` — Comprehensive in-memory integration test suite (23 tests)

### Modified Backend Files:
- `server/src/index.js` — Added validateEnv, helmet, cookie-parser, connectDB, requireJsonContent, mounted auth routes
- `server/package.json` — Added dependencies and test/seed scripts
- `server/.env.example` — Added local MongoDB default and JWT secrets

### New Frontend Files:
- `client/src/services/api.js` — Centralized Axios API client with credentials

### Modified Frontend Files:
- `client/src/context/AuthContext.jsx` — Implemented real session restore, login, register, logout
- `client/src/pages/Login.jsx` — Connected to real API with loading and error states
- `client/src/pages/Register.jsx` — Connected to real API with loading and error states
- `client/src/components/layout/Navbar.jsx` — Dynamic user state, sign-out button
- `client/src/pages/Dashboard.jsx` — Displays real authenticated user data
- `client/src/components/ui/Modal.jsx` — Accessible `useId()` update
- `client/src/pages/Leaderboard.jsx` — Cleaned unused variable

---

## Known Limitations

1. **Local MongoDB daemon not installed on host machine**: `mongod` is not installed as a Windows service on the host. The application starts gracefully and informs the developer how to connect local MongoDB or Atlas M0. All tests run in-memory via `mongodb-memory-server` without requiring a running system service.
2. **In-memory rate limiting**: Express-rate-limit uses memory stores. Appropriate for single-instance development and ₹0 free hosting.
3. **Cross-site cookies in Safari/strict third-party cookie environments**: Since Vite dev server runs on port 5173 and Express on port 5000, Vite's reverse proxy (`/api` → `http://localhost:5000`) is used to treat requests as same-origin, ensuring cookies work seamlessly without third-party cookie restrictions.

---

## What Did Not Work or Remains Uncertain?

1. **Mongoose 8+ `pre('save')` async callback**: In Mongoose 8+, passing an `async` function to `pre('save')` does not supply a `next` callback. Calling `next()` caused a `TypeError: next is not a function`. Resolved by using a promise-returning async function without the `next` parameter.
2. **Zod 4 `issues` property**: Zod 4 replaces `result.error.errors` with `result.error.issues`. Fixed `validateBody` middleware to check both `issues` and `errors` for backward and forward compatibility.
3. **Mongoose index duplicate warning**: Fields marked with `unique: true` in the schema definition automatically create an index. Explicitly calling `userSchema.index({ email: 1 }, { unique: true })` emitted a duplicate index warning. Resolved by removing redundant explicit index calls.

---

## Next Approved Action

**Awaiting user review and approval to stage and commit Phase 2 & Security Hardening changes.**

Upon approval, the next phase will be:
**Phase 3 — Core Features: Actions, XP Economy, Streaks, Badges, and Leaderboard**.
Scope:
- Finalize game economy values (XP per action category, streak multipliers, level curve).
- Create `Action` and `Badge` Mongoose models.
- Implement server-side action submission (`POST /api/v1/actions`) with server-controlled XP award, daily cap, and streak calculation.
- Implement Leaderboard API (`GET /api/v1/leaderboard`) with pagination and city filtering.
- Connect client Action logging form and real Leaderboard view.
