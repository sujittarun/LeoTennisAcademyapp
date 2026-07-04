# Leo Tennis Academy — Glass Web App

Multi-page vanilla web app (no build step) for Leo Tennis Academy Hyderabad
(Instagram @leotennishyd). Repo: https://github.com/sujittarun/LeoTennisAcademyapp
Sibling project: `/Users/jiths/Documents/New project/genalpha-glass-web` (cricket, light-first).

## Product rules (IMPORTANT — do not regress)
- UI brand name is "Leo Academy" (user's choice); the real business is Leo
  Tennis Academy (@leotennishyd) — keep the short name in all UI copy/titles.
- ADULTS ONLY as a business rule, but NEVER write the word "adult" in UI copy
  (user removed it deliberately). No kids programs, no parent/guardian fields,
  no age-group batches. People are "members" (never "students"/"kids"; "player"
  only in natural tennis phrasing like "league player").
- Landing page must keep the coaches ("The Team") and member-quotes sections,
  and the ball-wave page-load animation (assets/video/hero2.mp4 + inline
  script in index.html; page rides the wave, JS-driven from video.currentTime,
  never CSS keyframes; debug with ?bwlslow=0.25).
- Two revenue lines: coaching memberships AND hourly court booking.
  9 courts: 5 tennis (T1–T5, ₹500/₹700 peak) + 4 pickleball (P1–P4,
  ₹400/₹600 peak); one-hour slots 06:00–23:00, peak from 4 PM. Court ids
  are strings ("T1"…"P4"); LT_SLOTS.courtId() maps legacy numeric ids.
- Court booking flow: public picks sport + date + hour slots (instant quote,
  slots show "Full" when every court of that sport is taken — bookings from
  ANY channel block availability) → status `pending` → staff confirms in
  bookings.html, which auto-assigns the first free court of that sport
  (override stored under `lt-booking-status`). Staff add Playo/Hudle/walk-in
  bookings manually until marketplace APIs are integrated.
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
  local auth session, staff nav shell (Dashboard/Members/Bookings/Finance), count-up, scroll reveal, glass-hover cursor tracking.
- `assets/js/data.js` — `window.LT_DATA` (programs, plans, members, bookings,
  payments, revenue, activity; dates generated relative to today) and
  `window.LT_SLOTS` (hour list, rate + label helpers). Seed data until the
  production API lands; app-recorded records merge from LT.store.

## Pages
Public: index.html · booking.html (slot quote + request) · admission.html
(membership wizard — no parent fields) · login.html.
Staff (behind LT.auth.require): dashboard.html · players.html (Members roster) ·
bookings.html (graphical court cards + schedule modal, sport filter, channels
split, manual add-booking) · attendance.html (members AND staff/coach modes) ·
fees.html (Finance). LT_DATA.staff holds the coach/ops roster.

## Conventions
- PRIMARY TARGET: iPhone Safari — most users are on mobile. Design and verify
  the ≤699px layout FIRST (375×812; mind safe-area insets, -webkit- prefixes,
  viewport-height quirks), then desktop. Never ship a change checked only on
  desktop widths.
- Prefix classes/keys `lt-`. Only use tokens from glass.css, never hardcoded colors.
- Both themes must stay consistent; test dark (default) and light.
- Mobile breakpoint is 699px (not 767) so fold-phone inner screens (~717px)
  get the desktop chrome; dates use LOCAL time, never toISOString (IST).
- Staff pages get nav via `LT.managerShell(activeHref)`; public pages have inline nav.
- Bump `?v=N` on css/js references in ALL html files when changing assets.
- Deploy = push to main (GitHub Pages; repo must be public to enable Pages).
- To productionise: replace LT.store/LT_DATA with Supabase (see the cricket
  app's CLAUDE.md for the schema pattern).
