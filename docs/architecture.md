# Architecture

## Shape

Field Ledger is a single Next.js app repo with strong internal domain modules.

Use a domain-first structure:

```text
src/modules/accounts/
src/modules/audit/
src/modules/billing/
src/modules/contacts/
src/modules/documents/
src/modules/hand-receipts/
src/modules/items/
src/modules/locations/
src/modules/requirements/
src/modules/assignments-2062/
src/modules/import-export/
```

The exact folder names can evolve during scaffold, but the dependency rule should not.

## Dependency Rule

Routes and UI call tRPC procedures. tRPC procedures call module application services. Application services call repositories and provider ports. Provider adapters call Supabase, Stripe, storage, email, or other external systems.

```text
UI route -> module UI -> tRPC -> application service -> repository/provider port -> adapter/external system
```

Business workflows must live in application services, not routes or raw UI components.

## Provider Boundaries

Required boundaries:

- auth/session
- account access
- billing
- file storage
- audit logger
- notifications
- import/export

Supabase Auth, Supabase Storage, and Stripe are implementation details behind boundaries.

## Database Access

- Supabase provides Postgres/Auth/Storage.
- Drizzle owns app schema and migrations.
- RLS is required for account-owned data.
- User-owned tables must include `account_id`.
- RLS protects ownership. App services protect behavior.
- Service-role or privileged database access must be rare, isolated, and documented.

## Import/Export Boundary

Import/export is an early post-MVP module boundary with no MVP implementation.

The module will own CSV/XLSX parsing, export formatting, row validation, duplicate detection, preview-before-commit, and column mapping.

Do not hand-roll export logic inside feature screens.

## Offline Boundary

MVP is online-first. Offline read cache is reserved for later.

Architectural constraints:

- Do not promise offline editing.
- Avoid patterns that make persisted read cache impossible.
- Favor typed query boundaries that can later support cached read models.

Future phase:

- read-only offline access to recently viewed hand receipts, items, locations, signed-out state, and due requirements
- later limited offline requirement completion sync if justified

