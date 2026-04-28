# AI Change Guidelines

This repo is designed for agent-assisted development. Agents must preserve product intent and architecture, not just make tests pass.

## Before Editing

1. Read `CONTEXT.md`.
2. Read the relevant docs under `docs/`.
3. Read any ADRs that affect the slice.
4. Identify affected domain modules.
5. If implementing an issue, use `field-ledger-slice`.

## During Implementation

- Keep the change inside the smallest relevant vertical slice.
- Build into the real app shell.
- Add or update tests before or alongside behavior.
- Update docs if behavior, terminology, or boundaries change.
- Do not bypass provider boundaries.
- Do not put business rules in UI routes.
- Do not hard-delete accountable records unless the slice explicitly allows it.

## Ask Before Proceeding

Stop and ask if the slice requires:

- adding collaboration/team accounts
- changing auth, billing, storage, database, or app shell strategy
- weakening RLS
- changing the product compliance boundary
- creating a new grouping concept such as tags/categories
- adding offline editing
- replacing core terminology

## Closeout Expectations

Every implementation closeout should include:

- what changed
- tests/checks run
- docs updated
- deferred follow-ups, if any

