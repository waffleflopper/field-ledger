# Local Development

Field Ledger uses local Supabase from the beginning. The local stack is
configured in `supabase/config.toml`.

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

5. Copy the local publishable key from:

   ```sh
   pnpm supabase:status
   ```

   Paste it into `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local`.

6. Verify the local Postgres connection:

   ```sh
   pnpm db:check:local
   ```

7. Apply local database migrations:

   ```sh
   pnpm db:migrate
   ```

8. Start the app:

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

Supabase Auth is wrapped by the app-owned auth/session provider boundary under
`src/modules/provider-boundaries/auth/`. Product routes and UI should use that
boundary instead of importing Supabase Auth directly.

Route shape:

- `/auth/login` is the public sign-in surface.
- `/auth/callback` handles magic-link callbacks.
- `/auth/signout` signs out the current browser session.
- `/app/...` routes are authenticated product routes and redirect signed-out
  users to `/auth/login`.

For local email/password testing:

1. Start local Supabase and the app:

   ```sh
   pnpm supabase:start
   pnpm dev
   ```

2. Open `http://localhost:3000/auth/login`.
3. Enter a local email address and a password of at least six characters.
4. Use **Create local user** once, then use **Sign in** for later sessions.

Supabase email confirmations are disabled for local development in
`supabase/config.toml`, so the local user can sign in immediately.

Magic-link sign-in is included on the same auth surface. Local emails are
captured by Inbucket at `SUPABASE_INBUCKET_URL`:

Visit `http://127.0.0.1:54334` in your browser.

Click the generated sign-in link from that mailbox to complete the
`/auth/callback` flow.

## RLS Expectations

RLS (row-level security, meaning database rules that restrict which rows a user
can access) is required for account-owned Field Ledger tables. Future domain
tables that store user-owned data should include `account_id`, enable RLS in the
same migration that creates the table, and add tests proving one account cannot
read or write another account's rows.

The scaffold-only `app_internal.scaffold_migration_checks` table is not
account-owned user data and does not need RLS.

## Stop Local Supabase

```sh
pnpm supabase:stop
```
