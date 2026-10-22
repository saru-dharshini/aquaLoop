# AquaLoop — Progress Tracker

> **Last Updated:** 2026-10-22
> **Canonical Root:** `C:\Users\HP\OneDrive\Desktop\aquaLoop`
> **Current Phase:** Phase 4 — Civic Water Issue Reporting & Interactive Map (Step 1 & Step 2 Fully Implemented and Verified)
> **Next Phase Gate:** Phase 5 Implementation Approval (Real-time WebSockets, Advanced Aggregations, Service Integration)
> **Latest Git Commit:** `76041ff` (`feat: implement gamification and XP ledger`)

---

## Current Project State

Phase 3B (Core Gamification) is **fully implemented and verified**. All backend services, data models, concurrency controls, anti-abuse mechanisms, and frontend views have been connected to live endpoints and tested with 43 passing automated tests.

Key Highlights:
1. **Crash-Resistant XP Engine on Standalone MongoDB:**
   - Dedicated `XPTransaction` immutable ledger serves as the single source of truth with unique compound idempotency keys (`{ idempotencyKey: 1 }`).
   - Atomic reservation pipeline on `UserDailyXP` (`$expr`, `$min`, `$subtract`) enforces the 300 XP daily cap under high concurrency without requiring multi-document ACID transactions.
   - Durable idempotency guard (`User.recentTxIds: { $ne: txId }` combined with immutable ledger sum checks) prevents duplicate XP balance application during crashes or concurrent recovery passes.
   - Distributed recovery leasing (`recoveryLeaseExpiresAt`, `recoveryWorkerId`) protects in-flight awards from premature reservation reclaims.
2. **Approved Mission Catalogue & Server-Validated Literacy Quizzes:**
   - 11 initial missions seeded (3 literacy quizzes, 6 home action missions, 2 civic reporting missions).
   - Quiz answer validation performed exclusively on the server (`correctOptionIndex` protected via `select: false`).
   - Anti-guessing 1-hour retry cooldown enforced on failed attempts (< 80%).
3. **Actions & Environmental Honesty:**
   - Strict segregation: Claimed water savings are tagged as `self_reported` until explicit admin verification.
   - Admin photo proof verification credits `verifiedLitres` and awards cap-exempt bonus XP (`isCapExempt: true`).
   - Daily habit anti-farming checks restrict daily habit submissions to 1 per IST calendar day.
4. **Streaks, Daily Bonus, & Badges:**
   - Indian Standard Time (`Asia/Kolkata`) day boundaries computed natively.
   - Streak freeze mechanic allows citizens to hold up to 2 freezes, earned at 7-day milestones. Anti-farming prevents re-earning milestone freezes on deliberate streak resets.
   - Daily bonus endpoint (`POST /api/v1/game/daily-bonus`) awards 10–25 XP random uniform roll within the 300 XP daily cap.
   - 10 platform achievement badges seeded and evaluated atomically with unique compound index `{ userId: 1, badgeSlug: 1 }`.
5. **Frontend Integration:**
   - `Dashboard.jsx`: Live authenticated view displaying real user XP, tier level, IST streak, streak freezes, self-reported vs. verified litres saved, "+ Log Action" modal, interactive literacy quiz modal, and badges showcase.
   - `XPBar.jsx`: 4 approved tiers (Droplet 0–499, Stream 500–1,499, River 1,500–3,499, Ocean Guardian 3,500+).
   - `Leaderboard.jsx`: Connected to `/api/v1/leaderboard` with city filtering, pagination, podium cards, and `[Sample Data]` badges.
   - `StatCard.jsx`: Updated with verified honesty badge support.

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
- [x] Mongoose connection with local MongoDB Community Server fallback
- [x] User model with bcrypt password hashing (12 rounds) and safe JSON projections
- [x] Fast-fail production environment validation (`server/src/config/env.js`)
- [x] Content-Type enforcement (`415 Unsupported Media Type` for non-JSON)
- [x] HS256 algorithm pinning & HTTP-only cookie session management
- [x] Rate limiting on auth endpoints (15/hr register, 20/15min login)
- [x] RBAC enforcement middleware (`requireRole`)
- [x] Client AuthContext with automatic session restore on mount

### Phase 3A — Game Economy Specification & Planning ✅
- [x] Comprehensive architecture specification (`GAME_ECONOMY.md`)
- [x] Approved decisions D1–D5
- [x] Concurrency and crash recovery design for standalone MongoDB
- [x] Anti-farming and anti-guessing mechanisms

### Phase 3B — Core Gamification Implementation ✅

