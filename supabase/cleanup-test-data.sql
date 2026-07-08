-- One-off cleanup of test/dummy rows created during regression + security
-- testing (2026-07-08). Safe: exact ids + ZZ/SECAUDIT-tagged rows only.
delete from applications where id in (5, 6, 7, 8, 9);   -- ZZ Test Regression + SECAUDIT
delete from members      where id in (17, 18, 19);      -- ZZ Short Phone / Quarterly / Fix Verify
delete from payments     where ref = 'P-1783482825093'; -- ZZ Quarterly Member, ₹0

-- verify nothing test-tagged remains
select 'applications' as tbl, count(*) from applications where tenant_id = 'leo' and (name like 'ZZ%' or name like 'SECAUDIT%')
union all select 'members', count(*) from members where name like 'ZZ%'
union all select 'payments', count(*) from payments where name like 'ZZ%';
