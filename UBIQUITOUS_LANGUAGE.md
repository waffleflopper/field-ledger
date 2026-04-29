# Ubiquitous Language

## Product and Scope

| Term | Definition | Aliases to avoid |
| --- | --- | --- |
| **Field Ledger** | The personal subscription web app for individual Army property-accountability management. | HandReceipt app, property app, clinic app |
| **Property Accountability** | The practice of tracking assigned property, its identifiers, location, assignment state, supporting documents, and item-level requirements. | Inventory management, asset management |
| **Individual Holder** | The person using Field Ledger to manage their own hand receipts and property records. | Organization admin, unit manager |
| **Official System of Record** | An official Army system or process that Field Ledger does not replace. | Field Ledger, source of truth |
| **MVP** | The first personally useful version of Field Ledger that supports real hand receipt, item, requirement, activity, and 2062 workflows. | Prototype, demo, vertical-slice page |

## Ownership and Access

| Term | Definition | Aliases to avoid |
| --- | --- | --- |
| **User** | The authenticated person signing in to Field Ledger. | Contact, assignee |
| **Account** | The owner container for one user's Field Ledger data and subscription access. | Organization, workspace, team |
| **Auth Identity** | A sign-in method linked to a user account. | Account, contact |
| **Access State** | The operational state that determines whether an account can use active workflows. | Subscription tier |
| **Trial** | A 30-day Pro-like evaluation period for a new account. | Free plan |
| **Paused Account** | An account state where existing data remains viewable but active workflows are read-only. | Archived account, locked account |
| **Base Tier** | The paid tier that allows up to three active hand receipts. | Free tier, standard plan |
| **Pro Tier** | The paid tier that allows unlimited active hand receipts. | Unlimited mode |
| **Onboarding Notice** | The first-run app-shell notice that records the user's acknowledgement of Field Ledger's product boundary. | Tour, setup wizard |
| **Boundary Notice** | The compliance-facing copy that states Field Ledger is for property accountability assistance, is not an official Army system of record, and must not store classified information, PHI, or sensitive operational details. | Legal modal, disclaimer wall |

## Property Records

| Term | Definition | Aliases to avoid |
| --- | --- | --- |
| **Hand Receipt** | A user-owned bucket of property items with a required name and optional formal metadata. | Ledger, category, section |
| **Active Hand Receipt** | A hand receipt that participates in normal search, dashboard, item, and reminder workflows. | Open receipt |
| **Archived Hand Receipt** | A hand receipt preserved for history but removed from normal day-to-day workflows. | Deleted hand receipt |
| **Item** | One physical accountable property item tracked in Field Ledger. | Line item, quantity row, asset |
| **Property Item** | The formal domain term for an item record representing one physical accountable item. | Inventory line, equipment row |
| **Nomenclature** | The item name or official descriptive label used to identify the type of property. | Product name, title |
| **ECN** | A user-entered equipment control number or local identifier for a property item. | Item ID, generated ID |
| **Serial Number** | A manufacturer or official serial identifier for a property item. | ECN, generated ID |
| **Generated ID** | A permanent Field Ledger-created human-friendly item identifier used when ECN or serial number is unavailable. | UUID, ECN |
| **Duplicate Identifier Warning** | A warning shown when ECN or serial number matches another item but does not hard-block the user. | Validation error, duplicate name warning |

## People and Places

| Term | Definition | Aliases to avoid |
| --- | --- | --- |
| **Contact** | An account-wide lightweight person record used for signed-to and 2062 assignment workflows. | User, account, customer |
| **Assignee** | The contact currently responsible for an item through manual signed-to state or active 2062 coverage. | User, owner |
| **Manual Signed-To** | Current signed-out state that references a contact without formal 2062 coverage. | Free-text assignee, active 2062 |
| **Location** | An optional account-wide place record that describes where an item is kept. | Section, category, hand receipt |

## Documents and 2062 Lifecycle

| Term | Definition | Aliases to avoid |
| --- | --- | --- |
| **Document** | An account-owned private uploaded file record with metadata and storage location. | Attachment, 2062 |
| **2062** | The user-facing shorthand for a DA Form 2062 document or workflow context. | Signed-out document, sub-hand receipt |
| **2062 Assignment** | A formal signed-out property assignment linking one hand receipt, one contact, one document, and one or more items. | Document, manual signed-to |
| **Active 2062** | A 2062 assignment with at least one active item link. | Signed-out item, manual assignment |
| **Closed 2062** | A 2062 assignment preserved in history after all active item links are closed. | Deleted 2062, destroyed 2062 |
| **2062 Item Link** | The relationship between a 2062 assignment and one covered item. | Attachment, item assignment |
| **Single-Item 2062 Flow** | The quick upload workflow started from one item detail screen. | Multi-item upload |
| **Multi-Item 2062 Flow** | The hand receipt-level upload workflow that links one 2062 to multiple items from that hand receipt. | Bulk edit, cross-receipt 2062 |
| **Return Date** | The effective date an item or 2062 assignment is recorded as returned or closed. | Audit timestamp |

## Requirements and Dashboard