#### Backend Models (`server/src/models/`)
- [x] **`XPTransaction.js`**: Immutable ledger with unique compound idempotency key index (`{ idempotencyKey: 1 }`), state machine (`PENDING_RESERVATION`, `RESERVED`, `COMMITTED`, `ABORTED`), and recovery lease fields.
- [x] **`UserDailyXP.js`**: Daily XP tracker in `Asia/Kolkata` with atomic `$expr` update pipeline guaranteeing 300 XP cap.
- [x] **`Mission.js`**: 11 missions with protected quiz answer indices (`select: false`).
- [x] **`UserMission.js`**: Tracks completion status, percentage score, and 1-hour anti-guessing cooldown (`retryAvailableAt`).
- [x] **`Action.js`**: Tracks water-saving actions, claimed vs. verified litres, verification status, and photo proof URLs.
- [x] **`Badge.js` & `UserBadge.js`**: 10 platform achievement badges with unique compound index `{ userId: 1, badgeSlug: 1 }`.
- [x] **`User.js`**: Extended with `streakFreezes`, `lastActiveDateIST`, `claimedStreakMilestones`, `verifiedWaterSavedLitres`, `isSample`, `city`, and bounded `recentTxIds`.

#### Backend Services (`server/src/services/`)
- [x] **`xpLedgerService.js`**: Atomic single-document reservation pipeline, durable balance projection, crash recovery (`reconcileUserXP`), and disaster recovery rebuild (`rebuildUserXPProjection`).
- [x] **`missionService.js`**: Seeds default missions, computes quiz score ($\ge 80\%$), hides answers, enforces 1-hour retry cooldown.
- [x] **`actionService.js`**: Action logging, daily habit rate limiting (1/day IST), admin verification with bonus XP (`isCapExempt: true`), updates verified water litres.
- [x] **`streakService.js`**: IST calendar day calculations, streak increments, streak freezes (max 2), milestone awards, and 10–25 XP daily bonus roll.
- [x] **`badgeService.js`**: Seeds 10 badges, evaluates unlock conditions atomically without duplicates.
- [x] **`leaderboardService.js`**: Deterministic multi-key sort (`xp: -1`, `streak: -1`, `createdAt: 1`, `_id: 1`), pagination, city filter, sample data exclusion.

#### Backend Routes & Controllers (`server/src/controllers/`, `server/src/routes/`)
- [x] `missionController.js` & `missionRoutes.js`: `GET /api/v1/missions`, `GET /api/v1/missions/:slug`, `POST /api/v1/missions/:slug/quiz`
- [x] `actionController.js` & `actionRoutes.js`: `POST /api/v1/actions`, `GET /api/v1/actions/my`, `PATCH /api/v1/actions/:id/verify`
- [x] `gameController.js` & `gameRoutes.js`: `POST /api/v1/game/daily-bonus`, `GET /api/v1/game/badges`, `GET /api/v1/game/badges/my`, `GET /api/v1/game/leaderboard`, `GET /api/v1/leaderboard`

#### Frontend Components & Views (`client/src/`)
- [x] **`Dashboard.jsx`**: Fully wired to live gamification APIs:
  - Real user XP, tier level, IST streak, and streak freezes
  - "Claim Daily Bonus" button with instant toast feedback and user state refresh
  - "+ Log Action" modal with mission dropdown, claimed litres, and photo proof URL
  - Interactive literacy quiz modal with radio option selector and pass/fail feedback
  - Conservation actions ledger table displaying claimed vs. verified litres and status badges
  - Achievements and badges showcase displaying unlocked vs. locked badges
  - Guest demo preview mode with sample data notice
- [x] **`XPBar.jsx`**: 4 approved level tiers and progress calculation.
- [x] **`Leaderboard.jsx`**: Live `/api/v1/leaderboard` connection with city dropdown, podium cards, pagination, and `[Sample Data]` badges.
- [x] **`StatCard.jsx`**: Added support for `honesty="verified"` badge.

### Phase 4 — Civic Water Issue Reporting & Interactive Map (In Progress)

#### Phase 4 Step 1 — Models, Spatial Settlement & Image Sanitisation ✅
- [x] **Pure-JS Buffer Inspection & Sanitizer (`server/src/utils/imageSanitizer.js`)**:
  - Validates magic bytes for JPEG (`FF D8 FF`) and PNG (`89 50 4E 47 0D 0A 1A 0A`).
  - Strips EXIF/GPS/APP1..15 and COM segments from JPEG buffers.
  - Strips ancillary metadata chunks (`eXIf`, `tEXt`, `zTXt`, `iTXt`, `tIME`, `pHYs`) from PNG buffers.
  - Strictly rejects unsupported/unsafe formats (WebP, SVG, GIF, BMP, plain text) and malformed/oversized buffers (>5MB) with 400/413 status codes.
  - Zero paid external dependencies or platform-specific binaries.
