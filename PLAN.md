# AquaLoop — Implementation Plan

> **Version:** 0.2 (Phase 0 — Planning; root corrected)
> **Canonical Root:** `C:\Users\HP\OneDrive\Desktop\aquaLoop`
> **Last Updated:** 2026-10-14
> **Status:** Awaiting explicit user approval before Phase 1 begins.
> **Hard Constraint:** ₹0 operating cost — no mandatory paid services, no billing-required APIs.

---

## 1. Project Overview

AquaLoop is a MERN (MongoDB · Express · React · Node) web application for:

- **Gamified water conservation** — citizens earn XP and badges by logging verified water-saving actions.
- **Community issue reporting** — geo-tagged water-leak and contamination reports with photo upload.
- **Groundwater awareness** — educational content backed by open datasets; no invented statistics.
- **Transparent impact tracking** — public dashboard displaying community-aggregated figures with honest "sample data" labels until real data is accumulated.

All XP awards, badge unlocks, and authorization decisions are **server-controlled** and never trusted from the client.

---

## 2. Confirmed Technical Environment

| Item | Value | Status |
|---|---|---|
| Canonical root | `C:\Users\HP\OneDrive\Desktop\aquaLoop` | ✅ Confirmed |
| Node.js | v24.14.1 | ✅ Compatible |
| npm | v11.11.0 | ✅ Compatible (v11.21.0 available, optional) |
| Vite | ^8.x to be scaffolded fresh | ⬜ Not installed yet |
| React | ^19.x to be scaffolded fresh | ⬜ Not installed yet |
| Git | Initialised — but see §9 (Critical Risk) | 🔴 Root misplaced |
| OS | Windows 11, PowerShell | — |

> **Note:** The Vite + React 19 scaffold that exists at `C:\Users\HP\AquaLoop\client\` is **not used** unless explicitly approved. AquaLoop is built from scratch inside the canonical root.

---

## 3. Proposed Folder Structure

```
C:\Users\HP\OneDrive\Desktop\aquaLoop\     ← CANONICAL ROOT
│
├── PLAN.md                                ← this file
├── PROGRESS.md
├── .gitignore                             ← root-level (Phase 1, Step 0)
├── .agents/
│   └── rules/
│       └── aqualoop-rules.md              ← persistent Antigravity rules (Phase 1, Step 0)
│
├── client/                                ← Vite + React 19 (Phase 1 — to scaffold fresh)
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── assets/                        ← logo, illustrations
│   │   ├── components/
│   │   │   ├── ui/                        ← Button, Card, Badge, Avatar, ProgressBar…
│   │   │   ├── layout/                    ← Navbar, Sidebar, Footer
│   │   │   └── features/
│   │   │       ├── auth/
│   │   │       ├── dashboard/
│   │   │       ├── gamification/
│   │   │       ├── issues/
│   │   │       └── awareness/
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── ReportIssue.jsx
│   │   │   ├── Leaderboard.jsx
│   │   │   ├── Awareness.jsx
│   │   │   └── ImpactMap.jsx
│   │   ├── hooks/
│   │   ├── context/                       ← AuthContext, ThemeContext
│   │   ├── services/                      ← axios wrappers per domain
│   │   ├── utils/                         ← formatters, validators
│   │   ├── App.jsx
│   │   ├── index.css                      ← full design system
│   │   └── main.jsx
│   ├── .gitignore
│   ├── eslint.config.js
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
└── server/                                ← Express + Node (Phase 2 — to create)
    ├── src/
    │   ├── config/                        ← db.js, passport.js
    │   ├── controllers/
    │   ├── middleware/                    ← auth, errorHandler, upload
    │   ├── models/
    │   │   ├── User.js
    │   │   ├── Report.js
    │   │   ├── Action.js
    │   │   ├── Badge.js
    │   │   └── WellReading.js
    │   ├── routes/
    │   │   ├── auth.js
    │   │   ├── users.js
    │   │   ├── reports.js
    │   │   ├── actions.js
    │   │   └── leaderboard.js
    │   ├── utils/
    │   └── index.js
    ├── .env.example
    └── package.json
