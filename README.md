# Leo Tennis Academy — Liquid Glass Web App (demo)

Showcase demo for **Leo Tennis Academy, Hyderabad** ([@leotennishyd](https://www.instagram.com/leotennishyd/)) —
a premium liquid-glass website + academy manager console, built to present as a sales demo.

Repo: https://github.com/sujittarun/LeoTennisAcademyapp

## Stack
Vanilla HTML/CSS/JS, no build step — deployable straight to GitHub Pages.
Sibling of the Gen Alpha Cricket Academy app (`genalpha-glass-web`), re-themed for tennis:
dark-first forest green + metallic gold (from the Leo "LA" monogram) with a tennis
optic-yellow accent.

## Pages
| Page | Purpose |
|---|---|
| `index.html` | Public landing — hero, programs, coaches, fees, testimonials, CTA |
| `admission.html` | 3-step free-trial booking wizard (saves locally in demo mode) |
| `login.html` | Manager console login (demo: any credentials work) |
| `dashboard.html` | KPIs, revenue chart, collection donut, activity feed |
| `players.html` | Roster with search + batch filter |
| `attendance.html` | Tap-to-mark attendance (persists per date in localStorage) |
| `fees.html` | Payments ledger + record-payment modal |

## Demo mode
There is **no backend** — `assets/js/demo-data.js` holds sample data and all writes go
to `localStorage` (`assets/js/core.js → LT.store`). To productionise, replace `LT.store`
and the demo dataset with real API/Supabase calls (the cricket app shows the pattern).

## Run locally
```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy
Push to `main` and enable GitHub Pages (Settings → Pages → Deploy from branch → `main` / root).
When changing CSS/JS, bump the `?v=N` query string in all HTML files to bust caches.
