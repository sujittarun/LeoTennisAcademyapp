-- ============================================================
-- ACADEMY MANAGER — multi-tenant platform schema
-- Org: Academy Manager · Project: Leo Academy
-- Run this once in the Supabase SQL editor (Dashboard → SQL → New query).
-- Every table carries tenant_id so Gen Alpha and future academies
-- share this one database; 'leo' is seeded below.
-- ============================================================

create table if not exists tenants (
  id         text primary key,              -- 'leo', 'genalpha', ...
  name       text not null,
  config     jsonb not null default '{}',   -- courts, rates, UPI ids, templates
  created_at timestamptz not null default now()
);

create table if not exists members (
  id         bigint generated always as identity primary key,
  tenant_id  text not null references tenants(id),
  name       text not null,
  phone      text,
  program    text,
  joined     date,
  valid_till date,
  status     text not null default 'active',
  created_at timestamptz not null default now()
);
create index if not exists members_tenant_idx on members (tenant_id, status);

-- The availability ledger: ONE row per booked court-hour regardless of the
-- channel it came from (Website / Playo / Hudle / District / Walk-in).
-- This is the channel-manager core — a slot blocked here is blocked for
-- every surface that reads this table.
create table if not exists bookings (
  id         text primary key,              -- app-generated 'B-...' ids
  tenant_id  text not null references tenants(id),
  name       text not null,
  phone      text,
  sport      text not null default 'tennis',
  court      text,                          -- null until staff assign one
  date       date not null,
  hour       int  not null check (hour between 0 and 23),
  amount     int  not null,
  status     text not null default 'pending',  -- pending | confirmed | cancelled
  source     text not null default 'Website',
  created_at timestamptz not null default now()
);
create index if not exists bookings_tenant_date_idx on bookings (tenant_id, date);
-- a court can hold one active booking per hour
create unique index if not exists bookings_slot_unique
  on bookings (tenant_id, date, hour, court)
  where court is not null and status <> 'cancelled';

create table if not exists payments (
  id         bigint generated always as identity primary key,
  tenant_id  text not null references tenants(id),
  name       text,
  type       text,                          -- Membership | Court
  detail     text,
  amount     int,
  mode       text,                          -- UPI | Cash | Bank
  on_date    date,
  created_at timestamptz not null default now()
);
create index if not exists payments_tenant_idx on payments (tenant_id, on_date);

create table if not exists attendance (
  tenant_id  text not null references tenants(id),
  date       date not null,
  kind       text not null,                 -- member | staff
  person_id  text not null,
  present    boolean not null default true,
  primary key (tenant_id, date, kind, person_id)
);

create table if not exists reminders_log (
  id         bigint generated always as identity primary key,
  tenant_id  text not null references tenants(id),
  member_id  text not null,
  channel    text not null default 'whatsapp',
  upi_used   text,
  sent_at    timestamptz not null default now()
);

-- Usage analytics — feeds the central Academy Manager console.
create table if not exists events (
  id         bigint generated always as identity primary key,
  tenant_id  text not null references tenants(id),
  name       text not null,                 -- page_view, booking_submitted, ...
  props      jsonb not null default '{}',
  session_id text,
  page       text,
  at         timestamptz not null default now()
);
create index if not exists events_tenant_at_idx on events (tenant_id, at);

-- ------------------------------------------------------------
-- Row-level security. Phase 1 = anon key from the public apps may read
-- operational data and insert records; deletes are service-role only.
-- Tighten these to authenticated staff roles when Supabase Auth lands.
-- ------------------------------------------------------------
alter table tenants        enable row level security;
alter table members        enable row level security;
alter table bookings       enable row level security;
alter table payments       enable row level security;
alter table attendance     enable row level security;
alter table reminders_log  enable row level security;
alter table events         enable row level security;

