# ADR 0005: Better Auth Provider

## Status

Accepted

## Context

Phase 1 established the first auth/session implementation behind an app-owned
provider boundary using Supabase Auth. Review before continuing the next auth
and account slices showed that Field Ledger needs stronger app ownership of the
auth schema, session behavior, and future migration path than Supabase Auth
comfortably provides.

Supabase remains the chosen Postgres, Storage, RLS, and local development
platform. This decision changes the auth/session provider only.

## Decision

Use Better Auth as the selected auth/session provider for Field Ledger.

Auth/session behavior must still stay behind the app-owned provider boundary.
Routes, UI, domain modules, and account services should depend on Field
Ledger-owned session/account concepts rather than Better Auth APIs directly.

The auth provider user identifier is an opaque provider subject. The schema
language is `auth_user_id`, not `user_id`, for columns that store the provider's
user id.

RLS remains required for account-owned data. Because Supabase Auth is no longer
the auth-provider contract, future RLS policies must use application-set session
context, such as a transaction-scoped `set_config()` value, rather than relying
on `auth.uid()`.

## Consequences

- Supabase Postgres, Supabase Storage, Drizzle migrations, and local Supabase
  development remain in place.
- Better Auth details must be isolated behind the auth/session provider
  boundary.
- Account ownership continues to use the app-owned `accounts.id` primary key,
  not the auth provider id.
- Auth identity columns use `auth_user_id` and model that value as an opaque
  string from Better Auth.
- Future account-owned repositories must execute through a database-session
  boundary that sets the current auth/account context before RLS policies run.
- This ADR records the decision only; it does not implement Better Auth or
  migrate the existing Supabase Auth code path.

## Rejected Alternatives

- Continue with Supabase Auth: simpler while Supabase is already used for
  Postgres and Storage, but it gives Field Ledger less control over auth schema,
  session behavior, and long-term provider migration.
- Expose Better Auth directly to routes and UI: faster initially, but it would
  violate the provider-boundary rule and make later provider changes harder.
