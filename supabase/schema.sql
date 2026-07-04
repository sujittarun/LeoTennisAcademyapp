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
