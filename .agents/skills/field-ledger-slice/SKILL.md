---
name: field-ledger-slice
description: Implement a Field Ledger vertical slice from a GitHub issue number or local slice file, using repo docs, module boundaries, and TDD where behavior is testable.
---

# Field Ledger Slice

Use this skill when the user says `field-ledger-slice #123` or `field-ledger-slice path/to/slice.md`.

## Resolve Input

- If input is `#123`, fetch and read the GitHub issue, including comments.
- If input is a file path, read that local slice file.
- Extract goal, scope, acceptance criteria, affected modules, UI surfaces, tests, docs, and stop conditions.

## Issue Comments and CodeRabbit Plans

Some `needs-triage` issues may include CodeRabbit comments with a proposed
implementation plan. Treat those comments as advisory review input, not as a
step-by-step guide or source of truth.

When a CodeRabbit plan exists:

1. Read it before implementation.
2. Compare it against the issue body, parent PRD, `AGENTS.md`, relevant docs,
   ADRs, and Field Ledger module/provider rules.
3. Use any helpful observations only when they fit those sources of truth.
4. Ignore or correct suggestions that would put business rules in routes,
   call Supabase/Stripe directly from UI or domain code, create fake product
   workflows, skip RLS/tests/docs, or expand beyond the slice.
5. Mention in closeout whether CodeRabbit feedback was used, corrected, or not
   applicable.

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
