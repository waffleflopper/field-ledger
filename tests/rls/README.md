# RLS Tests

RLS tests connect to local Supabase Postgres, seed two owners as the privileged
migration user, then run read/write probes as the `authenticated` role with
`app.current_auth_subject` set to one opaque Better Auth subject.

That pattern proves account ownership is enforced by the app-owned session
context instead of Supabase Auth UUIDs. Each table-level test proves one account
cannot read or write another account's rows. Repository-level tests prove
runtime adapters execute through the authenticated database-session boundary
instead of privileged database access.

## Coverage

- `accounts`: owner row read/update isolation for the login-to-account mapping.
- `audit`: audit event table isolation plus audit repository isolation.
- `hand-receipts`: hand receipt table isolation plus repository isolation for
  create/update/archive/restore behavior.
- `items`: item table isolation, owner-scoped insert/update, archived reads,
  signed-to contact links, location links, and hand receipt links.
- `contacts`: contact table read/insert/update isolation.
- `locations`: location table read/insert/update isolation.
- `requirements`: requirement table isolation, requirement-completion table
  isolation, and repository isolation for requirement and completion adapters.
- `documents`: document table isolation, hand receipt/document relationship
  checks, storage path ownership, and repository isolation.
- `assignments-2062`: formal 2062 assignment and assignment-item-link
  isolation, close-state constraints, same-hand-receipt link checks, and
  cross-account relationship blocking.

Repository-level RLS tests currently exist for audit events, hand receipts,
documents, requirements, and requirement completions.

## Relationship Protection

Field Ledger uses two database patterns to prevent cross-account relationships:

- RESTRICTIVE RLS policies add extra insert/update checks on a table. `items`
  uses this for `signed_to_contact_id` and `location_id`. Item hand receipt
  ownership is checked in the item owner insert/update policies.
- Composite foreign keys include `account_id` in the referenced key.
  `assignments` and `assignment_item_links` use this for hand receipt, contact,
  document, assignment, and item relationships.

Both patterns keep linked records inside the same owner account. Tests should
cover the user-visible result, whether the database rejects the write through an
RLS policy or a foreign key constraint.
