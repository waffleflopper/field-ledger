# Audit Module

The audit module owns Field Ledger's internal audit logger boundary. Product
application services call this module when meaningful account-owned state
changes happen; routes and UI components do not write audit rows directly.

## Boundary

- `recordAuditEvent` records actor, account, action, target, timestamp, and
  small contextual metadata.
- `listRecentActivity` returns user-visible recent activity for the current
  account.
- `AuditRepository` is the application port. The Drizzle adapter is an
  infrastructure detail and should stay out of domain/UI code.
- The Drizzle adapter runs each operation inside an authenticated database
  session so RLS evaluates the current app user's `auth.uid()` claim. Do not
  remove that boundary or replace it with direct privileged database access.

## Actions

Current action names:

- `system.initialized`
- `account.onboarding_completed`

Future slices should add stable domain action names when they add real
workflows. Prefer names such as `hand_receipt.created`,
`hand_receipt.updated`, `hand_receipt.archived`, and
`hand_receipt.restored` over implementation-specific labels.

## Emission Expectations

Future hand receipt, item, requirement, contact, location, document, and 2062
assignment workflows must emit audit events for meaningful create, update,
archive, restore, close, completion, upload, and lifecycle changes.

Keep metadata useful but compact. Do not store classified information, PHI,
sensitive operational details, large snapshots, or provider-specific payloads
in audit metadata.

## Activity vs Audit Log

Activity is the readable product surface derived from audit events. The Audit
Log is the internal append-only record. MVP Activity should stay simple and
recent-focused; advanced filtering, export, and investigation tooling are not
part of this slice.
