# Domain Model

## Accounts

An account owns all user data. One login identity maps to exactly one owner
account, with room for multiple linked auth identities later.

Account records use an app-owned `accounts.id` as the product ownership id and
a unique `accounts.auth_user_id` mapping to the Better Auth user identifier.
That identifier is an opaque provider subject, not a Supabase UUID.

Account initialization is idempotent: repeated first-run checks for the same
auth identity return the existing account instead of resetting trial dates or
creating another ownership record.

New accounts initialize with:

- `access_state`: `trialing`
- `trial_starts_at`: first initialization time
- `trial_ends_at`: 30 days after trial start
- `onboarding_completed_at`: null until the first-run boundary notice is acknowledged
- `next_item_sequence`: the next account-local generated item identifier sequence

Account access state is separate from subscription tier.

- `trialing`
- `active`
- `paused_read_only`

Subscription tier is nullable while an account is trialing. When active, it is:

- `base`: up to 3 active hand receipts
- `pro`: unlimited active hand receipts

Capability checks live in the billing module so product workflows do not need
to know billing-provider details.

First-run onboarding is account-level state, not device-local state. The app
shows a short boundary notice until `onboarding_completed_at` is set. The
notice states that Field Ledger is for property accountability assistance, is
not an official Army system of record, and must not store classified
information, PHI, or sensitive operational details. Paused/read-only accounts
can acknowledge the notice, but the copy must make clear that new hand receipt
work waits until access is restored.

## Hand Receipts

A hand receipt is a bucket for property items.

Required:

- name

Optional:

- notes
- hand receipt number
- holder name
- unit name
- UIC
- effective date

Status:

- active
- archived

Archived hand receipts are hidden from day-to-day workflows.
Creation of a hand receipt emits `hand_receipt.created` through the audit
logger boundary. Editing a hand receipt emits `hand_receipt.updated` with the
changed field names in metadata. Archiving and restoring a hand receipt emit
`hand_receipt.archived` and `hand_receipt.restored`.

Activity is the user-readable surface over audit events. Hand receipt activity
labels are:

- `hand_receipt.created`: Hand receipt created
- `hand_receipt.updated`: Hand receipt updated
- `hand_receipt.archived`: Hand receipt archived
- `hand_receipt.restored`: Hand receipt restored

Activity reads are account-scoped. The general Activity route can show recent
account history, the dashboard shows a lower-priority recent activity section,
and hand receipt detail shows only recent events for that receipt. Activity UI
should show readable labels and receipt names when available, not raw action
strings, target type names, or database ids.

When item requirements exist, archived hand receipts should suppress contained
item reminders so inactive buckets do not create day-to-day requirement noise.

## Property Items

One property item record represents one physical item.

Required:

- nomenclature/item name
- hand receipt
- at least one identifier: ECN, serial number, or generated app ID

Optional:

- ECN
- serial number
- app-generated ID
- location
- manual signed-to contact when no active 2062 exists

Rules:

- Duplicate nomenclature is allowed.
- Duplicate ECN/serial warns but can be confirmed.
- Creating an item emits `item.created` with hand receipt and identifier metadata.
- Editing nomenclature, ECN, serial number, and notes emits `item.updated` with
  changed field metadata.
- Archiving an item emits `item.archived`, keeps the same item identity and
  history, and removes the item from normal active hand receipt workflows.
- Archived items remain linked to their hand receipt and stay deliberately
  reviewable through archived-record views.
- Restoring an archived item emits `item.restored` and returns the same item
  record to active workflows.
- Moving an active item between active hand receipts emits `item.moved`, keeps
  the same item record, generated ID, identifiers, notes, and item activity
  history, and changes only the current hand receipt relationship.
- Manual signed-to state stores `signed_to_contact_id` on the item and always
  references an account contact. It is never saved as free-text assignee data.
- Manual signed-to state cannot be assigned or changed while an item has active
  formal 2062 coverage.
- Assigning manual signed-to state emits `item.signed_to_assigned`; clearing it
  emits `item.signed_to_cleared`.
- Manual signed-to state is labeled as `No 2062` in item surfaces until formal
  2062 assignment conversion lands.
- Location state stores `location_id` on the item and optionally references an
  account location. Items can have no location.
- Changing or clearing location emits `item.location_changed`.
- Identifier edits cannot leave the item without ECN, serial number, or a
  generated app ID.
- Generated ID is permanent and human-friendly, such as `FL-000123`.
- Generated IDs are account-sequential and allocated from the account record.
- The Items route is global search by default. Normal search matches ECN, serial
  number, generated ID, nomenclature, hand receipt name, manual signed-to
  contact, and location across the account's active hand receipts and active
  items.
- Global search excludes archived items and archived hand receipts by default.
  A deliberate include-archived option expands the search to include archived
  item records and items that belong to archived hand receipts.
- Search results show hand receipt context and the strongest available
  identifier matches so users can confirm the correct property record before
  opening detail.
- An item with active 2062 coverage cannot move to another hand receipt until the
  active 2062 link is closed.
- Archiving an item with active 2062 coverage is a deliberate accountability
  action. The app warns the user, archives the item, closes only that item's
  active 2062 link, clears current signed-to state for that item, and preserves
  the linked document, closed link history, and item activity history.
- If archiving closes the final active item link on a 2062 assignment, the
  assignment closes so empty active assignments do not linger.
- When item requirements exist, archived items should suppress day-to-day
  requirement reminders while remaining available for historical review.

## Contacts

Contacts are account-wide lightweight assignee records.

Required:

- display name

Optional later:

- rank
- section/unit
- notes
- archived/inactive status

