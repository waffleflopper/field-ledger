# Database Schema

Drizzle owns app schema and migrations for Field Ledger.

- Schema definitions live in `src/db/schema.ts`.
- Generated SQL migrations live in `drizzle/`.
- Local migration commands target the non-default Supabase database port
  `54332` through `drizzle.config.ts`.

The current `app_internal.scaffold_migration_checks` table only proves the
migration path. It is not a product domain table.

The `accounts` table is the first production table. It maps one Supabase Auth
user id to one Field Ledger owner account by using the auth user id as the
account primary key. New account rows initialize with `trialing` access plus
30-day trial start/end timestamps. `subscription_tier` is nullable during trial
and stores the app-owned Base/Pro capability tier once an account is active.

`accounts` enables RLS in its creation migration and grants the Supabase
`authenticated` role owner-only select, insert, and update access. Future
account-owned tables should reference this table with `account_id`, enable RLS
in their creation migration, and include RLS tests before the workflow ships.
