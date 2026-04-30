# Local Development

Field Ledger uses local Supabase from the beginning for Postgres, Storage, RLS,
and supporting development services. The local stack is configured in
`supabase/config.toml`.

No hosted Supabase project is required for local development.

## Supabase Ports

Field Ledger intentionally avoids the Supabase CLI default ports so another
local Supabase project can run at the same time.

| Service | Field Ledger port |
| --- | ---: |
| API | `54331` |
| Postgres | `54332` |
| Studio | `54333` |
| Inbucket | `54334` |
| Inbucket SMTP | `54335` |
| Inbucket POP3 | `54336` |
| Analytics | `54337` |
| Shadow database | `54330` |
| Pooler, if enabled later | `54339` |
| Edge runtime inspector | `54343` |

## First-Time Setup

1. Install dependencies:

   ```sh
   pnpm install
   ```

2. Confirm the repo-local Supabase CLI is available:

   ```sh
   pnpm exec supabase --version
   ```

3. Copy the local environment example:

   ```sh
   cp .env.example .env.local
   ```

4. Start local Supabase:

   ```sh
   pnpm supabase:start
   ```

5. Verify the local Postgres connection:

   ```sh
   pnpm db:check:local
   ```

6. Apply local database migrations:

   ```sh
   pnpm db:migrate
   ```

7. Start the app:

   ```sh
   pnpm dev
   ```

## Drizzle Migrations

Drizzle owns app schema and migrations.

- Generate migrations after changing `src/db/schema.ts`:

  ```sh
  pnpm db:generate
  ```

- Apply migrations to local Supabase:

  ```sh
  pnpm db:migrate
  ```

- Inspect the local schema with Drizzle Studio:

  ```sh
  pnpm db:studio
  ```

The first migration creates only `app_internal.scaffold_migration_checks`. That
table is a scaffold-only migration proof, not a Field Ledger domain table.

## Provider Boundary

App code should use the database connection helpers under
`src/modules/provider-boundaries/database/`. Routes and UI should not create
raw Supabase or Postgres clients directly. Future domain modules should call
application services, and those services should use provider-boundary adapters
for database, auth, storage, billing, audit, and notification work.

Temporary Phase 1 exception: `DATABASE_URL` points at the local `postgres`
role so the scaffold can initialize owner accounts from the server. This is
privileged local runtime access. Before Field Ledger adds more account-owned
runtime tables, replace it with a non-superuser app role or a per-request RLS
claim boundary so app reads and writes exercise ownership policies.

## tRPC and Query Foundation

tRPC is the app API layer, and TanStack Query owns client-side query state. The
current scaffold exposes only `foundation.health`, which proves the typed
server/client path without adding product behavior.

Real workflows should follow this dependency direction:

```text
route/module UI -> tRPC procedure -> module application service -> provider boundary
```

The scaffold route handler lives at `src/app/api/trpc/[trpc]/route.ts`. The
client provider is mounted in `src/app/providers.tsx`, and typed React hooks are
created in `src/trpc/react.ts`.

Verify the scaffold tRPC procedure with:

```sh
pnpm api:check:local
```

## Auth Routes and Local Users

Better Auth is the selected auth/session provider and must stay wrapped by the
app-owned auth/session provider boundary under
`src/modules/provider-boundaries/auth/`. Product routes and UI should use that
boundary instead of importing Better Auth directly.

Local Supabase is still required for database, Storage, RLS, and local service
testing, but it is no longer the intended auth provider. Better Auth session
management replaces Supabase Auth session handling.

Route shape:

- `/auth/login` is the public sign-in surface.
- `/api/auth/[...all]` is the Better Auth route handler behind the app-owned
  auth boundary.
- `/auth/signout` signs out the current browser session.
- `/app/...` routes are authenticated product routes and redirect signed-out
  users to `/auth/login`.

For local email/password testing after the Better Auth implementation lands:

1. Start local Supabase and the app:

   ```sh
   pnpm supabase:start
   pnpm dev
   ```

2. Open `http://localhost:3000/auth/login`.
3. Enter a local email address and a password of at least eight characters.
4. Use **Create account** once, then use **Sign in** for later sessions.

Local email/password auth does not require Supabase Auth publishable keys.
Email confirmation and magic-link sign-in are outside the current auth slice.

## RLS Expectations

RLS (row-level security, meaning database rules that restrict which rows a user
can access) is required for account-owned Field Ledger tables. Future domain
tables that store user-owned data should include `account_id`, enable RLS in the
same migration that creates the table, and add tests proving one account cannot
read or write another account's rows.

The scaffold-only `app_internal.scaffold_migration_checks` table is not
account-owned user data and does not need RLS.

Because Better Auth replaces Supabase Auth as the provider contract, RLS
policies use application-set session context instead of `auth.uid()`. Current
account-owned policies read `app.current_auth_subject`, which the authenticated
database-session boundary sets transaction-locally.

## Stop Local Supabase

```sh
pnpm supabase:stop
```
