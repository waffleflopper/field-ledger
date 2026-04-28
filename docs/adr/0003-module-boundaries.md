# ADR 0003: Domain Module Boundaries

## Status

Accepted

## Context

The app will grow through agent-assisted vertical slices. Without strong module ownership, business rules will drift into routes, UI components, and provider adapters.

## Decision

Use domain-first modules. Each major domain owns its behavior, validation, persistence access, tests, and domain-specific UI where appropriate.

Initial modules:

- accounts
- audit
- billing
- hand-receipts
- items
- contacts
- locations
- documents
- assignments-2062
- requirements
- import-export

Routes compose module UI and call tRPC procedures. tRPC calls application services.

## Consequences

- More structure upfront.
- Less long-term drift.
- Easier TDD slices.
- Agents can identify the right place for behavior.

## Rejected Alternatives

- Technical-layer folders as the primary structure, such as global `services`, `repositories`, and `validators`.
- Route-owned business logic.

