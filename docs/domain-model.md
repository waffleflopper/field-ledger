# Domain Model

## Accounts

An account owns all user data. One login identity maps to one account, with room for multiple linked auth identities later.

Account access state is separate from subscription tier.

- `trialing`
- `active`
- `paused_read_only`

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

Meaningful state changes create audit events. Activity is the user-visible version of that history.

Events include create/edit/archive/restore, assignment link/close, requirement complete, document upload, location/contact changes, and subscription access changes.

