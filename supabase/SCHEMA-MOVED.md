# The shared schema moved

`schema.sql` used to live here. It is the **platform** base schema —
`tenants`, `members`, `bookings`, `payments`, `attendance`,
`reminders_log` and the auth helpers — shared by every tenant on the
Academy Manager project (`ugsklcipzyiogxynshnh`).

It now lives in the platform repo:

    AcademyManager/supabase/schema.sql

**Why it moved.** This repo is handed to a client. It should carry Leo
Tennis Academy's app, not the schema every other tenant also runs on. A
client's developer reading `schema.sql` here would reasonably assume it
was theirs to change.

**Applying migrations.** There is one runner now, in the platform repo,
and it records what it applied:

    AcademyManager/scripts/migrate.sh --dry-run --scope leo <file.sql>
    AcademyManager/scripts/migrate.sh --scope leo <file.sql>

The old per-repo `scripts/migrate.sh` copies are gone. They had no
ledger check, so re-running an older file could silently revert a newer
function — which is the failure the ledger exists to prevent.

Leo's own edge functions (`supabase/functions/`) stay here.
