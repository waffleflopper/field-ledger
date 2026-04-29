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

- `tests/unit/app-foundation/get-scaffold-health.test.ts`

## Integration Tests

Use integration-style tests for module workflows and typed application paths:

- create hand receipt
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

Command:

```sh
pnpm test:rls
```

The scaffold phase has no account-owned product tables, so this command is wired
with `--passWithNoTests`. Replace that with real tests when the first
account-owned table lands.

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

## API and Database Checks

Use these checks for scaffold/provider foundations:

```sh
pnpm api:check:local
pnpm db:check:local
```

`pnpm db:check:local` expects Field Ledger's local Supabase stack to be running
on the non-default database port `54332`.

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
