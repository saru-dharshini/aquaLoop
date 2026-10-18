# AquaLoop — Persistent Project Rules

These rules are automatically injected into every Antigravity conversation in this workspace.
They encode approved decisions that must not be overridden without explicit user approval.

---

## 1. Canonical Project Root

```
C:\Users\HP\OneDrive\Desktop\aquaLoop\
```

- All source code, configuration, documentation, and Git operations live here.
- NEVER read from or write to `C:\Users\HP\AquaLoop\` (old scaffold — not used).
- NEVER run git commands against `C:\Users\HP\.git` (home-level repo — not used).
- Always verify `git rev-parse --show-toplevel` before any git operation.

---

## 2. ₹0 Cost Constraint

- No mandatory paid services, no billing-required APIs, no credit-card-gated features.
- Permitted free tiers: MongoDB Atlas M0, Cloudinary Free, Vercel Free, Render Free, OpenStreetMap.
- Do NOT add dependencies that require paid licenses or API keys to function locally.
- If a free-tier account is needed (e.g. Cloudinary), flag it explicitly. Never silently assume the user has one.

---

## 3. Technology Stack — Approved and Fixed

### Frontend (`client/`)
- Build tool: **Vite 8** (JavaScript, not TypeScript)
- UI: **React 19**
- Routing: **React Router v7**
- Server state: **TanStack Query v5** (when wiring API calls — Phase 3+)
- Forms: **React Hook Form + Zod** (Phase 3+)
- Charts: **Recharts** (Phase 5)
- Maps: **Leaflet + react-leaflet** with OSM tiles (Phase 4)
- Icons: **Lucide React** (MIT, tree-shakeable)
- Styling: **Vanilla CSS custom properties only** — no Tailwind, no CSS-in-JS
- HTTP: **Axios** (Phase 3+)
- Animations: CSS transitions and `@keyframes` only — no Framer Motion unless explicitly approved

### Backend (`server/`)
- Runtime: **Node.js 24**, ESM modules (`"type": "module"`)
- Framework: **Express 5**
- Database: **MongoDB Atlas M0** via Mongoose 8
- Auth: **JWT in httpOnly cookie** — NEVER store JWT in localStorage or sessionStorage
- Upload: Multer + Cloudinary Free
- Validation: Zod (shared schema pattern with frontend)
- Logging: Morgan
- Rate limiting: express-rate-limit

### Never use:
- TypeScript (unless explicitly approved in a future phase)
- Tailwind CSS or any utility-class CSS framework
- Redux or Zustand (React Context + useReducer only)
- Framer Motion (unless explicitly approved)
- Any paid map tile provider

---

## 4. Design System — "Living Water" Theme

### Philosophy
**Light-first, polished, environmental-adventure-game aesthetic.**
- Clean, nature-inspired solid surfaces. NOT glassmorphism.
- No `backdrop-filter: blur()` as a primary design element.
- No full-page gradient mesh backgrounds as the main surface.
- No oversized decorative hero sections unrelated to content.
- Think: illustrated field-guide meets a modern civic app.

### Approved Color Tokens (CSS custom properties)
```css
/* Water blues — primary interactive */
--color-primary-50:  #e0f7fa;
--color-primary-100: #b2ebf2;
--color-primary-400: #26c6da;
--color-primary-600: #0097a7;   /* main CTA color */
--color-primary-800: #00626b;

/* Deep navy — headings, strong contrast */
--color-navy-900: #0d2137;
--color-navy-700: #163552;

/* Leaf greens — selective accent */
--color-green-100: #dcedc8;
--color-green-500: #66bb6a;
--color-green-700: #388e3c;

/* Reward gold */
--color-gold-400: #ffca28;
--color-gold-600: #f9a825;

/* Neutral */
--color-neutral-50:  #fafafa;
--color-neutral-100: #f5f5f5;
--color-neutral-300: #e0e0e0;
--color-neutral-500: #9e9e9e;
--color-neutral-700: #616161;
--color-neutral-900: #212121;

