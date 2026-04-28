---
name: field-ledger-architecture-audit
description: Audit Field Ledger changes for module boundary drift, provider leakage, missing docs, missing audit events, route/UI drift, and insufficient tests.
---

# Field Ledger Architecture Audit

Use this skill before large PRs, after several feature slices, or when the user asks whether the codebase is drifting.

## Required Reading

1. `AGENTS.md`
2. `CONTEXT.md`
3. `docs/architecture.md`
4. `docs/domain-model.md`
5. `docs/ui-spec.md`
6. relevant ADRs

## Audit Checklist

- Domain behavior lives in modules, not routes.
- tRPC procedures call module application services.
- Provider calls stay behind boundaries.
- RLS exists for account-owned tables.
- Account access rules are centralized.
- Hand receipt limits are capability checks, not scattered UI conditions.
- Archive/close/pause is used instead of hard delete for accountable records.
- Meaningful workflows emit audit/activity events.
- UI work builds into the real app shell.
- Docs/ADRs match current behavior.
- Tests cover domain rules and high-risk workflows.

## Output

Lead with findings, ordered by severity. Include file/line references when code exists. If no issues are found, say so and note residual risk.