- [x] **Civic Report Model (`server/src/models/Report.js`)**:
  - Approved categories: `public_leak`, `water_contamination`, `community_wastage`, `dry_public_tap`.
  - Lifecycle statuses: `open`, `in_review`, `resolved`, `closed`.
  - Settlement state machine: `unsettled`, `final_primary`, `final_corroboration`.
  - GeoJSON Point coordinates with `2dsphere` index and compound query indexes.
  - Environmental impact estimation fields with strict honesty labels (`estimatedLitresPerHour`, `measuredLitresSaved`, `impactHonestyLabel`).
- [x] **Spatial Lease Model (`server/src/models/SpatialLease.js`)**:
  - Deterministic 0.0005° grid coordinate hashing (`cell_gx_gy`).
  - Lexicographically sorted 9-neighbourhood multi-cell lease acquisition.
  - Lease token UUIDs, fencing version incrementation on takeover, and automatic TTL expiration.
  - Safe release filtering by both `reportId` and `leaseToken` preventing stale workers from releasing newer leases.
- [x] **Atomic Spatial Settlement Engine (`server/src/services/reportService.js`)**:
  - Ingestion gate: reports created with `settlementStatus: 'unsettled'`, `baseXPAwarded: false`, base XP withheld.
  - 50-metre proximity deduplication via `$nearSphere`.
  - Atomic settlement to `final_primary` (30 XP awarded via existing `XPTransaction` ledger, daily capped) or `final_corroboration` (0 XP, links to primary, increments corroboration counter).
  - Background crash recovery sweeper (`reconcileReports`) for stalled unsettled reports and expired leases.
- [x] **Comprehensive Step 1 Test Suite (`server/tests/reportSettlement.test.js`)**:
  - 18 tests covering schema validation, GeoJSON index queries, image sanitisation, polyglot stripping, multi-cell contention/fencing, concurrent adjacent settlements, withheld XP, post-write fencing confirmation, and idempotent reconciler recovery.

#### Phase 4 Step 2 — Report APIs, Secure Uploads, Recovery Sweeper & Map UI ✅
- [x] **Hardened Image Sanitisation Utility (`server/src/utils/imageSanitizer.js`)**:
  - Validates magic bytes for JPEG and PNG.
  - Enforces valid `SOF` frame headers in JPEG and slices cleanly at the real `EOI` marker (`FF D9`), strictly dropping trailing polyglot payloads.
  - Rejects truncated markers, out-of-bounds segments, and malformed structures with clear 400 errors.
  - Enforces `IHDR` first chunk, `IDAT` presence, and `IEND` termination in PNG streams.
- [x] **Multer Local Upload Middleware (`server/src/middleware/uploadMiddleware.js`)**:
  - In-memory upload buffer handling (prevents unvalidated files from touching disk).
  - Enforces 5MB limit with clean 413 error.
  - Generates cryptographically random UUID filenames under `server/uploads/reports/` (immune to path traversal).
  - ₹0 operating cost: no external paid APIs, cloud buckets, or third-party storage.
- [x] **Civic Report API Endpoints (`server/src/controllers/reportController.js`, `server/src/routes/reportRoutes.js`)**:
  - `POST /api/v1/reports`: Authenticated report submission with withheld XP until spatial settlement settles as `final_primary` (30 base XP) or `final_corroboration` (0 XP).
  - `GET /api/v1/reports`: Public-safe querying with category, status, bounding box, radius filters, pagination, and strict sample data exclusion from community metrics.
  - `GET /api/v1/reports/:id`: Single report public safe projection.
  - `PATCH /api/v1/reports/:id/status`: Admin-only status review (`requireRole('admin')`), awarding 50 cap-exempt bonus XP upon `resolved` status with idempotent key `report_resolve_${reportId}`. Updates honesty labels on measured litres.
- [x] **In-Process Reconciliation Sweeper Lifecycle (`server/src/index.js`, `server/src/services/reportService.js`)**:
  - `reconcileReports()` guarded with an in-process re-entrancy lock to prevent overlapping runs.
  - Recurring interval (30s) registered in `index.js`, safe against crashes and retries.
  - Graceful shutdown handles `SIGTERM`/`SIGINT`, stopping new reconciliation work and closing server cleanly.
