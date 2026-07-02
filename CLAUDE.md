# Leo Tennis Academy — Glass Web App

Multi-page vanilla web app (no build step) for Leo Tennis Academy Hyderabad
(Instagram @leotennishyd). Repo: https://github.com/sujittarun/LeoTennisAcademyapp
Sibling project: `/Users/jiths/Documents/New project/genalpha-glass-web` (cricket, light-first).

## Product rules (IMPORTANT — do not regress)
- ADULTS ONLY. No kids programs, no parent/guardian fields, no age-group batches.
  People are "members" (never "students"/"kids"; "player" only in natural tennis
  phrasing like "league player").
- Two revenue lines: coaching memberships AND hourly court booking (6 courts,
  one-hour slots 06:00–22:00, ₹500 off-peak / ₹700 peak from 4 PM).
- Court booking flow: public requests a date + hour slots (instant quote) →
  status `pending` → staff confirms in bookings.html, which auto-assigns the
  first free court for that hour (override stored under `lt-booking-status`).
- Do NOT present the app as a "demo" anywhere in the UI (no "demo build",
  "sample data", "any credentials work" copy). It must read like production;
  the seeded records are just unlaunched data.

## Architecture
- `assets/css/glass.css` — entire design system. DARK-FIRST liquid glass with
  `[data-theme="light"]` overrides. Brand: forest green (#0b2a1b) + metallic gold
  (#c9a24b) from the "LA" monogram + optic yellow (#d7ef4f) accent.
  KEY RECIPE: glass = low-opacity white fill (7–10% dark / 26–32% light) +
  `backdrop-filter: blur(22px) saturate(1.25)` + 1px white border + inset rim
  light, over a VIVID animated background (.lt-bg). Never make glass milky.
- `assets/js/core.js` — `window.LT`: logo SVG, theme manager (localStorage
  `lt-theme`, default dark), toast, `LT.store` (localStorage persistence seam),
  local auth session, staff nav shell (Dashboard/Members/Bookings/Attendance/
  Finance), count-up, scroll reveal, glass-hover cursor tracking.
- `assets/js/data.js` — `window.LT_DATA` (programs, plans, members, bookings,
  payments, revenue, activity; dates generated relative to today) and
  `window.LT_SLOTS` (hour list, rate + label helpers). Seed data until the
  production API lands; app-recorded records merge from LT.store.

## Pages
Public: index.html · booking.html (slot quote + request) · admission.html
(membership wizard — no parent fields) · login.html.
Staff (behind LT.auth.require): dashboard.html · players.html (Members roster) ·
bookings.html · attendance.html · fees.html (Finance).

## Conventions
- Prefix classes/keys `lt-`. Only use tokens from glass.css, never hardcoded colors.
- Both themes must stay consistent; test dark (default) and light.
- Staff pages get nav via `LT.managerShell(activeHref)`; public pages have inline nav.
- Bump `?v=N` on css/js references in ALL html files when changing assets.
- Deploy = push to main (GitHub Pages; repo must be public to enable Pages).
- To productionise: replace LT.store/LT_DATA with Supabase (see the cricket
  app's CLAUDE.md for the schema pattern).
