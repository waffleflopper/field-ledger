# Domain Docs

Field Ledger uses a single-context domain-doc layout. The engineering skills should read the root project docs before changing behavior, architecture, terminology, or tests.

## Before Exploring, Read These

- `CONTEXT.md` at the repo root for the project's domain language and product shape.
- `UBIQUITOUS_LANGUAGE.md` at the repo root for canonical terminology and aliases to avoid.
- `docs/adr/` for architectural decisions relevant to the area being changed.
- `docs/prd/field-ledger-mvp-prd.md` when product scope or MVP behavior is relevant.

If a listed file is not relevant to the task, do not over-read. If a listed file is missing, proceed silently unless the task depends on it.

## Layout

```text
/
├── CONTEXT.md
├── UBIQUITOUS_LANGUAGE.md
├── docs/
│   ├── adr/
│   └── prd/
└── src/
```

There is no `CONTEXT-MAP.md` and no per-module context map today. Treat Field Ledger as one product context unless the repo later adds a root `CONTEXT-MAP.md`.

## Use Project Vocabulary

When an issue title, implementation plan, test name, or code comment names a domain concept, use the terms defined in `CONTEXT.md` and `UBIQUITOUS_LANGUAGE.md`.

Avoid drifting into clinic, PHI, official system-of-record, team workspace, or unit property-book language unless the docs explicitly change.

## Flag ADR Conflicts

If a proposed change contradicts an existing ADR, surface that conflict explicitly instead of silently overriding the decision.
