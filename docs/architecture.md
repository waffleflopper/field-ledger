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

When a product workflow must persist domain state and audit history atomically,
use the app-owned database unit-of-work boundary. The unit of work provides
transaction-scoped repositories, including the domain repository and the audit
repository, inside one authenticated database session. Domain repositories must
not grow `withAuditEvent` methods or write `audit_events` directly.

Hand receipt lifecycle behavior is owned by the hand receipts module. Archive
and restore are reversible application-service behaviors, emit audit events, and
must not be reimplemented in route components or UI-only code. See
`docs/hand-receipt-archive-behavior.md` for deferred requirement and 2062
boundaries.

Requirement lifecycle behavior is owned by `src/modules/requirements/`.
Requirement create, edit, complete, next-due adjustment, pause, resume,
dashboard-window classification, and completion-history listing live in module
application services. Item-detail and dashboard routes compose requirement UI
and typed tRPC procedures; they do not calculate due windows or write audit
events directly.

Requirement pause/resume uses a conditional repository write against
`paused_at`: pause only succeeds while the persisted value is null, and resume
only succeeds while the persisted value still matches the timestamp read by the
service. Future lifecycle transitions with similar read-then-write races should
use the same conditional-write shape so stale operations fail before
audit/activity history is recorded.

Document upload behavior is owned by `src/modules/documents/`. The module
validates accepted PDF/image types and the application upload-size limit,
requests private upload/read URLs through the file-storage provider boundary,
persists account-owned hand-receipt-scoped metadata only after the browser file
upload succeeds, and emits `document.uploaded` activity without storing file
contents or sensitive document snapshots in audit metadata.

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
- Item records are account-owned, belong to exactly one current hand receipt,
  and use the same authenticated database-session boundary. Item RLS also
  checks that the linked hand receipt belongs to the same account on insert and
  update, while app services enforce read-only state, active receipt checks, and
  identifier rules.
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
