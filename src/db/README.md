# Database Schema

Drizzle owns app schema and migrations for Field Ledger.

- Schema definitions live in `src/db/schema.ts`.
- Generated SQL migrations live in `drizzle/`.
- Local migration commands target the non-default Supabase database port
  `54332` through `drizzle.config.ts`.

The current `app_internal.scaffold_migration_checks` table only proves the
migration path. It is not a product domain table.

The `accounts` table is the first production table. It maps one Better Auth
user identifier to one Field Ledger owner account through a unique
`auth_user_id` column, while `id` remains the app-owned account primary key for
future product tables. `auth_user_id` is an opaque provider identifier from
Better Auth, not a Supabase UUID.

New account rows initialize with `trialing` access plus 30-day trial start/end
timestamps. `subscription_tier` is nullable during trial and stores the
app-owned Base/Pro capability tier once an account is active.

`accounts` enables RLS in its creation migration. Future account-owned tables
should reference this table with `account_id`, enable RLS in their creation
migration, and include RLS tests before the workflow ships.

The `audit_events` table stores account-owned, append-only history for
meaningful state changes. Rows include the owning `account_id`, `actor_id`,
stable action name, optional target, event timestamp, small metadata payload,
and creation timestamp. `actor_id` stores the opaque auth subject that caused
the event, not a Supabase UUID. RLS policies for audit and account-owned tables
must use application-set session context, currently
`set_config('app.current_auth_subject', ...)`, rather than `auth.uid()`. Audit
events have no update or delete policies because accountable history should be
preserved.

Product tables grant only the owner-scoped operations each workflow slice needs.
For example, hand receipts currently allow authenticated owners to select,
insert, and update their own rows while delete remains unavailable. Runtime
reads and writes for account-owned tables must use the authenticated
database-session boundary, not the privileged scaffold connection directly.
