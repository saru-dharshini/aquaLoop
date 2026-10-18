# AquaLoop — Progress Tracker

> **Last Updated:** 2026-10-18
> **Canonical Root:** `C:\Users\HP\OneDrive\Desktop\aquaLoop`
> **Current Phase:** Phase 1 — Foundation (COMPLETE pending lint/build confirmation)
> **Next Phase Gate:** Phase 2 (requires explicit user approval)

---

## Current Project State

Phase 1 is **functionally complete**. Both the Vite + React client and the Express server start and respond correctly. All 8 pages are scaffolded. All UI components are built. The design system is fully implemented.

---

## Work Completed

### Phase 0 — Planning ✅
- [x] Full project inspection (both candidate directories)
- [x] Canonical root confirmed: `C:\Users\HP\OneDrive\Desktop\aquaLoop`
- [x] `PLAN.md` and `PROGRESS.md` created in canonical root
- [x] Git isolated at canonical root (separate from `C:\Users\HP\.git`)

### Phase 1 — Foundation ✅

#### Infrastructure
- [x] `.agents/rules/aqualoop-rules.md` — persistent Antigravity workspace rules
- [x] Root `.gitignore` — excludes node_modules, .env, dist, logs, uploads
- [x] Root `package.json` — convenience scripts for running client + server
- [x] `client/` — fresh Vite 8 + React 19 scaffold
- [x] `server/` — Express 5 server with full directory structure

#### Client (`client/`)
- [x] `index.html` — AquaLoop title, meta description, Outfit + Inter + JetBrains Mono via Google Fonts (preconnect)
- [x] `src/index.css` — **Complete "Living Water" design system**: all 40+ CSS tokens, reset, typography, buttons, cards, badges, inputs, navbar, stat-card, animations, dark mode, reduced-motion, focus-visible, scrollbar, selection
- [x] `src/main.jsx` — BrowserRouter wrapping App
- [x] `src/App.jsx` — QueryClient, ThemeProvider, AuthProvider, ToastProvider + all 8 routes wired to real page components
- [x] `vite.config.js` — `/api` proxy to `localhost:5000`, chunk size warning
- [x] `client/.env.example` — documents VITE_ prefix convention
- [x] `public/favicon.svg` — water-drop on teal circle

#### Pages (all 8)
- [x] `pages/Home.jsx` — hero, features grid, sample impact stats (honest labels), dark navy CTA footer
- [x] `pages/Login.jsx` — full form with validation, show/hide password, accessible
- [x] `pages/Register.jsx` — full form with field-level validation, Phase 2 API stub
- [x] `pages/Dashboard.jsx` — Sidebar + XPBar + StatCards + recent-actions table (sample data labelled)
- [x] `pages/ReportIssue.jsx` — category radio cards, form validation, photo upload stub
- [x] `pages/Leaderboard.jsx` — podium + full table with sample data
- [x] `pages/Awareness.jsx` — article cards linked to open data sources
- [x] `pages/ImpactMap.jsx` — stat cards + Leaflet map placeholder
- [x] `pages/NotFound.jsx` — 404 with water-themed messaging

#### Components
- [x] `components/layout/Navbar.jsx` — responsive, NavLink active states, mobile menu, aria
- [x] `components/layout/Footer.jsx` — brand, nav links, open data attributions
- [x] `components/layout/Sidebar.jsx` — collapsible, animated, badge support
- [x] `components/ui/Button.jsx` — 5 variants, 3 sizes, loading state, icon slots, forwardRef
- [x] `components/ui/Card.jsx` — header/footer slots, 3 variants
- [x] `components/ui/Badge.jsx` — all variants incl. `sample` and `self-reported` honesty labels
- [x] `components/ui/Avatar.jsx` — image/initials fallback, deterministic colour hue, online ring
- [x] `components/ui/XPBar.jsx` — animated, server-values only, ARIA progressbar
- [x] `components/ui/StatCard.jsx` — icon, trend, honesty badge slot
- [x] `components/ui/Modal.jsx` — focus trap, Escape key, backdrop dismiss, scroll lock
- [x] `components/ui/Toast.jsx` — 4 types, auto-dismiss, aria-live, max 5 stack

#### Context
- [x] `context/AuthContext.jsx` — useReducer, Phase 2 API stubs, never trusts client-side XP
- [x] `context/ThemeContext.jsx` — light/dark toggle, localStorage persistence, data-theme on html

