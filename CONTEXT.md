# Field Ledger Context

Field Ledger is a subscription-ready personal property-accountability tool for individual Army users who manage sub-hand receipts and assigned property.

## Core User

The primary user is an individual hand receipt or sub-hand receipt holder who needs a fast way to answer:

- What property do I have?
- Where is it?
- Who is it signed to?
- What 2062s are active?
- What item-level requirements are overdue or coming due?

The product is individual-first. It is not a team workspace, unit property book, commander cyclic inventory system, or clinic-specific tool.

## Core Product Shape

- One owner account has many hand receipts.
- Each hand receipt is a bucket of property items with optional formal metadata.
- One item record represents one physical accountable item.
- Items require at least one identifier: ECN, serial number, or app-generated ID.
- Contacts and locations are reusable account-level records.
- A 2062 assignment belongs to one hand receipt, one contact, one document, and one or more items from that hand receipt.
- Requirements are item-level recurring obligations with completion history.
- Activity/audit history is recorded from the start and surfaced simply in MVP.

## MVP Priorities

- Real mobile-first product shell, not a demo route.
- Dashboard priority: overdue/upcoming requirements, quick actions, signed-out items.
- Global search across all hand receipts, with hand receipt context shown in results.
- Phone uses bottom navigation. Tablet/desktop uses a collapsible left sidebar.
- MVP is online-first. Offline read cache is reserved for later.

## Subscription Direction

- Launch direction is 30-day trial, then paid subscription required.
- Trial has Pro-like access.
- Base allows up to 3 active hand receipts.
- Pro allows unlimited active hand receipts.
- Expired trial with no active subscription becomes account-paused/read-only.
- Stripe is the likely billing provider, but billing must stay behind an internal boundary.

## Compliance Boundary

Field Ledger is not an official Army system of record. Users should not store classified information, PHI, or sensitive operational details. The app is for property-accountability assistance only.