/* Semantic */
--color-danger:  #e53935;
--color-warning: #fb8c00;
--color-success: #43a047;
--color-info:    #1e88e5;

/* Light mode surfaces */
--surface-base:    #ffffff;
--surface-raised:  #f5f9fb;
--surface-overlay: #eef4f7;
--surface-border:  #dde8ed;
```

### Approved Typography
- Heading font: **Outfit** (Google Fonts, variable weight 100–900)
- Body font: **Inter** (Google Fonts, variable weight 100–900)
- Mono font: **JetBrains Mono** (code/data only)
- Loading strategy: `<link rel="preconnect">` + `<link rel="stylesheet">` in `index.html`
- These are **externally loaded** from fonts.google.com — document this wherever fonts are configured.

### Approved Radii
- Small UI elements: **6 px**
- Cards, inputs: **10 px**
- Modals, large panels: **14 px**
- Pills/tags: **9999 px**

### Approved Spacing Scale (4 px base)
4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128 px

### Motion
- Easing: `cubic-bezier(0.4, 0, 0.2, 1)`
- Durations: 100 ms · 200 ms · 300 ms · 500 ms
- ALL animated elements MUST have `@media (prefers-reduced-motion: reduce)` guards.

### Accessibility
- Visible keyboard focus on all interactive elements (`:focus-visible` ring, never `:focus` only).
- WCAG AA contrast ratio minimum for all text/background combinations.
- Semantic HTML: use `<nav>`, `<main>`, `<header>`, `<footer>`, `<section>`, `<article>` appropriately.
- All icons used decoratively: `aria-hidden="true"`. All functional icons: `aria-label` on parent.

---

## 5. Phase Gate

**Currently approved phase: Phase 1 — Foundation**

Do NOT implement features from Phase 2 or later without explicit user approval:
- ❌ Authentication, JWT, cookies
- ❌ MongoDB models or database integration
- ❌ XP, badges, streaks, leaderboards
- ❌ Issue reporting or image upload
- ❌ Full dashboards or data charts

Before starting any new phase, read PROGRESS.md and confirm the previous phase's acceptance criteria are met.

---

## 6. Impact Integrity Rules

- NEVER invent or hard-code water-saving measurements, pollution statistics, or environmental data.
- Any figure shown on the UI that is user-reported must carry a visible **"Self-reported"** label.
- Any figure sourced from sample/seed data must carry a visible **"Sample data"** tag.
- All claims about environmental impact must trace back to a cited open dataset or clearly marked user input.

---

## 7. Server-Authority Rule

- XP awards, badge unlocks, level computation, and role checks happen **exclusively on the server**.
- The client displays server-returned values. It NEVER computes XP or checks badge conditions.
- The client NEVER sends XP values or role claims to the server — the server derives them.

---

## 8. Secrets and Credentials

- NEVER commit `.env` files.
- NEVER hard-code API keys, database URIs, JWT secrets, or service credentials.
- Every secret has a corresponding entry in `.env.example` with a placeholder and description.
- `.gitignore` must exclude: `node_modules/`, `.env`, `.env.local`, `dist/`, `build/`, `logs/`, `uploads/`.

---

## 9. Uncertainty and Honesty

- If a requirement is ambiguous, STOP and ask rather than assume.
- If a dependency may introduce a cost, flag it explicitly before installing.
- Report every error, failed command, and unresolved issue in PROGRESS.md under "What did not work or remains uncertain?"
- Do not silently skip steps or mark incomplete items as complete.

---

## 10. Open Decisions (as of Phase 1)

These are still pending user approval and MUST NOT be implemented until approved:

| # | Decision | Awaiting |
|---|---|---|
| 1 | Game economy values (XP per action, multipliers, level curve) | Phase 3 sign-off |
| 2 | Cloudinary free account acknowledgement | Phase 4 sign-off |
| 3 | Demo / deployment deadline | User input |
