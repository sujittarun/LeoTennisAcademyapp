-- ============================================================
-- GO-LIVE RESET — run once when Leo Academy launches for real.
-- Removes demo/seed records from the platform DB so the client
-- starts from zero honest numbers.
-- ALSO REQUIRED at launch (code side):
--   · empty the seed arrays in assets/js/data.js (members, bookings,
--     payments, finance, activity) and delete the backfill IIFE
--   · run supabase/lockdown.sql if not already applied
-- ============================================================

-- generated 30-day demo booking history + fixed demo seeds
delete from bookings where id like 'B-H%';

-- demo-period telemetry (keep if you want the pre-launch usage history)
-- delete from events where at < now();

-- verify what remains
select 'bookings' as tbl, count(*) from bookings
union all select 'payments', count(*) from payments
union all select 'members', count(*) from members
union all select 'applications', count(*) from applications;

-- demo roster + demo reminder log seeded for tier/cost display (migration 9)
delete from members where tenant_id = 'leo';
delete from reminders_log where tenant_id = 'leo';

-- demo court-booker contacts seeded for the CRM panel (migration 10)
delete from bookings where id like 'B-CRM%';

-- demo data seeded for booker/finance/partner features (migrations 13-14)
delete from payments where ref like 'P-SEED%';
delete from bookings where ext_ref is not null;
update integrations set last_sync_at = null, last_result = null;

-- CourtSync demo standalone account + job queue (migration 16)
delete from bookings where tenant_id = 'demo-courts';
delete from sync_jobs;
delete from integrations where tenant_id = 'demo-courts';
delete from tenants where id = 'demo-courts';

-- demo partner secrets (migration 17) — remove Vault entries + references
delete from vault.secrets where name like 'partner:%';
update integrations set config = config - 'secret_id';