| Term | Definition | Aliases to avoid |
| --- | --- | --- |
| **Requirement** | An item-level recurring obligation such as maintenance, inspection, calibration, or replacement. | Reminder, task, cyclic inventory |
| **Requirement Completion** | A permanent record that a requirement was completed on a date, with optional notes. | Due date update |
| **Next Due Date** | The date a requirement is next due, calculated from the last completion unless manually adjusted. | Reminder date |
| **Overdue** | A requirement state where the next due date is before today. | Late task |
| **Due Soon** | A requirement state where the next due date is today through 14 days from today. | Upcoming |
| **Upcoming** | A requirement state where the next due date is 15 through 30 days from today. | Due soon |
| **Suppressed Requirement** | A requirement hidden from active dashboard work because its item or hand receipt is archived or the account is paused. | Deleted requirement |
| **Cyclic Inventory** | A commander or property book office inventory process that Field Ledger does not manage in MVP. | Requirement |

## History and Lifecycle

| Term | Definition | Aliases to avoid |
| --- | --- | --- |
| **Activity** | User-visible recent history summarizing meaningful changes. | Audit log, notification |
| **Audit Log** | The internal accountability record of meaningful state changes. | Activity feed only |
| **Audit Event** | One recorded change with actor, action, target, timestamp, and context. | Log line |
| **Archive** | A reversible lifecycle action that removes a record from normal workflows while preserving history. | Delete |
| **Restore** | A lifecycle action that returns an archived record to active workflows. | Recreate |
| **Close** | A lifecycle action that ends a 2062 assignment or item link while preserving history and documents. | Delete, destroy, deactivate |
| **Pause** | A lifecycle action that suppresses requirement behavior without deleting the requirement. | Archive, complete |

## Future Boundaries

| Term | Definition | Aliases to avoid |
| --- | --- | --- |
| **Import/Export** | The future module boundary for CSV/XLSX import, export, validation, preview, and report output. | Screen-specific spreadsheet script |
| **Offline Read Cache** | A future read-only capability for recently viewed data when disconnected. | Offline editing |
| **QR Code** | A future scannable code that opens an authenticated item route. | Public item data |
| **OCR** | A future text-recognition capability for uploaded documents. | MVP upload |
| **Report** | A future exportable or dedicated view for grouped operational data. | Dashboard |

## Relationships

- One **Account** owns many **Hand Receipts**.
- One **Hand Receipt** contains many **Items**.
- One **Item** belongs to exactly one **Hand Receipt** at a time.
- One **Item** represents exactly one physical piece of property.
- One **Account** owns many **Contacts** and many **Locations**.
- One **Manual Signed-To** state references exactly one **Contact**.
- One **2062 Assignment** belongs to exactly one **Hand Receipt**.
- One **2062 Assignment** requires exactly one **Contact**.
- One **2062 Assignment** references exactly one primary **Document** in MVP.
- One **2062 Assignment** links to one or more **Items** from its **Hand Receipt**.
- One **Item** can have at most one active **2062 Item Link**.
- One **Item** can have many historical closed **2062 Item Links**.
- One **Item** can have many **Requirements**.
- One **Requirement** can have many **Requirement Completions**.
- One **Audit Event** belongs to one **Account** and may reference a target such as a **Hand Receipt**, **Item**, **Contact**, **Location**, **Document**, **2062 Assignment**, or **Requirement**.
- An **Archived Hand Receipt** suppresses active dashboard behavior for contained **Items** and **Requirements**.
- A **Paused Account** preserves data but blocks active workflow changes.

## Example Dialogue

> **Dev:** "If a user types a name into the signed-to field, should we store it as free text on the **Item**?"
>
> **Domain expert:** "No. That becomes **Manual Signed-To**, and it must reference a **Contact**. If the **Contact** does not exist, create one with just display name."
>
> **Dev:** "If they later upload a **2062** for that same **Item**, does the manual state stay?"
>
> **Domain expert:** "No. The upload creates a **2062 Assignment**, links the **Item**, and formal **2062** coverage becomes the current signed-out state."
>
> **Dev:** "And when the property comes back?"
>
> **Domain expert:** "You **Close** the **2062 Assignment** or the specific **2062 Item Link**. The **Document** and **Audit Events** stay preserved."

## Flagged Ambiguities

- "Account" must mean the user-owned data and subscription container, not an organization or team workspace.
- "User" must mean the authenticated person, not the contact an item is signed to.
- "Contact" must mean an assignee record, not a login identity.
- "Item" must mean one physical accountable item, not a quantity-based line item.
- "2062" can appear in UI copy as "Upload 2062," "Active 2062s," or "Covered by 2062"; the canonical domain concept is **2062 Assignment** when referring to the formal workflow record.
- "Close" should be used for ending a **2062 Assignment**; avoid "destroy" because documents and history are preserved.
- "Archive" should be used for hand receipts/items leaving active workflows; avoid "delete" for accountable records.
- "Requirement" should be used for item-level recurring obligations; avoid "cyclic inventory," which is explicitly out of MVP scope.
- "Due Soon" and "Upcoming" are distinct dashboard windows: **Due Soon** is today through 14 days, while **Upcoming** is 15 through 30 days.
- "Activity" is the user-visible surface; **Audit Log** is the internal accountability record.
