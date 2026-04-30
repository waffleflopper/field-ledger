# ADR 0002: Provider Boundaries

## Status

Accepted

## Context

Field Ledger uses Better Auth for auth/session behavior, Supabase Storage for
private files, Supabase Postgres for app data, and likely Stripe for billing.
The app should stay practical, but not smear vendor-specific calls through
domain and UI code.

## Decision

Provider integrations must sit behind internal boundaries:

- auth/session
- account access
- billing
- file storage
- audit logging
- notification
- import/export

Domain modules and UI routes must call app-owned services/ports, not Better
Auth, Supabase, or Stripe directly.

## Consequences

- Stripe can be added after simulated billing without rewriting product rules.
- Storage can use Supabase now while document behavior remains app-owned.
- Better Auth provider details stay mostly outside domain logic.
- Agents have clear places to change provider code.

## Rejected Alternatives

- Direct Better Auth, Stripe, or Supabase calls from UI components.
- A large fake billing simulation with invoices/webhooks/checkouts. MVP fake billing should stay minimal.
