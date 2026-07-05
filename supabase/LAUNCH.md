# Launch day — checklist + what to get from the client

Everything to take Leo Academy (or any tenant) from demo to a real, paying-client
launch. Two parts: **(A) collect from the client first**, then **(B) the go-live
steps** in order. Budget ~1–2 hours once you have everything in Part A.

---

## A. Collect from the client (send them this list)

### Business & branding
- [ ] Legal business name + display name (currently "Leo Academy" — keep short name)
- [ ] Logo (SVG/PNG) — replaces `assets/img/` marks if different
- [ ] Front-desk **phone**, full **address**, **Instagram** handle
- [ ] Operating hours (currently 6 AM–11 PM)

### Money (most important)
- [ ] **Real UPI IDs** — 2–3 for rotation (spreads collections across accounts)
- [ ] **Payee name** as it should appear in UPI apps
- [ ] **Plan prices**: Monthly / Quarterly / Half-yearly amounts (₹)
- [ ] **Court rates**: confirm tennis ₹500 off-peak / ₹700 peak, pickleball ₹400 / ₹600, peak start (4 PM)
- [ ] GST/registration details if invoices are needed (future)

### Programs & courts
- [ ] Real **program names** + fees (currently Foundations / Performance / Cardio Tennis / Private Coaching)
- [ ] Confirm **9 courts** — 5 tennis (T1–T5), 4 pickleball (P1–P4), and each court's label/notes

### People
- [ ] **Staff logins** — real email addresses for each staff/manager who signs in
- [ ] **Coach/staff roster** (names, roles) for attendance
- [ ] **WhatsApp business number** the academy sends reminders from (staff device is fine to start)

### Starting data
- [ ] **Initial member list** — name, phone, program, join date, current validity (CSV is ideal), or start empty and add via the app
- [ ] Any existing bookings to pre-load (usually skip — start clean)

### Channels (only if doing partner sync now — otherwise skip)
- [ ] Which marketplaces they're on (Playo / Hudle / District)
- [ ] Whether each offers an **API key**, or you'll use the **venue's own login** (assisted sign-in), or stay **manual**
- [ ] The credentials for whichever method — **with the client's explicit consent** for assisted login (ToS/ban risk)

### Hosting
- [ ] Custom **domain** if they want one (else it stays on `github.io`)

---

## B. Go-live steps (in order)

### 1. Supabase Pro + backups (see RUNBOOK.md §1–2)
- [ ] Upgrade project to **Pro**, enable **PITR** (7-day), confirm daily backups
- [ ] Set repo secrets `SUPABASE_DB_URL` + `BACKUP_PASSPHRASE`; run the backup workflow once manually

### 2. Wipe demo data
- [ ] Run **`supabase/launch-reset.sql`** (clears seed bookings/members/payments, demo partner data, `demo-courts`, Vault demo secrets)
- [ ] In **`assets/js/data.js`**: empty the seed arrays (`members`, `bookings`, `payments`, `finance`, `activity`) and delete the `backfill()` IIFE so the app shows real numbers only
- [ ] Confirm `supabase/lockdown.sql` is applied (RLS strict) — it is, from 2026-07-04

### 3. Plug in the client's real values (`assets/js/data.js`)
- [ ] `billing.upiIds` → their real UPI IDs; `billing.payee` → payee name; `billing.upiWindowDays` → rotation window
- [ ] `plans` → real Monthly/Quarterly/Half-yearly amounts
- [ ] `programs` → real program names/ids/fees
- [ ] `contact` → real address / phone / instagram
- [ ] `staff` → real coach/ops roster
- [ ] `sports`/`rates` → confirm court rates + peak hour

### 4. Real logins (replace the dummy auth users)
- [ ] Create real Supabase Auth users for each staff email, with `app_metadata` `am_role: staff` (or `operator` for you) + `tenant_id: leo`, and strong passwords
- [ ] Remove the dummy `staff@leoacademy.in` / `operator@academymanager.in` (and `~/.supabase/am-dummy-logins.txt`)
- [ ] **Strip the prefilled credentials** from `login.html` (the `value="..."` on email/password) and the Academy Manager + CourtSync gate inputs

### 5. Seed real members
- [ ] Add the client's members via **Members → + Add member**, or bulk-insert into the `members` table (tenant_id `leo`)

### 6. Channels (only if Part A creds provided)
- [ ] Bookings → **Connect channels** → set each channel's method + credentials
- [ ] The pg_cron `drain-sync-jobs` already runs; deploy the real `partner-push` Edge Function only when a partner API is live
- [ ] Otherwise leave channels manual — staff record partner bookings by hand

### 7. Cache-bust + deploy
- [ ] Bump `?v=N` on css/js in **all** html files (and `APP_VER` in `cloud.js`)
- [ ] Push to `main` (GitHub Pages), confirm the build is green
- [ ] If custom domain: set it in repo Settings → Pages

---

## C. Smoke test (as a real staff user, on a phone)
- [ ] Sign in with a real staff login (dummy creds rejected)
- [ ] Add a member → appears in roster + reminders
- [ ] Record a court booking → shows on Bookings; confirm a pending one
- [ ] Send a renewal reminder → WhatsApp opens with the real UPI in the message
- [ ] Record a payment → shows in Finance ledger
- [ ] Mark attendance → persists
- [ ] Cancel a booking → frees the slot; check the reason sheet copy
- [ ] Dark + light theme both look right

## D. Post-launch monitoring (yours, ongoing)
- [ ] **Academy Manager** console — MRR/GMV/health per account; the **sync-health banner** flags drift/stuck jobs
- [ ] `select jobname,schedule,active from cron.job;` — auto-sync + reconcile running
- [ ] Backups landing (GitHub Actions → Nightly encrypted DB backup)
- [ ] `select props->>'msg' from events where name='client_error' order by at desc` — tenant JS errors
