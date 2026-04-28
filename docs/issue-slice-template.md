# Field Ledger Slice Issue Template

Use this shape when converting PRDs/RFCs into vertical slice issues. It is designed to be consumed by `field-ledger-slice` and implemented with TDD where behavior is testable.

## Goal

What user or system outcome should this slice deliver?

## User Value

Why does this matter to the Field Ledger user?

## Scope

What is included?

## Out of Scope

What must not be included?

## Affected Modules

List expected modules, such as `items`, `hand-receipts`, `audit`, `billing`, or `requirements`.

## UI Surfaces

List affected routes/screens and how they relate to the mock-derived UI spec.

## Data Model Changes

List tables, fields, migrations, RLS policies, and seed data needs.

## Provider Boundary Impact

Does this touch auth, billing, file storage, notification, import/export, or another provider boundary?

## Behavior and Rules

State the business behavior in testable terms.

## TDD Plan

Name the tests that should fail first.

## Acceptance Criteria

- Criterion 1
- Criterion 2
- Criterion 3

## Docs Required

List docs/ADRs that must be updated.

## Verification

List commands/checks expected for completion.

## Stop Conditions

State when the agent must stop and ask for a decision.

