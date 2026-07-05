# Academy Manager — operations runbook

Pre-launch resilience checklist and ops procedures for the shared Supabase
project (`ugsklcipzyiogxynshnh`, "Leo Academy"). Do the **before first paying
client** items before onboarding anyone.

---

## 1. Upgrade to Supabase Pro  — before first paying client (needs a card)

Free tier has no point-in-time recovery and pauses after 7 idle days. Neither is
acceptable once a client depends on the data.

1. Dashboard → Project → Settings → **Billing** → upgrade to **Pro** (~$25/mo).
2. Settings → Database → **Point-in-Time Recovery** → enable (7-day window).
3. Confirm **Daily backups** are on (Pro default).
4. Result: rewind-to-any-second for 7 days + daily snapshots + no auto-pause.

PITR is your *primary* recovery. The GitHub backup (below) is the independent
*second* copy in case the whole project is lost.

---

## 2. Independent nightly backup  — `.github/workflows/backup.yml`

An encrypted `pg_dump` uploaded to GitHub (off Supabase), so "project deleted"
≠ "data gone". Set two repo secrets (Settings → Secrets and variables → Actions):

| Secret | Value |
| --- | --- |
| `SUPABASE_DB_URL` | `postgresql://postgres:<DB-PASSWORD>@db.ugsklcipzyiogxynshnh.supabase.co:5432/postgres` |
| `BACKUP_PASSPHRASE` | a long random string you store in your password manager |

- DB password: Dashboard → Settings → Database → reset/copy the password.
- The dump is GPG-encrypted (AES256) before upload → safe even in a public repo.
- Runs 02:00 IST daily; trigger manually via Actions → *Nightly encrypted DB backup* → Run.

### Restore from a GitHub backup
```bash
# download the artifact, then:
gpg -d leo-academy-YYYYMMDD-HHMM.dump.gpg > db.dump   # prompts for BACKUP_PASSPHRASE
pg_restore --no-owner --no-privileges -d "$SUPABASE_DB_URL" db.dump
```

---

## 3. Migration discipline  — never migrate blind

Bad migrations are the #1 self-inflicted outage. Every schema change:

1. **Back up first:** `scripts/migrate.sh <file.sql>` snapshots the schema before applying.
2. **Test on a branch DB** (Pro): Dashboard → Branches → create a branch, apply there, verify, then apply to prod. (Free tier: apply to a throwaway project first.)
3. **Transactional DDL:** wrap changes in `begin; … commit;` so a failure rolls back clean.
4. **Record it:** every migration lands in `supabase/schema.sql` with a `-- migration N` header (running record).
5. **RLS changes get a matrix test** — re-run the anon/staff/operator read+write checks before trusting a policy change.

---

## 4. Alerting  — `supabase/functions/reconcile`

Nightly (and hourly) reconcile + health check that **pages you** when drift,
dead-letters, a stalled queue, or stale channels cross a threshold.

1. `supabase functions deploy reconcile`
2. Set secret: `supabase secrets set ALERT_WEBHOOK_URL=<slack-or-discord-incoming-webhook>`
3. Schedule in the dashboard: `0 * * * *` (hourly) and `30 20 * * *` (full-day reconcile).
4. Signals it watches: `reconcile_report()` (propagation gaps) + `platform_health()`
   (queued/dead jobs + age, stale channels). Same data the operator banner shows.

Until deployed, the operator sees the passive amber/red banner atop the Academy
Manager console — but nothing is pushed to you. Deploy this to get pushed alerts.

---

## Quick reference — health from the CLI
```bash
# operator RPCs (run via the Management API with the PAT, or psql as service role)
select platform_health();              -- queued/dead jobs, stale channels
select reconcile_report(current_date); -- propagation gaps for today
```