create policy tenants_read      on tenants       for select using (true);
create policy members_read      on members       for select using (true);
create policy members_write     on members       for insert with check (true);
create policy members_update    on members       for update using (true);
create policy bookings_read     on bookings      for select using (true);
create policy bookings_write    on bookings      for insert with check (true);
create policy bookings_update   on bookings      for update using (true);
create policy payments_read     on payments      for select using (true);
create policy payments_write    on payments      for insert with check (true);
create policy attendance_read   on attendance    for select using (true);
create policy attendance_write  on attendance    for insert with check (true);
create policy attendance_update on attendance    for update using (true);
create policy reminders_write   on reminders_log for insert with check (true);
create policy reminders_read    on reminders_log for select using (true);
create policy events_write      on events        for insert with check (true);

-- ------------------------------------------------------------
-- Seed tenants
-- ------------------------------------------------------------
insert into tenants (id, name, config) values
  ('leo', 'Leo Tennis Academy',
   '{"brand":"Leo Academy","city":"Hyderabad",
     "courts":{"tennis":5,"pickleball":4},
     "rates":{"tennis":{"offPeak":500,"peak":700},"pickleball":{"offPeak":400,"peak":600},"peakFrom":16},
     "billing":{"payee":"Leo Academy","upiIds":["1234567890@ybl","0123456789@ybl"],"upiWindowDays":5}}'),
  ('genalpha', 'Gen Alpha Cricket Academy', '{"brand":"Gen Alpha","city":"Hyderabad"}')
on conflict (id) do nothing;
create table if not exists applications (
  id         bigint generated always as identity primary key,
  tenant_id  text not null references tenants(id),
  name       text not null,
  phone      text,
  email      text,
  level      text,
  goal       text,
  program    text,
  slot       text,
  trial_date date,
  created_at timestamptz not null default now()
);
create index if not exists applications_tenant_idx on applications (tenant_id, created_at desc);
alter table applications enable row level security;
create policy applications_read  on applications for select using (true);
create policy applications_write on applications for insert with check (true);

alter table payments add column if not exists ref text;
create unique index if not exists payments_ref_unique on payments (tenant_id, ref) where ref is not null;
-- the Academy Manager console reads usage analytics
create policy events_read on events for select using (true);
-- What each academy pays the platform (operator-only concept; the
-- tenant apps never read this). MRR amounts are PLACEHOLDERS — edit in
-- the dashboard or via SQL when real contracts are signed.
create table if not exists subscriptions (
  tenant_id  text primary key references tenants(id),
  plan       text not null default 'pilot',   -- pilot | standard | pro
  mrr        int  not null default 0,         -- ₹ per month
  status     text not null default 'active',  -- active | pilot | paused
  started    date,
  renews_on  date,
  notes      text
);
alter table subscriptions enable row level security;
create policy subscriptions_read on subscriptions for select using (true);

insert into subscriptions (tenant_id, plan, mrr, status, started, renews_on, notes) values
  ('leo',      'pilot',    2500, 'active', '2026-07-01', '2026-08-01', 'Won after demo — placeholder MRR, set real contract value'),
  ('genalpha', 'standard', 2000, 'active', '2026-06-01', '2026-08-01', 'First client — placeholder MRR')
on conflict (tenant_id) do nothing;
-- ============================================================
-- Migration 5 — trust layer, phase A (non-breaking)
-- Server-side pricing, atomic court assignment, PII-free public
-- availability. Strict per-role policies live in lockdown.sql and
-- are applied once auth users exist (platform_settings.lockdown).
-- ============================================================

create table if not exists platform_settings (key text primary key, value text not null);
insert into platform_settings values ('lockdown','false') on conflict (key) do nothing;
alter table platform_settings enable row level security;  -- no policies: service/definer access only

create or replace function is_locked() returns boolean language sql stable security definer
set search_path = public as
$$ select coalesce((select value from platform_settings where key='lockdown'),'false') = 'true' $$;

create or replace function auth_role() returns text language sql stable as
$$ select coalesce(auth.jwt()->'app_metadata'->>'am_role','') $$;

create or replace function auth_tenant() returns text language sql stable as
$$ select coalesce(auth.jwt()->'app_metadata'->>'tenant_id','') $$;

-- staff/operator guard that only bites after lockdown is enabled
create or replace function assert_staff(p_tenant text) returns void language plpgsql stable as $$
begin
  if not is_locked() then return; end if;
  if auth_role() = 'operator' then return; end if;
  if auth_role() = 'staff' and auth_tenant() = p_tenant then return; end if;
  raise exception 'not authorised';
