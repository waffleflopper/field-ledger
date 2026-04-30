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

Archived hand receipts are hidden from day-to-day workflows and suppress contained item reminders.
Creation of a hand receipt emits `hand_receipt.created` through the audit
logger boundary. Later edit, archive, and restore slices should emit matching
stable hand receipt action names.

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
- ECN/serial edits are allowed and audited.
- Generated ID is permanent and human-friendly, such as `FL-000123`.
- Item with active 2062 cannot move to another hand receipt until the active 2062 link is closed.

## Contacts

Contacts are account-wide lightweight assignee records.

Required:

- display name

Optional later:

- rank
- section/unit
- notes
- archived/inactive status

Manual signed-to fallback always references a contact. If the user types a new name, create a contact with only display name.

## Locations

Locations are optional, reusable, account-wide records.

Required:

- name

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
- size
- storage path
- uploaded timestamp

Documents are preserved by default. Closing a 2062 or archiving an item/hand receipt does not delete files.

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
- Uploading a 2062 for a manually signed-to item converts it to formal 2062 coverage.
- Closing a 2062 clears current signed-to state for linked items.
- Individual item links can be closed when one item is returned.
- Past return/close dates are allowed; future dates are blocked or warned.

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

- Due dates calculate from last completed date.
- Completion creates permanent history.
- Completion date defaults to today, allows past dates, blocks future dates.
- Completion can include optional notes.
- Next due date can be manually adjusted and audited.
- Duplicate requirement names on the same item warn but are allowed.

Dashboard windows:

- overdue: before today
- due soon: today through 14 days
- upcoming: 15 through 30 days
- beyond 30 days: hidden from dashboard by default

## Activity and Audit

Meaningful state changes create audit events. Activity is the user-visible
version of that history. The Audit Log is the internal append-only record; the
Activity surface is the readable recent-history view derived from it.

Events include create/edit/archive/restore, assignment link/close, requirement complete, document upload, location/contact changes, and subscription access changes.

Future workflow slices must call the audit logger boundary from application
services for meaningful create, update, archive, restore, close, completion,
upload, and subscription access changes. Routes and UI components should read
Activity through the typed app API rather than writing audit records directly.
