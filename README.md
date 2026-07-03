# Leo Tennis Academy — Web App

Website + staff console for **Leo Tennis Academy, Hyderabad**
([@leotennishyd](https://www.instagram.com/leotennishyd/)) — a tennis
academy offering coaching programs and floodlit courts bookable by the hour.

Repo: https://github.com/sujittarun/LeoTennisAcademyapp

## Stack
Vanilla HTML/CSS/JS, no build step — deploys straight to GitHub Pages.
Liquid-glass design system: dark-first forest green + metallic gold (from the Leo
"LA" monogram) with a tennis optic-yellow accent, light theme included.

## Pages
| Page | Purpose |
|---|---|
| `index.html` | Public site — hero, programs, courts & rates, fees, contact |
| `booking.html` | Court booking — pick a date, select one-hour slots, instant quote, request |
| `admission.html` | Coaching membership application (3-step wizard, trial session) |
| `login.html` | Staff console login |
| `dashboard.html` | KPIs, revenue chart, renewal donut, activity feed |
| `players.html` | Members roster with search + program filter |
| `bookings.html` | 9 court photo cards (5 tennis + 4 pickleball) with animated timelines, channel split, manual add-booking |
| `attendance.html` | Tap-to-mark attendance — members and staff/coaches |
| `fees.html` | Finance — membership & court revenue, ledger, record payment |

## Data layer
`assets/js/core.js` exposes `LT.store` (localStorage) as the single persistence
seam; `assets/js/data.js` (`window.LT_DATA`) provides seed records for members,
bookings, payments and revenue until the production API is wired in. Booking
requests, applications and payments recorded in the app persist
locally and merge with the seeds — replace those two files to go live against a
real backend without touching page controllers.

## Business rules
- Programs: Foundations, Performance, Cardio Tennis, Private (no kids batches or parent fields).
- Real venue: Opp. Lingampally MMTS Station, Serilingampally, Hyderabad ·
  +91 96768 29060 / +91 72081 95649 · court photos in assets/img/courts/
  (sourced from the academy's Google Business listing).
- Courts rent in one-hour slots, 6:00–23:00 (open daily 6 AM – 11 PM). Tennis ₹500/₹700 peak,
  pickleball ₹400/₹600 peak (peak from 4 PM). Public requests start `pending`; staff confirm and the
  app assigns the first free court for that hour.
- Membership plans: Monthly ₹4,500 · Quarterly ₹12,825 · Half-yearly ₹24,300;
  joining fee ₹1,000.

## Run locally
```bash
npx http-server -p 8123 -c-1 .
# open http://localhost:8123
```

## Deploy
Push to `main` and enable GitHub Pages (Settings → Pages → Deploy from branch →
`main` / root). When changing CSS/JS, bump the `?v=N` query in all HTML files.
