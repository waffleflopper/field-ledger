# Audit Module

The audit module owns Field Ledger's internal audit logger boundary. Product
application services call this module when meaningful account-owned state
changes happen; routes and UI components do not write audit rows directly.

## Boundary

- `recordAuditEvent` records actor, account, action, target, timestamp, and
  small contextual metadata.
- `listRecentActivity` returns user-visible recent activity for the current
  account.
- `listTargetActivity` returns recent activity for one account-owned target,
  such as a hand receipt detail page.
- `AuditRepository` is the application port. The Drizzle adapter is an
  infrastructure detail and should stay out of domain/UI code.
- The Drizzle adapter runs each operation inside an authenticated database
  session so RLS evaluates the app-owned `app.current_auth_subject` setting.
  Do not remove that boundary or replace it with direct privileged database
  access.
- Workflows that need the domain write and audit event to commit atomically
  should run through the app-owned unit-of-work boundary. The unit of work
  supplies a transaction-scoped `AuditRepository`; domain repositories should
  not insert `audit_events` directly.

## Actions

Current action names:

- `system.initialized`
- `account.onboarding_completed`
- `assignment.closed`
- `assignment.created`
- `assignment_item_link.created`
- `assignment_item_link.removed`
- `contact.created`
- `document.uploaded`
- `hand_receipt.created`
- `hand_receipt.updated`
- `hand_receipt.archived`
- `hand_receipt.restored`
- `item.created`
- `item.archived`
- `item.moved`
- `item.restored`
- `item.signed_to_assigned`
- `item.signed_to_cleared`
- `item.location_changed`
- `item.updated`
- `location.created`
- `requirement.completed`
- `requirement.created`
- `requirement.next_due_adjusted`
- `requirement.paused`
- `requirement.resumed`
- `requirement.updated`

Future slices should add stable domain action names when they add real
workflows. Prefer stable domain lifecycle labels over implementation-specific
names.

Unknown action names must not be displayed raw in product UI. Use a generic
fallback label until a stable domain label is added.

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

Current Activity surfaces:

- `/app/activity`: broader account recent activity.
- `/app/dashboard`: low-priority recent activity below operational dashboard
  priorities.
- `/app/hand-receipts/[id]`: scoped recent activity for that hand receipt.
