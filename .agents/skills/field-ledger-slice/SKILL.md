---
name: field-ledger-slice
description: Implement a Field Ledger vertical slice from a GitHub issue number or local slice file, using repo docs, module boundaries, and TDD where behavior is testable.
---

# Field Ledger Slice

Use this skill when the user says `field-ledger-slice #123` or `field-ledger-slice path/to/slice.md`.

## Resolve Input

- If input is `#123`, fetch and read the GitHub issue.
- If input is a file path, read that local slice file.
- Extract goal, scope, acceptance criteria, affected modules, UI surfaces, tests, docs, and stop conditions.

## Required Reading

Before editing:

1. `CONTEXT.md`
2. `AGENTS.md`
3. Relevant docs in `docs/`
4. Relevant ADRs in `docs/adr/`
5. The target modules and tests

## TDD Workflow

Use the `tdd` skill where behavior is testable.

1. Write or identify the failing test.
2. Implement the smallest behavior that passes.
3. Refactor inside the relevant module boundary.
4. Add integration/UI tests only where the slice needs them.

## Implementation Rules

- Build into the real app shell.
- Keep routes thin.
- Keep business behavior in module application/domain code.
- Use provider boundaries for Supabase, Stripe, storage, email, notifications, import/export, and audit.
- Emit audit/activity events for meaningful state changes.
- Update docs if behavior, terms, routes, modules, or boundaries change.

## Stop Conditions

Stop and ask before:

- changing auth, billing, storage, app shell, or module strategy
- weakening RLS
- adding collaboration/team ownership
- adding a new grouping system
- implementing offline editing
- expanding scope beyond the issue

## Closeout

Report:

- changed files
- behavior delivered
- tests/checks run
- docs updated
- follow-ups or deferred scope

