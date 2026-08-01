-- One-off cleanup of test/dummy rows created during regression + security
-- testing (2026-07-08).
--
-- Ids on shared tables are GLOBAL, not per-tenant: `where id in (17,18,19)`
-- says nothing about whose rows those are. If this file is ever re-run
-- after other academies have written rows, those ids belong to someone
-- else. Every statement is therefore scoped to tenant_id = 'leo' AND to
-- the test tag that identified the row in the first place.
delete from applications
 where tenant_id = 'leo' and id in (5, 6, 7, 8, 9)
   and (name like 'ZZ%' or name like 'SECAUDIT%');

delete from members
 where tenant_id = 'leo' and id in (17, 18, 19)
   and name like 'ZZ%';

delete from payments
 where tenant_id = 'leo' and ref = 'P-1783482825093'
   and name like 'ZZ%';

-- verify nothing test-tagged remains for Leo
select 'applications' as tbl, count(*) from applications
 where tenant_id = 'leo' and (name like 'ZZ%' or name like 'SECAUDIT%')
union all select 'members', count(*) from members
 where tenant_id = 'leo' and name like 'ZZ%'
union all select 'payments', count(*) from payments
 where tenant_id = 'leo' and name like 'ZZ%';