Manual signed-to fallback always references a contact. If the user types a new
name, create a contact with only display name. Creating a contact emits
`contact.created`.

## Locations

Locations are optional, reusable, account-wide records.

Required:

- name

Creating a location emits `location.created`. Locations can be created inline
from item create and edit flows, selected from existing account locations, or
cleared from an item when the place is unknown.

Optional later:

- building
- room
- section
- notes
- archived/inactive status

## Documents

Documents are account-owned records stored privately in Supabase Storage.

MVP document metadata:

- filename
- MIME type
- size in bytes
- storage path
- uploaded timestamp
- hand receipt

The storage path is app-generated as `{account_id}/{document_id}` so filenames
remain display metadata and cannot collide inside the private documents bucket.
Creating a document is a two-step workflow: the app first creates a private
signed upload URL, then persists metadata and emits `document.uploaded` only
after the browser file upload succeeds and the server verifies the storage
object exists at the expected path. The audit event uses lightweight metadata
only and must not store document contents.

Documents are preserved by default. Closing a 2062 or archiving an item/hand
receipt does not delete files.

## 2062 Assignments

A 2062 assignment represents a formal signed-out document workflow.

Required:

- account
- hand receipt
- contact
- primary document
- at least one linked item from the same hand receipt

Rules:

- One 2062 assignment belongs to one hand receipt.
- One item can have at most one active 2062 link.
- Items may have many historical closed 2062 links.
- Active 2062s list formal assignment records only. Manual signed-to state does
  not appear in the Active 2062s list because it has no DA Form 2062 document.
- 2062 coverage on item detail means current formal coverage plus historical
  closed links for that item.
- Hand receipt 2062 context means active formal assignments scoped to that hand
  receipt.
- Multi-item upload starts from hand receipt detail, uses one contact and one
  private document for the assignment, and links only selected active items from
  that hand receipt.
- Assignment item-link RLS also enforces same-hand-receipt scope so a row cannot
  connect an assignment to an item from another hand receipt.
- Uploading a 2062 for a manually signed-to item converts it to formal 2062 coverage.
- Closing a 2062 clears current signed-to state for linked items.
- Individual item links can be closed when one item is returned.
- Closing a whole 2062 assignment closes all active item links, clears current
  signed-to state for those items, and preserves the document plus closed link
  history.
- Closing one item link releases only that item. If at least one other active
  item link remains, the assignment stays active.
- Removing the final active item link closes the assignment so empty active
  assignments do not linger.
- Past return/close dates are allowed; future dates are blocked.

## Requirements

Requirements are item-level recurring obligations.

MVP interval options:

- weekly
- monthly
- quarterly
- semiannual
- annual
- custom days
- custom months

Rules:

- A requirement belongs to exactly one item and one account.
- Requirement creation happens from item detail and emits
  `requirement.created`.
- Requirement names, notes, interval type, and custom interval value can be
  edited from item detail.
- Requirement edits emit `requirement.updated` with changed-field metadata.
- Paused/read-only accounts can view requirements but cannot create or edit
  requirements.
- Pausing a requirement sets `paused_at`; resuming clears it. Pause writes are
  conditional on `paused_at` still being null, and resume writes are
  conditional on the stored `paused_at` still matching the timestamp read by
  the service. Stale concurrent operations fail with a state-changed conflict
  instead of overwriting the current lifecycle state.
- Requirement pause/resume audit events are recorded only after a successful
  lifecycle transition. Clients that receive a conflict should refetch the
  requirement before retrying or updating the visible state.
- Active requirements are listed on item detail by next due date.
- Due dates calculate from last completed date.
- Editing an interval recalculates next due from the latest completion date, or
  from the requirement creation date when no completion history exists.
- Completion creates permanent history.
- Item detail shows the three most recent completions inline and provides an
  expanded history view for the latest completion records without becoming a
  full audit browser.
- Editing requirement metadata must not rewrite completion history.
- Completion date defaults to today, allows past dates, blocks future dates.
- Completion can include optional notes.
- Completing a requirement emits `requirement.completed` and updates the next
  due date from the entered completion date.
- Next due date can be manually adjusted and audited.
- Manual next due adjustment changes only the next due date. It does not change
  the interval type, interval value, or completion history.
- Individual requirements can be paused and resumed. A paused requirement stays
  visible on item detail but is excluded from active requirement work and cannot
  be completed until resumed.
- Requirement pause state is timestamp-driven: `pausedAt` is set while the
  requirement is paused and cleared when it is resumed. Requirement `status`
  remains reserved for broader record lifecycle state, not the pause/resume
  toggle.
- Resuming a requirement returns it to active behavior unless its item or hand
  receipt is archived.
- Requirement next due adjustment, pause, and resume emit
  `requirement.next_due_adjusted`, `requirement.paused`, and
  `requirement.resumed`.
- Duplicate requirement names on the same item warn but are allowed during
  creation and edit.

Dashboard windows:

- overdue: before today
- due soon: today through 14 days
- upcoming: 15 through 30 days
- beyond 30 days: hidden from dashboard by default

Dashboard requirement sections appear before secondary dashboard context. Each
window keeps its own empty state so users can distinguish "no work in this
window" from "no requirement work exists."

## Activity and Audit

Meaningful state changes create audit events. Activity is the user-visible
version of that history. The Audit Log is the internal append-only record; the
Activity surface is the readable recent-history view derived from it.

Events include create/edit/archive/restore, assignment link/close, requirement complete, document upload, location/contact changes, and subscription access changes.

Future workflow slices must call the audit logger boundary from application
services for meaningful create, update, archive, restore, close, completion,
upload, and subscription access changes. Routes and UI components should read
Activity through the typed app API rather than writing audit records directly.