end $$;

-- Public availability: slot occupancy WITHOUT names or phones.
-- Definer-owned view so anon never needs (and post-lockdown never has)
-- select on the bookings table itself.
create or replace view public_slots as
  select id, tenant_id, sport, date, hour, court, status
  from bookings where status <> 'cancelled';
grant select on public_slots to anon, authenticated;

-- Server-side pricing shared by all booking paths
create or replace function slot_rate(p_tenant text, p_sport text, p_hour int)
returns int language plpgsql stable as $$
declare v_cfg jsonb; v_amt int;
begin
  select config into v_cfg from tenants where id = p_tenant;
  if v_cfg is null then raise exception 'unknown academy'; end if;
  v_amt := case when p_hour >= coalesce((v_cfg#>>'{rates,peakFrom}')::int, 16)
    then (v_cfg#>>('{rates,' || p_sport || ',peak}'))::int
    else (v_cfg#>>('{rates,' || p_sport || ',offPeak}'))::int end;
  if v_amt is null then raise exception 'unknown sport'; end if;
  return v_amt;
end $$;

-- Public booking request: price computed here, capacity enforced here.
create or replace function request_booking(
  p_tenant text, p_sport text, p_date date, p_hour int, p_name text, p_phone text
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_cfg jsonb; v_courts int; v_taken int; v_amt int; v_id text;
begin
  if p_hour < 6 or p_hour > 22 then raise exception 'invalid hour'; end if;
  if p_date < current_date then raise exception 'date in the past'; end if;
  if length(trim(coalesce(p_name,''))) < 2 then raise exception 'name required'; end if;
  select config into v_cfg from tenants where id = p_tenant;
  if v_cfg is null then raise exception 'unknown academy'; end if;
  v_amt := slot_rate(p_tenant, p_sport, p_hour);
  v_courts := coalesce((v_cfg#>>('{courts,' || p_sport || '}'))::int, 0);
  select count(*) into v_taken from bookings
    where tenant_id = p_tenant and date = p_date and hour = p_hour
      and sport = p_sport and status <> 'cancelled';
  if v_taken >= v_courts then raise exception 'slot full'; end if;
  v_id := 'B-' || to_char(clock_timestamp(),'YYMMDDHH24MISSMS') || '-' || p_hour;
  insert into bookings (id, tenant_id, name, phone, sport, date, hour, amount, status, source)
    values (v_id, p_tenant, trim(p_name), nullif(trim(coalesce(p_phone,'')),''),
            p_sport, p_date, p_hour, v_amt, 'pending', 'Website');
  return jsonb_build_object('id', v_id, 'amount', v_amt);
end $$;
grant execute on function request_booking to anon, authenticated;

-- Staff manual entry (Playo/Hudle/walk-in): priced server-side,
-- court claimed atomically (unique index arbitrates races).
create or replace function record_booking(
  p_tenant text, p_sport text, p_date date, p_hour int,
  p_name text, p_phone text, p_source text, p_court text default null
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_cfg jsonb; v_amt int; v_id text; v_courts int; v_court text; i int;
begin
  perform assert_staff(p_tenant);
  select config into v_cfg from tenants where id = p_tenant;
  v_amt := slot_rate(p_tenant, p_sport, p_hour);
  v_id := 'B-M' || to_char(clock_timestamp(),'YYMMDDHH24MISSMS');
  if p_court is not null then
    insert into bookings (id, tenant_id, name, phone, sport, court, date, hour, amount, status, source)
      values (v_id, p_tenant, p_name, p_phone, p_sport, p_court, p_date, p_hour, v_amt, 'confirmed', p_source);
    return jsonb_build_object('id', v_id, 'court', p_court);
  end if;
  v_courts := coalesce((v_cfg#>>('{courts,' || p_sport || '}'))::int, 0);
  for i in 1..v_courts loop
    v_court := upper(left(p_sport,1)) || i;
    begin
      insert into bookings (id, tenant_id, name, phone, sport, court, date, hour, amount, status, source)
        values (v_id, p_tenant, p_name, p_phone, p_sport, v_court, p_date, p_hour, v_amt, 'confirmed', p_source);
      return jsonb_build_object('id', v_id, 'court', v_court);
    exception when unique_violation then null; -- court taken, try next
    end;
  end loop;
  raise exception 'all courts taken';
end $$;
grant execute on function record_booking to anon, authenticated;

-- Confirm a pending request: locks the row, claims a court atomically,
-- idempotent if already confirmed.
create or replace function confirm_booking(p_id text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare b bookings%rowtype; v_cfg jsonb; v_courts int; v_court text; i int;
begin
  select * into b from bookings where id = p_id for update;
  if not found then raise exception 'unknown booking'; end if;
  perform assert_staff(b.tenant_id);
  if b.status = 'confirmed' and b.court is not null then
    return jsonb_build_object('id', b.id, 'court', b.court);
  end if;
  if b.court is not null then
    update bookings set status = 'confirmed' where id = p_id;
    return jsonb_build_object('id', b.id, 'court', b.court);
  end if;
  select config into v_cfg from tenants where id = b.tenant_id;
  v_courts := coalesce((v_cfg#>>('{courts,' || b.sport || '}'))::int, 0);
  for i in 1..v_courts loop
    v_court := upper(left(b.sport,1)) || i;
    begin
      update bookings set status = 'confirmed', court = v_court where id = p_id;
      return jsonb_build_object('id', b.id, 'court', v_court);
    exception when unique_violation then null;
    end;
  end loop;
  raise exception 'all courts taken';
end $$;
grant execute on function confirm_booking to anon, authenticated;
-- fix: concatenated jsonb paths need an explicit text[] cast
create or replace function slot_rate(p_tenant text, p_sport text, p_hour int)
returns int language plpgsql stable as $$
declare v_cfg jsonb; v_amt int;
begin
  select config into v_cfg from tenants where id = p_tenant;
  if v_cfg is null then raise exception 'unknown academy'; end if;
  v_amt := case when p_hour >= coalesce((v_cfg#>>'{rates,peakFrom}')::int, 16)
    then (v_cfg#>>(array['rates', p_sport, 'peak']))::int
    else (v_cfg#>>(array['rates', p_sport, 'offPeak']))::int end;
  if v_amt is null then raise exception 'unknown sport'; end if;
  return v_amt;
end $$;

create or replace function court_count(p_cfg jsonb, p_sport text)
returns int language sql stable as
$$ select coalesce((p_cfg#>>(array['courts', p_sport]))::int, 0) $$;

create or replace function request_booking(
  p_tenant text, p_sport text, p_date date, p_hour int, p_name text, p_phone text
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_cfg jsonb; v_courts int; v_taken int; v_amt int; v_id text;
begin
  if p_hour < 6 or p_hour > 22 then raise exception 'invalid hour'; end if;
  if p_date < current_date then raise exception 'date in the past'; end if;
  if length(trim(coalesce(p_name,''))) < 2 then raise exception 'name required'; end if;
  select config into v_cfg from tenants where id = p_tenant;
  if v_cfg is null then raise exception 'unknown academy'; end if;
  v_amt := slot_rate(p_tenant, p_sport, p_hour);
  v_courts := court_count(v_cfg, p_sport);
  select count(*) into v_taken from bookings
    where tenant_id = p_tenant and date = p_date and hour = p_hour
      and sport = p_sport and status <> 'cancelled';
  if v_taken >= v_courts then raise exception 'slot full'; end if;
  v_id := 'B-' || to_char(clock_timestamp(),'YYMMDDHH24MISSMS') || '-' || p_hour;
  insert into bookings (id, tenant_id, name, phone, sport, date, hour, amount, status, source)
    values (v_id, p_tenant, trim(p_name), nullif(trim(coalesce(p_phone,'')),''),
            p_sport, p_date, p_hour, v_amt, 'pending', 'Website');
  return jsonb_build_object('id', v_id, 'amount', v_amt);
end $$;

create or replace function record_booking(
  p_tenant text, p_sport text, p_date date, p_hour int,
  p_name text, p_phone text, p_source text, p_court text default null
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_cfg jsonb; v_amt int; v_id text; v_courts int; v_court text; i int;
begin
  perform assert_staff(p_tenant);
  select config into v_cfg from tenants where id = p_tenant;
  v_amt := slot_rate(p_tenant, p_sport, p_hour);
  v_id := 'B-M' || to_char(clock_timestamp(),'YYMMDDHH24MISSMS');
  if p_court is not null then
    insert into bookings (id, tenant_id, name, phone, sport, court, date, hour, amount, status, source)
      values (v_id, p_tenant, p_name, p_phone, p_sport, p_court, p_date, p_hour, v_amt, 'confirmed', p_source);
    return jsonb_build_object('id', v_id, 'court', p_court);
  end if;
  v_courts := court_count(v_cfg, p_sport);
  for i in 1..v_courts loop
    v_court := upper(left(p_sport,1)) || i;
    begin
      insert into bookings (id, tenant_id, name, phone, sport, court, date, hour, amount, status, source)
        values (v_id, p_tenant, p_name, p_phone, p_sport, v_court, p_date, p_hour, v_amt, 'confirmed', p_source);
      return jsonb_build_object('id', v_id, 'court', v_court);
    exception when unique_violation then null;
    end;
  end loop;
  raise exception 'all courts taken';
end $$;

create or replace function confirm_booking(p_id text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare b bookings%rowtype; v_cfg jsonb; v_courts int; v_court text; i int;
begin
  select * into b from bookings where id = p_id for update;
  if not found then raise exception 'unknown booking'; end if;
  perform assert_staff(b.tenant_id);
  if b.status = 'confirmed' and b.court is not null then
    return jsonb_build_object('id', b.id, 'court', b.court);
  end if;
  if b.court is not null then
    update bookings set status = 'confirmed' where id = p_id;
    return jsonb_build_object('id', b.id, 'court', b.court);
  end if;
  select config into v_cfg from tenants where id = b.tenant_id;
  v_courts := court_count(v_cfg, b.sport);
  for i in 1..v_courts loop
    v_court := upper(left(b.sport,1)) || i;
    begin
      update bookings set status = 'confirmed', court = v_court where id = p_id;
      return jsonb_build_object('id', b.id, 'court', v_court);
    exception when unique_violation then null;
    end;
  end loop;
  raise exception 'all courts taken';
end $$;
-- CourtSync needs: cancel (free a slot) + venues readable by their own staff
create or replace function cancel_booking(p_id text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare b bookings%rowtype;
begin
  select * into b from bookings where id = p_id for update;
  if not found then raise exception 'unknown booking'; end if;
  perform assert_staff(b.tenant_id);
  update bookings set status = 'cancelled' where id = p_id;
  return jsonb_build_object('id', b.id, 'court', b.court, 'status', 'cancelled');
end $$;
grant execute on function cancel_booking to authenticated;

-- staff may read THEIR OWN tenant row (courts/rates config drive the grid)
drop policy if exists tenants_staff_r on tenants;
create policy tenants_staff_r on tenants for select
  using (auth_role() = 'staff' and id = auth_tenant());
-- ============================================================
-- Migration 7 — anti-abuse on the public booking path
-- Closes the verified DoS: anon could create unlimited pending
-- bookings with fake/no phone and exhaust a day's capacity.
-- No external service needed. Full OTP verification comes later.
-- ============================================================
create or replace function request_booking(
  p_tenant text, p_sport text, p_date date, p_hour int, p_name text, p_phone text
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_cfg jsonb; v_courts int; v_taken int; v_amt int; v_id text;
  v_phone text; v_pending_phone int; v_pending_day int;
begin
  if p_hour < 6 or p_hour > 22 then raise exception 'invalid hour'; end if;
  if p_date < current_date then raise exception 'date in the past'; end if;
  if p_date > current_date + 90 then raise exception 'date too far ahead'; end if;
  if length(trim(coalesce(p_name,''))) < 2 then raise exception 'name required'; end if;
  -- require a real 10-digit phone: gives us an identity to rate-limit on
  v_phone := regexp_replace(coalesce(p_phone,''), '\D', '', 'g');
  if length(v_phone) < 10 then raise exception 'valid phone required'; end if;
  v_phone := right(v_phone, 10);

  select config into v_cfg from tenants where id = p_tenant;
  if v_cfg is null then raise exception 'unknown academy'; end if;

  -- self-cleaning: unconfirmed website requests older than 90 min evaporate,
  -- so junk can never pile up and block real customers
  delete from bookings
    where tenant_id = p_tenant and date = p_date and source = 'Website'
      and status = 'pending' and created_at < now() - interval '90 minutes';

  -- flood caps: per phone, and per venue-day
  select count(*) into v_pending_phone from bookings
    where phone = v_phone and status = 'pending' and source = 'Website';
  if v_pending_phone >= 5 then raise exception 'too many pending requests — wait for confirmation'; end if;

  v_courts := court_count(v_cfg, p_sport);
  select count(*) into v_pending_day from bookings
    where tenant_id = p_tenant and date = p_date and source = 'Website' and status = 'pending';
  if v_pending_day >= greatest(v_courts * 8, 24) then raise exception 'the desk is catching up on requests — please call to book'; end if;

  v_amt := slot_rate(p_tenant, p_sport, p_hour);
  select count(*) into v_taken from bookings
    where tenant_id = p_tenant and date = p_date and hour = p_hour
      and sport = p_sport and status <> 'cancelled';
  if v_taken >= v_courts then raise exception 'slot full'; end if;

  v_id := 'B-' || to_char(clock_timestamp(),'YYMMDDHH24MISSMS') || '-' || p_hour;
  insert into bookings (id, tenant_id, name, phone, sport, date, hour, amount, status, source)
    values (v_id, p_tenant, trim(p_name), v_phone, p_sport, p_date, p_hour, v_amt, 'pending', 'Website');
  return jsonb_build_object('id', v_id, 'amount', v_amt);
end $$;
-- ============================================================
-- Migration 8 — operator_portfolio(): one call returns per-tenant
-- rollups computed IN the database. Two wins:
--  · performance — the console makes 1 RPC instead of 5×N raw fetches
--  · data minimization — only aggregates leave the DB; member names,
--    phones and payment details never reach the operator's browser
-- Operator-only (self-checked; SECURITY DEFINER bypasses RLS).
-- ============================================================
create or replace function operator_portfolio()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare result jsonb;
begin
  if auth_role() <> 'operator' then raise exception 'operator only'; end if;
  select coalesce(jsonb_agg(obj order by ord), '[]'::jsonb) into result from (
    select t.created_at as ord, jsonb_build_object(
      'tenant_id', t.id,
      'name', t.name,
      'config', t.config,
      'plan', s.plan,
      'mrr', coalesce(s.mrr, 0),
      'sub_status', s.status,
      'renews_on', s.renews_on,
      'bookings_30d', (select count(*) from bookings b where b.tenant_id=t.id and b.date >= current_date-30 and b.status<>'cancelled'),
      'bookings_prev', (select count(*) from bookings b where b.tenant_id=t.id and b.date >= current_date-60 and b.date < current_date-30 and b.status<>'cancelled'),
      'gmv_30d', (select coalesce(sum(amount),0) from bookings b where b.tenant_id=t.id and b.date >= current_date-30 and b.status='confirmed')
               + (select coalesce(sum(amount),0) from payments p where p.tenant_id=t.id and p.on_date >= current_date-30),
      'gmv_prev', (select coalesce(sum(amount),0) from bookings b where b.tenant_id=t.id and b.date >= current_date-60 and b.date < current_date-30 and b.status='confirmed')
                + (select coalesce(sum(amount),0) from payments p where p.tenant_id=t.id and p.on_date >= current_date-60 and p.on_date < current_date-30),
      'apps_30d', (select count(*) from applications a where a.tenant_id=t.id and a.created_at >= current_date-30),
      'events_30d', (select count(*) from events e where e.tenant_id=t.id and e.at >= current_date-30),
      'sessions_30d', (select count(distinct session_id) from events e where e.tenant_id=t.id and e.at >= current_date-30 and e.session_id is not null),
      'active_days_30d', (select count(distinct e.at::date) from events e where e.tenant_id=t.id and e.at >= current_date-30),
      'last_event_at', (select max(at) from events e where e.tenant_id=t.id),
      'errors_30d', (select count(*) from events e where e.tenant_id=t.id and e.name='client_error' and e.at >= current_date-30),
      'app_ver', (select props->>'ver' from events e where e.tenant_id=t.id and e.name='page_view' and e.props ? 'ver' order by e.at desc limit 1),
      'channel_mix', (select coalesce(jsonb_object_agg(src, cnt), '{}'::jsonb) from
        (select coalesce(source,'Website') src, count(*) cnt from bookings b where b.tenant_id=t.id and b.date >= current_date-30 and b.status<>'cancelled' group by 1) m),
      'weekly_gmv', (select coalesce(jsonb_agg(wk order by wknum desc), '[]'::jsonb) from
        (select g.n as wknum,
          (select coalesce(sum(amount),0) from bookings b where b.tenant_id=t.id and b.status='confirmed' and b.date >= current_date-(g.n*7+6) and b.date <= current_date-(g.n*7))
          + (select coalesce(sum(amount),0) from payments p where p.tenant_id=t.id and p.on_date >= current_date-(g.n*7+6) and p.on_date <= current_date-(g.n*7)) as wk
         from generate_series(0,7) g(n)) w),
      'usage_daily', (select coalesce(jsonb_object_agg(d::text, cnt), '{}'::jsonb) from
        (select e.at::date d, count(*) cnt from events e where e.tenant_id=t.id and e.at >= current_date-13 group by 1) u)
    ) as obj
    from tenants t left join subscriptions s on s.tenant_id = t.id
  ) x;
  return result;
end $$;
grant execute on function operator_portfolio to authenticated;
-- ============================================================
-- Migration 9 — plan tiers + overage + messaging-cost tracking
-- Tiers price by active-player headroom; when a tenant exceeds
-- its cap the operator sees it (charge more / upsell). Messaging
-- (WhatsApp reminders) is a per-message overhead we bill or absorb.
-- ============================================================
alter table subscriptions add column if not exists tier text;
alter table subscriptions add column if not exists player_cap int;
alter table subscriptions add column if not exists msg_rate numeric(6,2) default 0.35; -- ₹ per WhatsApp message

-- PLACEHOLDER tiers (user is still finalising): T1 up to 50 players @ ₹899
update subscriptions set tier='Tier 1', player_cap=50, mrr=899, msg_rate=0.35 where tenant_id='leo';
update subscriptions set tier='Tier 1', player_cap=50, mrr=899, msg_rate=0.35 where tenant_id='genalpha';

-- Seed Leo's roster into the DB so "active players" is a real number
-- (demo data — cleared by launch-reset.sql at go-live).
insert into members (tenant_id, name, phone, program, joined, valid_till, status) values
  ('leo','Kabir Nair','99490 55876','perf',    '2025-04-05', current_date+29, 'active'),
  ('leo','Arjun Malhotra','96031 74412','found','2026-03-01', current_date+60, 'active'),
  ('leo','Sneha Kulkarni','98495 20678','cardio','2026-06-02', current_date-3,  'due'),
  ('leo','Rohit Venkatesh','90000 87641','perf', '2025-03-02', current_date+58, 'active'),
  ('leo','Meera Iyer','98661 90035','found',     '2026-02-18', current_date+41, 'active'),
  ('leo','Adityan Pillai','96520 71148','private','2024-12-01', current_date-8,  'due'),
  ('leo','Farhan Sheikh','90104 22983','perf',   '2025-07-22', current_date+2,  'active'),
  ('leo','Divya Chandran','97010 38854','cardio','2025-10-08', current_date-1,  'due'),
  ('leo','Vikram Bhat','98850 61147','found',    '2026-05-12', current_date+33, 'active'),
  ('leo','Ananya Deshpande','98481 33290','perf','2026-01-10', current_date+19, 'active'),
  ('leo','Sanjay Reddy','98490 11223','cardio',  '2025-11-04', current_date+47, 'active'),
  ('leo','Nikhil Prasad','99890 44215','found',  '2025-09-15', current_date+25, 'active'),
  ('leo','Lakshmi Menon','98123 40987','private','2026-04-20', current_date+52, 'active'),
  ('leo','Tarun Agarwal','97654 12309','perf',   '2026-06-15', current_date+74, 'active')
on conflict do nothing;

-- extend operator_portfolio with tier / players / messaging cost
create or replace function operator_portfolio()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare result jsonb;
begin
  if auth_role() <> 'operator' then raise exception 'operator only'; end if;
  select coalesce(jsonb_agg(obj order by ord), '[]'::jsonb) into result from (
    select t.created_at as ord, jsonb_build_object(
      'tenant_id', t.id, 'name', t.name, 'config', t.config,
      'plan', s.plan, 'mrr', coalesce(s.mrr,0), 'sub_status', s.status, 'renews_on', s.renews_on,
      'tier', s.tier, 'player_cap', s.player_cap, 'msg_rate', coalesce(s.msg_rate,0.35),
      'active_players', (select count(*) from members m where m.tenant_id=t.id and m.status in ('active','due')),
      'msgs_30d', (select count(*) from reminders_log r where r.tenant_id=t.id and r.sent_at >= current_date-30),
      'msg_cost_30d', round((select count(*) from reminders_log r where r.tenant_id=t.id and r.sent_at >= current_date-30) * coalesce(s.msg_rate,0.35), 2),
      'bookings_30d', (select count(*) from bookings b where b.tenant_id=t.id and b.date >= current_date-30 and b.status<>'cancelled'),
      'bookings_prev', (select count(*) from bookings b where b.tenant_id=t.id and b.date >= current_date-60 and b.date < current_date-30 and b.status<>'cancelled'),
      'gmv_30d', (select coalesce(sum(amount),0) from bookings b where b.tenant_id=t.id and b.date >= current_date-30 and b.status='confirmed')
               + (select coalesce(sum(amount),0) from payments p where p.tenant_id=t.id and p.on_date >= current_date-30),
      'gmv_prev', (select coalesce(sum(amount),0) from bookings b where b.tenant_id=t.id and b.date >= current_date-60 and b.date < current_date-30 and b.status='confirmed')
                + (select coalesce(sum(amount),0) from payments p where p.tenant_id=t.id and p.on_date >= current_date-60 and p.on_date < current_date-30),
      'apps_30d', (select count(*) from applications a where a.tenant_id=t.id and a.created_at >= current_date-30),
      'events_30d', (select count(*) from events e where e.tenant_id=t.id and e.at >= current_date-30),
      'sessions_30d', (select count(distinct session_id) from events e where e.tenant_id=t.id and e.at >= current_date-30 and e.session_id is not null),
      'active_days_30d', (select count(distinct e.at::date) from events e where e.tenant_id=t.id and e.at >= current_date-30),
      'last_event_at', (select max(at) from events e where e.tenant_id=t.id),
      'errors_30d', (select count(*) from events e where e.tenant_id=t.id and e.name='client_error' and e.at >= current_date-30),
      'app_ver', (select props->>'ver' from events e where e.tenant_id=t.id and e.name='page_view' and e.props ? 'ver' order by e.at desc limit 1),
      'channel_mix', (select coalesce(jsonb_object_agg(src, cnt), '{}'::jsonb) from
        (select coalesce(source,'Website') src, count(*) cnt from bookings b where b.tenant_id=t.id and b.date >= current_date-30 and b.status<>'cancelled' group by 1) m),
      'weekly_gmv', (select coalesce(jsonb_agg(wk order by wknum desc), '[]'::jsonb) from
        (select g.n as wknum,
          (select coalesce(sum(amount),0) from bookings b where b.tenant_id=t.id and b.status='confirmed' and b.date >= current_date-(g.n*7+6) and b.date <= current_date-(g.n*7))
          + (select coalesce(sum(amount),0) from payments p where p.tenant_id=t.id and p.on_date >= current_date-(g.n*7+6) and p.on_date <= current_date-(g.n*7)) as wk
         from generate_series(0,7) g(n)) w),
      'usage_daily', (select coalesce(jsonb_object_agg(d::text, cnt), '{}'::jsonb) from
        (select e.at::date d, count(*) cnt from events e where e.tenant_id=t.id and e.at >= current_date-13 group by 1) u)
    ) as obj
    from tenants t left join subscriptions s on s.tenant_id = t.id
  ) x;
  return result;
end $$;
