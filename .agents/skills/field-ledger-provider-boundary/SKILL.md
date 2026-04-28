---
name: field-ledger-provider-boundary
description: Add or change Field Ledger provider integrations without leaking Supabase, Stripe, storage, email, notification, or import/export details into domain/UI code.
---

# Field Ledger Provider Boundary

Use this skill when work touches auth, account access, billing, file storage, audit logging, notifications, or import/export.

## Required Reading

1. `docs/architecture.md`
2. `docs/adr/0002-provider-boundaries.md`
3. `AGENTS.md`
4. Relevant module docs/tests

## Rules

- Define or use an app-owned boundary before calling an external provider.
- UI and domain modules must not call Supabase or Stripe directly.
- Keep adapters thin.
- Keep product rules in application services.
- Keep provider-specific webhook/event handling isolated.
- Add tests around capability decisions and adapter boundaries where practical.

## Billing Notes

- Stripe is the likely real provider.
- MVP fake billing should read minimal account/tier/trial state.
- Do not build fake checkout, fake invoices, or fake webhooks unless a slice explicitly needs them.

## Storage Notes

- Supabase Storage is the default implementation.
- Documents are private.
- Closing or archiving does not delete files.

## Stop Conditions

Stop before replacing the provider strategy, weakening RLS, or allowing direct provider calls from UI/domain code.

