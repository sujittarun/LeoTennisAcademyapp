-- ============================================================
-- LOCKDOWN — run ONCE the auth users exist:
--   · operator user  (app_metadata: {"am_role":"operator"})
--   · one staff user per academy (app_metadata: {"am_role":"staff","tenant_id":"leo"})
-- Replaces the permissive phase-1 policies with per-role, per-tenant
-- rules, then enables the lockdown flag that arms the RPC guards.
-- Public pages keep working: they use public_slots + request_booking
-- + anon inserts on applications/events only.
-- ============================================================

-- drop phase-1 policies
drop policy if exists tenants_read      on tenants;
drop policy if exists members_read      on members;
drop policy if exists members_write     on members;
drop policy if exists members_update    on members;
drop policy if exists bookings_read     on bookings;
drop policy if exists bookings_write    on bookings;
drop policy if exists bookings_update   on bookings;
drop policy if exists payments_read     on payments;
drop policy if exists payments_write    on payments;
drop policy if exists attendance_read   on attendance;
drop policy if exists attendance_write  on attendance;
drop policy if exists attendance_update on attendance;
drop policy if exists reminders_write   on reminders_log;
drop policy if exists reminders_read    on reminders_log;
drop policy if exists events_write      on events;
drop policy if exists events_read       on events;
drop policy if exists applications_read  on applications;
drop policy if exists applications_write on applications;
drop policy if exists subscriptions_read on subscriptions;

-- helpers exist from migration 5: auth_role(), auth_tenant()

-- tenants + subscriptions: operator eyes only (RPCs read config as definer)
create policy tenants_op       on tenants       for select using (auth_role() = 'operator');
create policy subscriptions_op on subscriptions for select using (auth_role() = 'operator');

-- bookings: staff see their academy, operator sees all; writes via RPCs only
create policy bookings_staff on bookings for select
  using (auth_role() = 'operator' or (auth_role() = 'staff' and tenant_id = auth_tenant()));

-- members / payments / attendance / reminders: staff of the tenant (+ operator read)
create policy members_staff_r on members for select
  using (auth_role() = 'operator' or (auth_role() = 'staff' and tenant_id = auth_tenant()));
create policy members_staff_w on members for insert
  with check (auth_role() = 'staff' and tenant_id = auth_tenant());
create policy members_staff_u on members for update
  using (auth_role() = 'staff' and tenant_id = auth_tenant());

create policy payments_staff_r on payments for select
  using (auth_role() = 'operator' or (auth_role() = 'staff' and tenant_id = auth_tenant()));
create policy payments_staff_w on payments for insert
  with check (auth_role() = 'staff' and tenant_id = auth_tenant());

create policy attendance_staff_r on attendance for select
  using (auth_role() = 'operator' or (auth_role() = 'staff' and tenant_id = auth_tenant()));
create policy attendance_staff_w on attendance for insert
  with check (auth_role() = 'staff' and tenant_id = auth_tenant());
create policy attendance_staff_u on attendance for update
  using (auth_role() = 'staff' and tenant_id = auth_tenant());

create policy reminders_staff_r on reminders_log for select
  using (auth_role() = 'operator' or (auth_role() = 'staff' and tenant_id = auth_tenant()));
create policy reminders_staff_w on reminders_log for insert
  with check (auth_role() = 'staff' and tenant_id = auth_tenant());

-- applications: the public admission form may insert; only staff/operator read
create policy applications_public_w on applications for insert with check (true);
create policy applications_staff_r  on applications for select
  using (auth_role() = 'operator' or (auth_role() = 'staff' and tenant_id = auth_tenant()));

-- events: telemetry may flow from anyone; only the operator reads it
create policy events_public_w on events for insert with check (true);
create policy events_op_r     on events for select using (auth_role() = 'operator');

-- arm the RPC guards (record_booking / confirm_booking now require staff)
update platform_settings set value = 'true' where key = 'lockdown';