```

---

## 4. Technical Architecture

### 4.1 Frontend (`client/`)

| Layer | Technology | Notes |
|---|---|---|
| Build tool | Vite 8 | Fresh scaffold in canonical root |
| UI framework | React 19 | Latest stable |
| Routing | React Router v7 | File-based or object routing TBD |
| Server state | TanStack Query v5 | Declarative data-fetching, caching |
| Client state | React Context + useReducer | Auth, theme only |
| Forms | React Hook Form + Zod | Schema-based validation |
| Charts | Recharts | SVG, React-native, MIT |
| Maps | Leaflet + react-leaflet | OSM tiles — no API key |
| Styling | **Vanilla CSS custom properties** | Light-first, polished environmental theme |
| Icons | Lucide React | MIT, tree-shakeable |
| Animations | CSS transitions only | Framer Motion added only if needed |
| HTTP | Axios | Interceptors for JWT injection |

### 4.2 Backend (`server/`)  — Phase 2

| Layer | Technology |
|---|---|
| Runtime | Node.js 24 |
| Framework | Express 5 |
| Database | MongoDB Atlas M0 (free, 512 MB) |
| ODM | Mongoose 8 |
| Auth | JWT (httpOnly cookie) + bcrypt |
| File upload | Multer + Cloudinary Free (25 GB/mo) |
| Email | Nodemailer + Gmail SMTP (free, 500/day) |
| Rate limiting | express-rate-limit |
| Validation | Zod (schema shared with frontend) |
| Logging | Morgan |

### 4.3 Zero-Cost Infrastructure

| Concern | Solution | Cost |
|---|---|---|
| Database | MongoDB Atlas M0 (512 MB) | ₹0 |
| Image hosting | Cloudinary Free Tier | ₹0 (account required) |
| Client hosting | Vercel Free | ₹0 |
| Server hosting | Render Free (cold-start after 15 min) | ₹0 |
| Maps | OpenStreetMap via Leaflet | ₹0 |
| Email | Gmail SMTP | ₹0 |
| Open data | India-WRIS / data.gov.in | ₹0 |

### 4.4 REST API Shape (`/api/v1/`)

```
POST   /auth/register
POST   /auth/login
POST   /auth/logout
GET    /auth/me

POST   /actions                  (log water-saving action; XP awarded server-side)
GET    /actions                  (own history)
GET    /leaderboard              (top users, filterable by city)

POST   /reports                  (geo-tagged issue + optional photo)
GET    /reports                  (paginated, open/resolved filter)
PATCH  /reports/:id/status       (admin only)

GET    /users/:id/profile
GET    /impact                   (aggregated community stats; labelled if sample data)
GET    /awareness                (educational articles; public)
GET    /health                   ({ status: "ok" })
```

### 4.5 Authorization Model

- All XP awards, badge unlocks, and role checks happen **exclusively on the server**.
- The client receives computed values (current XP, level, badges) but never sends them.
- `role: 'citizen' | 'admin'` — admin seeded via a one-time CLI script (no separate UI flow).
- JWT stored in **httpOnly cookie** (decided: prevents XSS token theft).

---

## 5. Design System — "Living Water" Theme

### 5.1 Philosophy

Light-first, polished, environmental-adventure aesthetic. Clean, nature-inspired surfaces — **not glassmorphism**. Think illustrated field-guide meets modern civic app. Glassmorphism panels are explicitly avoided.

### 5.2 Color Palette

```css
/* Core — clear water blues */
--color-primary-50:   #e0f7fa;
--color-primary-100:  #b2ebf2;
--color-primary-400:  #26c6da;
--color-primary-600:  #0097a7;  /* main interactive */
--color-primary-800:  #00626b;

/* Growth — leaf greens */
--color-green-100:    #dcedc8;
--color-green-500:    #66bb6a;
--color-green-700:    #388e3c;

/* Earth — warm soil */
--color-earth-200:    #d7ccc8;
--color-earth-600:    #6d4c41;

/* Sky — ambient light */
--color-sky-50:       #f0f9ff;
--color-sky-100:      #e1f3fd;

/* Reward — sunlit gold */
--color-gold-400:     #ffca28;
--color-gold-600:     #f9a825;

/* Neutral */
--color-neutral-50:   #fafafa;
--color-neutral-100:  #f5f5f5;
--color-neutral-700:  #616161;
--color-neutral-900:  #212121;

/* Semantic */
--color-danger:       #e53935;
--color-warning:      #fb8c00;
--color-success:      #43a047;
--color-info:         #1e88e5;

/* Light mode surfaces */
--surface-base:       #ffffff;
--surface-raised:     #f5f5f5;
--surface-overlay:    #eeeeee;

