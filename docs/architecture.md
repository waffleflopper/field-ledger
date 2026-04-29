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

## App Shell

Authenticated product routes live under the literal `/app` URL path. The
current Next.js implementation uses a protected route group so auth concerns
stay outside feature pages while preserving the public route shape from the UI
spec.

The shell components live in `src/components/shell/`:

- `AppShell` wraps authenticated pages in the responsive navigation frame.
- `AppSidebar` owns tablet and desktop sidebar navigation.
- `BottomNav` owns phone bottom navigation and the More sheet.
- `navigation-config.ts` is the shared route list for both navigation modes.

The shell changes mode at Tailwind's `md` breakpoint. Business behavior still
belongs in domain modules; shell pages are only composition surfaces.

## Database Access

- Supabase provides Postgres/Auth/Storage.
- Drizzle owns app schema and migrations.
- RLS is required for account-owned data.
- The `accounts` table uses the Supabase Auth user id as its primary key,
  establishing the one-login-to-one-owner-account boundary.
- User-owned tables after `accounts` must include `account_id`.
- RLS protects ownership. App services protect behavior.
- Service-role or privileged database access must be rare, isolated, and documented.
- Temporary Phase 1 scaffold exception: local runtime database access currently
  uses the local `postgres` role so the server can initialize the first owner
  account while the app-role/RLS session boundary is still thin. Replace this
  with a non-superuser runtime role, or per-request RLS claim handling, before
  adding additional account-owned runtime tables.

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
