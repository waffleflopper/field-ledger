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

Better Auth is the selected auth/session provider. Supabase Auth was used in
the first Phase 1 implementation, but ADR 0005 replaces it as the intended auth
provider before future auth/account work continues.

Supabase Postgres, Supabase Storage, and Supabase RLS remain the database,
private file storage, and ownership-enforcement layer. Better Auth, Supabase
Storage, Supabase Postgres access, and Stripe are implementation details behind
boundaries.

The audit logger boundary is app-owned. Product modules emit meaningful events
through audit application services and repository ports; routes, UI components,
and future provider adapters must not insert audit records directly.

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

- Supabase provides Postgres, Storage, RLS, and local development services.
- Better Auth provides auth/session behavior behind the app-owned auth boundary.
- Drizzle owns app schema and migrations.
- RLS is required for account-owned data.
- The `accounts` table has an app-owned primary key and a unique
  `auth_user_id` mapping to the Better Auth user identifier, establishing the
  one-login-to-one-owner-account boundary without making auth ids the product
  ownership id.
- Auth identity values are opaque provider identifiers, not Supabase UUIDs.
- User-owned tables after `accounts` must include `account_id`.
- RLS protects ownership. App services protect behavior.
- Owner-scoped product tables grant only the operations each slice needs. Hand
  receipts currently allow authenticated owners to select, insert, and update
  rows where `account_id` belongs to `app.current_auth_subject`; app services
  still enforce read-only capability and lifecycle rules.
- Service-role or privileged database access must be rare, isolated, and documented.
- Temporary Phase 1 scaffold exception: local runtime database access currently
  uses the local `postgres` role so the server can initialize the first owner
  account while the app-role/RLS session boundary is still thin.
- Account-owned runtime repositories after `accounts` must execute through the
  authenticated database-session boundary so Supabase RLS can evaluate the
  application-set current auth/account context. New account-owned repositories
  should include a repository-level RLS regression test proving they cannot read
  or write another account's rows through the app adapter.

## RLS Session Context

RLS remains mandatory for account-owned data even though Supabase Auth is no
longer the auth-provider contract. Policies should use application-set session
context instead of `auth.uid()`. Current policies read the
`app.current_auth_subject` transaction setting through the
`app.current_auth_subject()` SQL function. The app-owned database-session
boundary is responsible for setting that context before account-owned
repositories read or write data.

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
