# Testing Strategy

Use TDD for vertical slices where behavior is clear. The goal is confidence around domain behavior and high-risk workflows, not a giant brittle browser suite.

## Unit Tests

Use for pure rules:

- item identifier validation
- generated ID behavior
- duplicate warning decisions
- recurring due date calculation
- requirement completion behavior
- subscription/access capability checks
- archive/restore behavior
- 2062 state transitions

## Integration Tests

Use for module workflows:

- create hand receipt
- archive/restore hand receipt
- create/edit/archive/restore/move item
- upload/link single-item 2062
- upload/link multi-item 2062
- close 2062 or remove item link
- complete requirement
- archive hand receipt suppresses reminders
- audit events emitted by workflows

## RLS Tests

Required for account-owned tables.

Verify one account cannot read or write another account's rows.

## Browser/UI Tests

Keep focused:

- dashboard shows overdue/due-soon/upcoming requirements
- global search opens an item and shows hand receipt context
- single-item upload 2062 flow
- multi-item upload 2062 flow
- app shell navigation on mobile and desktop

## Verification Commands

Phase 1 scaffold should establish exact commands. Expected command families:

```text
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
```