- [x] **Frontend Leaflet Interactive Map & Report Submission (`client/src/pages/`)**:
  - `ReportIssue.jsx`: Category selection, interactive Leaflet location picker centered on India (`[20.5937, 78.9629]`, zoom 5), manual coordinate inputs, browser geolocation button, optional sanitized image upload, and honest settlement status feedback.
  - `ImpactMap.jsx`: Leaflet OpenStreetMap view with custom offline SVG pins, popups showing resolution status & honesty labels, real community metric counters (sample data strictly excluded), and an accessible table list fallback view with keyboard navigation.
  - `MapMarkerIcons.js`: Zero external network dependencies for map pins; matches Living Water design tokens.
- [x] **Full Automated Test Coverage (`server/tests/reportApi.test.js`)**:
  - 11 comprehensive tests covering submission, uploads, polyglot stripping, public browsing, sample data exclusion, admin RBAC, 50 cap-exempt resolution XP idempotency, and reconciliation lifecycle safety.

#### Phase 4 Targeted Hardening & Quality Audit Fixes ✅
- [x] **MongoDB Spatial Query Compatibility (`reportService.js`)**:
  - Removed database-level `.sort({ createdAt: 1, _id: 1 })` chained to `$nearSphere` on candidate query line 355 to prevent potential `BadValue: cannot use sort with $nearSphere` on real MongoDB instances.
  - Preserved deterministic in-memory total ordering (`candidateReports.sort(...)`) and spatial settlement logic.
- [x] **Badge Evaluation on Report Resolution (`reportService.js` & `reportController.js`)**:
  - Connected `checkAndAwardBadges(report.reporterId)` in `updateReportStatus` when a report genuinely transitions to `'resolved'`.
  - Guarded against duplicate resolution calls so badges are not repeatedly evaluated or awarded.
  - Returned `newBadges` in controller response.
- [x] **Protected `isSample` Flag on Report Submission (`reportController.js`)**:
  - Restricted `isSample: true` in `handleCreateReport` to authorized admins or explicit demo accounts (`req.user.isSample === true`).
  - Added 403 Forbidden rejection when ordinary citizens attempt to pass `isSample: true`.
- [x] **Automated Regression Test Suite (`reportApi.test.js`)**:
  - Added test confirming citizen attempt to pass `isSample: true` is rejected with 403.
  - Added test confirming admin can create sample report with `isSample: true`.
  - Added test confirming reporter earns Level 2 badge (`stream-scout`) upon report resolution (crossing 500 XP), and duplicate resolution requests return `newBadges: []`.

---

## Verification and Test Results

### 1. Backend Integration Test Suite (Vitest + MongoMemoryServer)
Command: `npm test` inside `server/`
```
 ✓ tests/reportSettlement.test.js (18 tests)
 ✓ tests/auth.test.js (23 tests)
 ✓ tests/reportApi.test.js (14 tests)
 ✓ tests/xpLedger.test.js (14 tests)
 ✓ tests/gamification.test.js (12 tests)

 Test Files  5 passed (5)
      Tests  81 passed (81)
   Duration  18.98s
```

### 2. Frontend Production Build (Vite)
Command: `npm run build` inside `client/`
```
✓ 2082 modules transformed.
dist/index.html                   1.24 kB │ gzip:   0.65 kB
dist/assets/index-2L0V0k7Y.css   29.59 kB │ gzip:   9.74 kB
dist/assets/index-bUwCifIl.js   609.64 kB │ gzip: 182.10 kB
✓ built in 1.43s — 0 errors
```

### 3. Frontend Lint (Oxlint)
Command: `npm run lint` inside `client/`
```
Found 0 errors (5 compiler purity/fast-refresh warnings). Finished in 164ms on 27 files.
```

---

## Known Limitations

1. **Local MongoDB standalone replica set requirement**: Standalone local MongoDB Community Server instances do not support multi-document transactions. Concurrency safety is achieved via single-document atomic aggregation update pipelines on `UserDailyXP`, distributed leases on `SpatialLease`, optimistic post-write fencing confirmation, and immutable ledger documents.
2. **In-memory test database vs. persistent database**: All automated tests run against an isolated in-memory MongoDB instance via `mongodb-memory-server`. In local development, the server connects to `mongodb://localhost:27017/aqualoop` or falls back gracefully with setup instructions.
3. **Pure-JS Image Sanitisation Scope**: Format validation and metadata stripping operate on marker/chunk structure without full pixel-level decompression or re-encoding. It strictly strips EXIF/GPS/comments and polyglot trailing data, but does not re-render pixels.
4. **Tile Provider Limits**: The map relies on standard OpenStreetMap public tile servers (`tile.openstreetmap.org`) under their standard usage policy (requires proper user-agent attribution and prohibits bulk pre-fetching).

---

## Next Approved Action

**Awaiting user review and acceptance of Phase 4 Step 2 results before proceeding to Phase 5 (Real-time Updates, Public Engagement & Advanced Aggregations).**