#### Server (`server/`)
- [x] `server/package.json` — ESM (`"type":"module"`), `node --watch` dev script
- [x] `server/src/index.js` — Express 5, CORS, Morgan, express-rate-limit, 404 handler, global error handler
- [x] `GET /api/v1/health` — returns `{ status: "ok", service, version, environment, timestamp, uptime }`
- [x] `server/.env.example` — documents PORT, NODE_ENV, ALLOWED_ORIGINS, and Phase 2-4 vars
- [x] `server/.gitignore`
- [x] `server/src/config/`, `controllers/`, `middleware/`, `models/`, `routes/`, `utils/` — directories created

#### Dependencies Installed
**Client:**
- react, react-dom, react-router-dom, lucide-react (all prod)
- @tanstack/react-query, axios, react-hook-form, zod, @hookform/resolvers (prod)
- vite, @vitejs/plugin-react, oxlint (dev)

**Server:**
- express, cors, morgan, dotenv, express-rate-limit (saved to package.json)

---

## Work Not Started

| Item | Phase |
|---|---|
| MongoDB Atlas connection | Phase 2 |
| Mongoose models (User, Action, Report, Badge, WellReading) | Phase 2 |
| JWT auth (register, login, logout, /me) | Phase 2 |
| Action logging + XP award (server-side) | Phase 3 |
| Leaderboard API + real data | Phase 3 |
| Badge auto-unlock system | Phase 3 |
| Leaflet map (react-leaflet + OSM) | Phase 4 |
| Geo-tagged issue submission | Phase 4 |
| Cloudinary image upload | Phase 4 |
| Open dataset integration (India-WRIS) | Phase 5 |
| Impact dashboard aggregation | Phase 5 |
| Vitest + React Testing Library | Phase 6 |
| Supertest API tests | Phase 6 |
| Vercel + Render deployment | Phase 6 |
| GitHub Actions CI | Phase 6 |

---

## Known Errors / Risks

| Risk | Status | Mitigation |
|---|---|---|
| `C:\Users\HP\.git` home-level repo | ✅ Isolated | Project git at canonical root, verified |
| Google Fonts external dependency | Accepted | Preconnect in index.html, no impact on build |
| Cloudinary free account needed | ⬜ Pending Phase 4 | Will flag before Phase 4 begins |
| Game economy values not approved | ⬜ Pending Phase 3 | XPBar uses placeholder formula clearly commented |
| `node --watch` may not exist on Node < 18 | ✅ Safe | Node 24 confirmed |
| Dark mode CSS overrides require `[data-theme="dark"]` | Implemented | ThemeContext sets attribute on html |

---

## Next Approved Action

**Awaiting explicit user approval for Phase 2.**

Phase 2 scope: Express + MongoDB backend with auth routes.
- Install: mongoose, bcryptjs, jsonwebtoken, zod, multer
- Implement: User model, /auth/register, /auth/login, /auth/logout, /auth/me
- Connect: MongoDB Atlas M0 via MONGODB_URI env var
- Add: JWT middleware, httpOnly cookie strategy

Do NOT begin Phase 2 without user sign-off.

---

## What Did Not Work or Remains Uncertain?

1. **`node --watch`** — Used for server hot-reload. Available on Node 18+. Confirmed safe on Node 24. If deploying to an older host, replace with `nodemon`.

2. **Google Fonts availability** — The three fonts (Outfit, Inter, JetBrains Mono) are loaded externally. In offline dev environments, the system fallback fonts will be used silently. This is acceptable and documented.

3. **Root `package.json` `dev` script on Windows** — The `&` operator for parallel processes does not work in PowerShell. Users on Windows should run client and server in separate terminals using `npm run dev:client` and `npm run dev:server`, or install `concurrently`. This is documented here.

4. **Game economy values** — XPBar uses a placeholder formula (`level = floor((xp/100)^0.75) + 1`). This is explicitly pending approval (PLAN.md §6.5). The comment in XPBar.jsx flags this.

5. **`react-leaflet` and `leaflet` not yet installed** — Deferred to Phase 4 to avoid unnecessary weight and configuration without the actual map page being live.

6. **Dark mode on system preference** — Currently ThemeContext reads localStorage only. An `@media (prefers-color-scheme: dark)` initial sync is not implemented. Will be added in Phase 3 polish.

7. **`client/src/assets/hero.png`** — Vite scaffold created a placeholder. Replaced favicon.svg but hero image is not yet needed. Not a blocker.