/* Dark mode surfaces (overridden via [data-theme="dark"]) */
--surface-base-dark:    #1a1f2e;
--surface-raised-dark:  #242b3d;
--surface-overlay-dark: #2e3850;
```

### 5.3 Typography

- **Display / Heading:** `'Outfit'` — Google Fonts, variable weight 100–900
- **Body:** `'Inter'` — Google Fonts, variable weight 100–900
- **Mono:** `'JetBrains Mono'` — code/data snippets only
- **Scale (px):** 12 · 14 · 16 · 18 · 20 · 24 · 30 · 36 · 48 · 60

### 5.4 Spacing & Shape

- **Spacing base:** 4 px (scale: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128)
- **Border radius:** 4 (small), 8 (base), 12 (card), 16 (modal), 9999 (pill)
- **Shadows:** 3-level system (sm, md, lg) — coloured tints where appropriate
- **No frosted glass / backdrop-filter** panels as primary surfaces

### 5.5 Motion

- Default easing: `cubic-bezier(0.4, 0, 0.2, 1)` (Material standard)
- Duration scale: 100 ms (micro) · 200 ms (quick) · 300 ms (standard) · 500 ms (emphasis)
- `@media (prefers-reduced-motion: reduce)` respected on all animated elements

### 5.6 Core Component Inventory

| Component | Notes |
|---|---|
| `<Button>` | variants: primary, secondary, outline, ghost, danger |
| `<Card>` | solid surface, optional header/footer slot |
| `<Badge>` | pill: category, tier, status |
| `<Avatar>` | initials fallback, ring indicator |
| `<XPBar>` | animated fill, level tooltip |
| `<StatCard>` | icon + metric + label; "sample data" tag slot |
| `<ReportCard>` | status pill, upvote count, map thumbnail |
| `<LeaderboardRow>` | rank medal, avatar, name, points |
| `<Navbar>` | responsive, auth-aware |
| `<Sidebar>` | collapsible, desktop only |
| `<Modal>` | accessible focus-trap dialog |
| `<Toast>` | notification stack, auto-dismiss |
| `<MapView>` | Leaflet wrapper, OSM tiles |
| `<ActionForm>` | category picker, water-saved field |
| `<ReportForm>` | geo-picker, photo upload |

---

## 6. Gamification Data Model

### 6.1 User (Mongoose — Phase 2)

```js
{
  _id, username, email, passwordHash,
  avatar: String,             // Cloudinary URL
  role: 'citizen' | 'admin',

  // Game state — computed server-side, never client-trusted
  points: { type: Number, default: 0 },
  xp:     { type: Number, default: 0 },
  level:  { type: Number, default: 1 },
  streak: { type: Number, default: 0 },
  lastActiveDate: Date,
  badges: [{ badgeId: ObjectId, earnedAt: Date }],

  // Aggregate stats
  totalWaterSavedLitres: { type: Number, default: 0 },  // self-reported; labelled
  reportsSubmitted:      { type: Number, default: 0 },
  actionsLogged:         { type: Number, default: 0 },

  createdAt, updatedAt
}
```

### 6.2 Action Schema

```js
{
  _id, userId: ObjectId,
  category: 'fix_leak' | 'rainwater_harvest' | 'reuse_greywater' |
             'shorter_shower' | 'drip_irrigation' | 'other',
  description: String,
  waterSavedLitres: Number,   // self-reported; displayed with honesty label
  xpAwarded: Number,          // set by server, immutable after creation
  pointsAwarded: Number,      // set by server
  verifiedByAdmin: Boolean,
  verificationMultiplierApplied: Boolean,
  proofImageUrl: String | null,
  createdAt
}
```

### 6.3 Report Schema

```js
{
  _id, reporterId: ObjectId,
  type: 'leak' | 'contamination' | 'wastage' | 'drought_zone',
  title, description,
  location: { type: 'Point', coordinates: [lng, lat] },  // GeoJSON
  address: String,
  photos: [String],            // Cloudinary URLs
  status: 'open' | 'in_review' | 'resolved' | 'closed',
  upvotes: Number,
  assignedTo: ObjectId | null,
  resolvedAt: Date | null,
  createdAt, updatedAt
}
```

### 6.4 Badge Schema

```js
{
  _id, name, slug, description, iconUrl,
  condition: {
    type: 'xp_threshold' | 'actions_count' | 'reports_count' |
          'streak_days' | 'special',
    value: Number
  },
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
}
```

### 6.5 Game Economy — Values Requiring Approval

> ⚠️ **These must be signed off before Phase 3 begins. Phase 1 and 2 are unaffected.**

| Decision | Proposed Value | Status |
|---|---|---|
| XP per action category | Fix leak: 80 · Rainwater: 100 · Greywater reuse: 70 · Shorter shower: 40 · Drip irrigation: 90 · Other: 30 | ⬜ Pending |
| Admin-verified multiplier | 2× XP | ⬜ Pending |
| Max XP per day per user | 500 XP | ⬜ Pending |
| XP-to-level formula | `level = floor((xp / 100) ^ 0.75) + 1` | ⬜ Pending |
| Streak threshold for multiplier | 7 consecutive days → 1.25× daily XP | ⬜ Pending |
| Report resolution XP bonus | +50 XP to reporter on resolution | ⬜ Pending |
| Point decay on inactivity | None | ⬜ Pending |
| Leaderboard scope | Global + optional city filter | ⬜ Pending |
| Badge auto-unlock vs admin-grant | Auto on threshold; admin can grant "special" tier | ⬜ Pending |

---

## 7. Implementation Phases

### Phase 0 — Inspection & Planning ← **CURRENT**
**Acceptance Criteria:**
- [x] Full inspection complete (both candidate directories)
- [x] Canonical root confirmed: `C:\Users\HP\OneDrive\Desktop\aquaLoop`
- [x] PLAN.md and PROGRESS.md created in canonical root
- [ ] Critical git risk acknowledged and resolved (see §9)
- [ ] User approval received

---

### Phase 1 — Client Foundation
**Scope:** Git hygiene, Antigravity rules, Vite scaffold, design system, routing scaffold, static pages.

**Acceptance Criteria:**
- [ ] `.git` issue resolved (see §9 — requires user decision)
- [ ] `.agents/rules/aqualoop-rules.md` created
- [ ] Root `.gitignore` created
- [ ] `client/` scaffolded fresh with `create-vite` (react template, JS)
- [ ] `index.html` updated: title "AquaLoop", meta description, Outfit + Inter font preloads
- [ ] `index.css` → full design system (tokens, reset, typography)
- [ ] `App.jsx` → React Router routes for all 8 pages
- [ ] `vite.config.js` → `/api` proxy to `localhost:5000`
- [ ] All 8 page stubs created (no API calls, static layout)
- [ ] Navbar and Sidebar working with navigation
- [ ] Auth forms rendered (no submit logic)
- [ ] `npm run dev` starts without errors
- [ ] `npm run lint` zero errors
- [ ] Responsive: 320 px (mobile) through 1440 px (desktop)

**Client dependencies to install:**
```
react-router-dom
@tanstack/react-query
axios
react-hook-form zod @hookform/resolvers
recharts
react-leaflet leaflet
lucide-react
```

---

### Phase 2 — Express + MongoDB Backend
**Acceptance Criteria:**
- [ ] `server/` created with `npm init`
- [ ] Express 5, Mongoose 8, cors, morgan, express-rate-limit, bcryptjs, jsonwebtoken, dotenv, zod installed
- [ ] MongoDB Atlas M0 connected via `MONGODB_URI` env var
- [ ] All 5 Mongoose models with indexes (2dsphere on Report.location)
- [ ] Auth routes: POST /register, /login, /logout, GET /me — JWT in httpOnly cookie
- [ ] JWT middleware protecting private routes
- [ ] `GET /api/v1/health` → `{ status: "ok", timestamp }`
- [ ] Multer + Cloudinary upload middleware ready
- [ ] `.env.example` documenting all required env vars

---

### Phase 3 — Core Features: Actions + XP + Leaderboard
**Acceptance Criteria:**
- [ ] Auth fully wired (register → login → cookie → /me)
- [ ] Action logging: POST /actions creates record, awards XP server-side
- [ ] XP bar and level computed and rendered on Dashboard
- [ ] Badge unlocks checked on every action (server-side)
- [ ] Leaderboard page shows top 50, paginated, city-filterable
- [ ] Daily XP cap enforced server-side

---

### Phase 4 — Issue Reporting + Map
**Acceptance Criteria:**
- [ ] Report form: category, description, geo-picker, optional photo upload to Cloudinary
- [ ] GeoJSON stored; 2dsphere index confirmed active
- [ ] Public map: all open reports shown as Leaflet markers
- [ ] Report detail popup with status badge, upvote button
- [ ] Admin: PATCH /reports/:id/status (protected route)
- [ ] Reporter earns +50 XP on resolution (server-side)

---

### Phase 5 — Groundwater Awareness + Impact Dashboard
**Acceptance Criteria:**
- [ ] Awareness page: article cards from a seeded JSON file (no invented stats)
- [ ] Impact dashboard: community totals (litres saved, reports resolved, active users)
- [ ] Any figure derived from user-reported data carries visible "Self-reported" label
- [ ] Any figure from sample/seed data carries visible "Sample data" tag
- [ ] At least one chart backed by a real open dataset (India-WRIS or data.gov.in)
- [ ] All charts responsive and keyboard-accessible

---

### Phase 6 — Testing + Deployment
**Acceptance Criteria:**
- [ ] Vitest + React Testing Library configured in `client/`
- [ ] Unit tests: utility functions, UI components (≥ 10 tests)
- [ ] Supertest integration tests: all API routes (≥ 15 tests)
- [ ] `mongodb-memory-server` for isolated backend tests
- [ ] Lighthouse ≥ 90 on Performance, Accessibility, Best Practices
- [ ] Client deployed: Vercel (free)
- [ ] Server deployed: Render (free)
- [ ] MongoDB Atlas M0 in production
- [ ] All env vars documented in `.env.example`
- [ ] GitHub Actions CI: lint → test → build

---

## 8. Testing Strategy

### Frontend (Vitest + React Testing Library)
- Utility functions: formatters, XP calculators, validators
- UI components: Button, Badge, XPBar, StatCard — render + interaction
- Page-level with MSW (Mock Service Worker) for API mocking

### Backend (Vitest / Jest + Supertest + mongodb-memory-server)
- Route integration tests (all endpoints, auth and unauth paths)
- Middleware tests (JWT, rate-limit, upload)
- Model validation tests

### Quality
- Code coverage target: ≥ 70% for both client utilities and server routes
- GitHub Actions (free tier): `lint → test → build` on every push to `main`

---

## 9. Known Risks and Required Decisions

### 🔴 CRITICAL — Git root is at `C:\Users\HP\`, not `aquaLoop\`

The `.git` directory lives at `C:\Users\HP\` — meaning git is currently tracking the **entire user home directory** as a single repository. The `aquaLoop` folder has no `.git` of its own.

**Options (user must choose one):**

| Option | Action | Trade-off |
|---|---|---|
| A (Recommended) | Delete `C:\Users\HP\.git` and run `git init` inside `aquaLoop\` | Loses any home-level history (there is none — zero commits) |
| B | Add `aquaLoop` as a sub-path of the home repo (not recommended) | Entangles unrelated projects |
| C | Leave as-is and work without git until decision made | No version control during Phase 1 |

> **Awaiting user decision before Phase 1 begins.**

### 🟠 MEDIUM — Cloudinary account required for photo uploads
Free tier. Requires a Cloudinary account (email + password, no billing). Acceptable under ₹0 constraint, but needs explicit acknowledgement.

### 🟡 LOW — npm minor update available
npm 11.11.0 → 11.21.0. Not blocking.

### 🟡 LOW — Render cold starts (~30–60 s) on free tier
First request after 15 min inactivity will be slow. Acceptable for demo; must be noted in user-facing documentation.

---

## 10. Persistent Project Instructions (Antigravity Rules)

**Verified mechanism:** `.agents/rules/aqualoop-rules.md` in the workspace root.

Antigravity automatically discovers and injects `<project-root>/.agents/rules/*.md` into every conversation in this workspace.

**File to create (Phase 1, Step 0):**
```
C:\Users\HP\OneDrive\Desktop\aquaLoop\.agents\rules\aqualoop-rules.md
```

**Contents it must include:**
- Canonical root path
- Tech stack constraints (no TypeScript, no Tailwind, no paid APIs)
- Design rule: light-first, no glassmorphism, "Living Water" palette
- Game-economy values (after approval in §6.5)
- Phase gate: do not implement beyond the currently approved phase
- Honest-data rule: never invent water-saving measurements; label all sample data
- Server-authority rule: XP, badges, and role checks are server-side only
