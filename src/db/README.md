# Database Schema

Drizzle owns app schema and migrations for Field Ledger.

- Schema definitions live in `src/db/schema.ts`.
- Generated SQL migrations live in `drizzle/`.
- Local migration commands target the non-default Supabase database port
  `54332` through `drizzle.config.ts`.

The current `app_internal.scaffold_migration_checks` table only proves the
migration path. It is not a product domain table.

Future account-owned tables must include `account_id`, enable RLS in their
creation migration, and include RLS tests before the workflow ships.
