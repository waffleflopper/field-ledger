# Database Schema

Drizzle owns app schema and migrations for Field Ledger.

- Schema definitions live in `src/db/schema.ts`.
- Generated SQL migrations live in `drizzle/`.
- Local migration commands target the non-default Supabase database port
  `54332` through `drizzle.config.ts`.

The current `app_internal.scaffold_migration_checks` table only proves the
migration path. It is not a product domain table.

The `accounts` table is the first production table. It maps one Supabase Auth
user id to one Field Ledger owner account through a unique `user_id` column,
while `id` remains the app-owned account primary key for future product tables.
New account rows initialize with `trialing` access plus 30-day trial start/end
timestamps. `subscription_tier` is nullable during trial and stores the
app-owned Base/Pro capability tier once an account is active.

`accounts` enables RLS in its creation migration and grants the Supabase
`authenticated` role owner-only select, insert, and update access. Future
account-owned tables should reference this table with `account_id`, enable RLS
in their creation migration, and include RLS tests before the workflow ships.

The `audit_events` table stores account-owned, append-only history for
meaningful state changes. Rows include the owning `account_id`, `actor_id`,
stable action name, optional target, event timestamp, small metadata payload,
and creation timestamp. RLS grants the Supabase `authenticated` role select and
insert only when the event belongs to the account mapped from `auth.uid()`.
There are no update or delete policies; accountable history should be preserved.
Runtime reads and writes for account-owned tables must use the authenticated
database-session boundary, not the privileged scaffold connection directly.
