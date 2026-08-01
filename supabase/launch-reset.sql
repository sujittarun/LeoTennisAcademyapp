-- ============================================================
-- GO-LIVE RESET — run once when Leo Academy launches for real.
-- Removes Leo's demo/seed records so the client starts from zero
-- honest numbers.
--
-- EVERY STATEMENT IS SCOPED TO tenant_id = 'leo'. That is not decoration.
-- This database is shared by six academies and ids are GLOBAL: before
-- 2026-08-01 this file carried
--
--     delete from bookings where ext_ref is not null;   -- every academy's
--     delete from sync_jobs;                            -- channel bookings,
--     delete from vault.secrets where name like 'partner:%';  -- queue and
--     update integrations set last_sync_at = null;      -- credentials
--
-- Four statements, no tenant filter, sitting in a repo that is handed to
-- clients. Running it would have wiped every tenant's partner-synced
-- bookings, drained the shared sync queue, and deleted Playo/Hudle
-- credentials for all six academies.
--
-- If you add a statement here, it MUST carry `tenant_id = 'leo'` (or the
-- vault name prefix 'partner:leo:'). The guard at the bottom fails the
-- script if anything outside Leo was touched.
--
-- ALSO REQUIRED at launch (code side):
--   · empty the seed arrays in assets/js/data.js (members, bookings,
--     payments, expenses, finance, activity) and delete the backfill IIFE
--   · run supabase/lockdown.sql if not already applied
-- ============================================================

-- Snapshot other tenants' row counts BEFORE, so the guard can prove
-- nothing outside Leo moved.
create temporary table _preflight as
select
  (select count(*) from bookings     where tenant_id <> 'leo') as bookings_other,
  (select count(*) from payments     where tenant_id <> 'leo') as payments_other,
  (select count(*) from members      where tenant_id <> 'leo') as members_other,
  (select count(*) from expenses     where tenant_id <> 'leo') as expenses_other,
  (select count(*) from sync_jobs    where tenant_id <> 'leo') as syncjobs_other,
  (select count(*) from integrations where tenant_id <> 'leo') as integrations_other,
  (select count(*) from vault.secrets where name not like 'partner:leo:%') as secrets_other;

-- generated 30-day demo booking history + fixed demo seeds
delete from bookings where tenant_id = 'leo' and id like 'B-H%';

-- seeded operating expenses (Finance → Expenses demo rows)
delete from expenses where tenant_id = 'leo' and ref like 'E-SEED%';

-- demo-period telemetry (keep if you want the pre-launch usage history)
-- delete from events where tenant_id = 'leo' and at < now();

-- demo roster + demo reminder log seeded for tier/cost display (migration 9)
delete from members      where tenant_id = 'leo';
delete from reminders_log where tenant_id = 'leo';

-- demo court-booker contacts seeded for the CRM panel (migration 10)
delete from bookings where tenant_id = 'leo' and id like 'B-CRM%';

-- demo data seeded for booker/finance/partner features (migrations 13-14)
delete from payments where tenant_id = 'leo' and ref like 'P-SEED%';
delete from bookings where tenant_id = 'leo' and ext_ref is not null;
delete from sync_jobs  where tenant_id = 'leo';
update integrations set last_sync_at = null, last_result = null
 where tenant_id = 'leo';

-- demo partner secrets (migration 17) — Leo's Vault entries only.
-- Secrets are named 'partner:<tenant>:<channel>'.
delete from vault.secrets where name like 'partner:leo:%';
update integrations set config = config - 'secret_id' where tenant_id = 'leo';

-- NOTE: the CourtSync demo account ('demo-courts') is NOT handled here.
-- It was retired platform-side in AcademyManager migration 0012; a Leo
-- file must never delete another tenant's rows, demo or not.

-- ------------------------------------------------------------
-- Guard: prove nothing outside Leo moved. Fails loudly if it did —
-- and since this whole script should be run inside a transaction, a
-- failure here is your chance to ROLLBACK.
-- ------------------------------------------------------------
do $$
declare p record; bad text := '';
begin
  select * into p from _preflight;
  if (select count(*) from bookings     where tenant_id <> 'leo') <> p.bookings_other     then bad := bad || 'bookings '; end if;
  if (select count(*) from payments     where tenant_id <> 'leo') <> p.payments_other     then bad := bad || 'payments '; end if;
  if (select count(*) from members      where tenant_id <> 'leo') <> p.members_other      then bad := bad || 'members '; end if;
  if (select count(*) from expenses     where tenant_id <> 'leo') <> p.expenses_other     then bad := bad || 'expenses '; end if;
  if (select count(*) from sync_jobs    where tenant_id <> 'leo') <> p.syncjobs_other     then bad := bad || 'sync_jobs '; end if;
  if (select count(*) from integrations where tenant_id <> 'leo') <> p.integrations_other then bad := bad || 'integrations '; end if;
  if (select count(*) from vault.secrets where name not like 'partner:leo:%') <> p.secrets_other then bad := bad || 'vault.secrets '; end if;

  if bad <> '' then
    raise exception 'ANOTHER TENANT WAS TOUCHED: % — ROLL BACK NOW', bad;
  end if;
  raise notice 'launch-reset: Leo only, other tenants untouched';
end $$;

drop table _preflight;

-- verify what remains, for Leo
select 'bookings' as tbl, count(*) from bookings where tenant_id = 'leo'
union all select 'payments',     count(*) from payments     where tenant_id = 'leo'
union all select 'members',      count(*) from members      where tenant_id = 'leo'
union all select 'applications', count(*) from applications where tenant_id = 'leo';
