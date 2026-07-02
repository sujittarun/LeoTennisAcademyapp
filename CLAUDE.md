# Leo Tennis Academy — Glass Web Demo

Multi-page vanilla web app (no build step), sales demo for Leo Tennis Academy Hyderabad
(Instagram @leotennishyd). Repo: https://github.com/sujittarun/LeoTennisAcademyapp
Sibling project: `/Users/jiths/Documents/New project/genalpha-glass-web` (cricket, light-first).

## Architecture
- `assets/css/glass.css` — entire design system. DARK-FIRST liquid glass with
  `[data-theme="light"]` overrides. Brand: forest green (#0b2a1b bg) + metallic gold
  (#c9a24b) from the "LA" monogram + tennis optic yellow (#d7ef4f) accent.
  KEY RECIPE: glass = low-opacity white fill (7–10% dark / 26–32% light) +
  `backdrop-filter: blur(22px) saturate(1.25)` + 1px white border + inset rim light,
  over a VIVID saturated animated background (.lt-bg). Never make glass milky/opaque.
- `assets/js/core.js` — `window.LT`: logo SVG builder, theme manager (localStorage
  `lt-theme`, default dark), toast, demo store (localStorage `lt-*`), demo auth
  (any credentials), manager nav shell (Dashboard/Players/Attendance/Fees), count-up,
  scroll reveal, glass-hover cursor tracking.
- `assets/js/demo-data.js` — `window.LT_DEMO`: batches, plans, players, payments,
  revenue series, activity feed. ALL DATA IS FAKE — this is a demo, no backend.

## Business context
This is a PRE-SALES DEMO to win the academy as a customer. Priorities: looks premium,
simple to extend, works on mobile. When they subscribe: swap LT.store/LT_DEMO for
Supabase (see cricket app's CLAUDE.md for the schema pattern).

## Conventions
- Prefix classes/keys `lt-`. Only use tokens from glass.css, never hardcoded colors.
- Both themes must stay consistent; test dark (default) and light.
- Pages share nav via `LT.managerShell(activeHref)` for the console; public pages
  have inline nav markup.
- Bump `?v=N` on css/js references in ALL html files when changing assets.
- Deploy = push to main (GitHub Pages).
