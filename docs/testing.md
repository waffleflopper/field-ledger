# Testing Strategy

Use TDD for vertical slices where behavior is clear. The goal is confidence
around domain behavior and high-risk workflows, not a giant brittle browser
suite.

## Unit Tests

Use unit tests for pure rules and application-service decisions:

- item identifier validation
- generated ID behavior
- duplicate warning decisions
- recurring due date calculation
- requirement completion behavior
- subscription/access capability checks
- archive/restore behavior
- 2062 state transitions

Command:

```sh
pnpm test:unit
```

Current scaffold proof:

- `tests/unit/accounts/ensure-account.test.ts`
- `tests/unit/app-foundation/get-scaffold-health.test.ts`

## Integration Tests

Use integration-style tests for module workflows and typed application paths:

- Better Auth session context through the app-owned auth boundary
- create hand receipt
- view and edit hand receipt details
- archive/restore hand receipt
- create/edit/archive/restore/move item
- upload/link single-item 2062
- upload/link multi-item 2062
- close 2062 or remove item link
- complete requirement
- archive hand receipt suppresses reminders
- audit events emitted by workflows

Command:

```sh
pnpm test:integration
```

Current scaffold proof:

- `tests/integration/trpc/foundation-router.test.ts`
- `tests/integration/auth/protected-procedure.test.ts`

## RLS Tests

RLS tests are required for account-owned tables. RLS means row-level security:
database rules that restrict which rows a user can access.

Every account-owned table should have tests proving one account cannot read or
write another account's rows.

Hand receipt RLS tests cover owner-scoped select, insert, and update behavior.
Archive and restore are update behaviors, so RLS coverage must prove status
changes cannot cross account boundaries while application tests prove lifecycle
rules and read-only blocking.
Application-service tests still cover read-only capability blocking because RLS
protects row ownership, not product access state.

Command:

```sh
pnpm test:rls
```

The account foundation includes the first RLS-protected production table, so
`pnpm test:rls` now runs real tests instead of using scaffold
`--passWithNoTests` behavior.

Current account RLS proof:

- `tests/rls/accounts/accounts-rls.test.ts`

## Browser/UI Tests

Keep browser tests focused on critical flows:

- dashboard shows overdue/due-soon/upcoming requirements
- global search opens an item and shows hand receipt context
- single-item upload 2062 flow
- multi-item upload 2062 flow
- app shell navigation on mobile and desktop

Command:

```sh
pnpm test:e2e
```

Current scaffold proof:

- `tests/e2e/scaffold.spec.ts`
- `tests/e2e/auth.spec.ts`

Auth-related browser tests should verify the app-owned auth/session boundary
and Better Auth flow, not route or UI calls to provider internals.

## API and Database Checks

Use these checks for scaffold/provider foundations:

```sh
pnpm api:check:local
pnpm db:check:local
```

`pnpm db:check:local` expects Field Ledger's local Supabase stack to be running
on the non-default database port `54332`.

RLS tests remain database-backed and should prove that account-owned rows are
isolated using the app-owned `app.current_auth_subject` session context rather
than Supabase-only `auth.uid()` behavior.

## CI-Ready Verification

The full local verification command is:

```sh
pnpm verify
```

It runs:

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm test:rls
pnpm test:e2e
pnpm format:check
```

Database migration checks remain separate because they require local Supabase:

```sh
pnpm supabase:start
pnpm db:migrate
pnpm db:check:local
pnpm supabase:stop
```
