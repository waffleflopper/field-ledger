# Billing Capabilities

Field Ledger models account access as product capabilities. Workflows should ask
the billing module what an account can do instead of checking Stripe,
subscription rows, or route-local flags directly.

## Access States

- `trialing`: The account is inside its 30-day trial window. Trial access is
  Pro-like.
- `active`: The account has an active plan. Capability limits come from the
  subscription tier.
- `paused_read_only`: The account can still review existing data, but write
  workflows should be blocked or disabled.

Expired trial accounts with no active plan resolve to read-only capability
behavior even if the stored access state has not yet been updated.

## Subscription Tiers

- `base`: Allows up to 3 active hand receipts. Archived hand receipts do not
  count against this active limit.
- `pro`: Allows unlimited active hand receipts.

Subscription tier is separate from access state. A trial account can have no
subscription tier and still receive Pro-like trial capabilities until the trial
expires.

## Capability Boundary

The public module API is exported from `src/modules/billing`.

Server workflows can call `deriveAccountCapabilities(account)` and decision
helpers such as `canCreateHandReceipt(capabilities, currentActiveCount)`,
`canArchiveHandReceipt(capabilities)`, and
`canRestoreHandReceipt(capabilities, currentActiveCount)`.

UI workflows should use the typed tRPC boundary, currently
`billing.capabilities`, so client code does not need to know how access state or
tier data is stored.

`billing.status` is the display query for `/app/billing`. It returns the same
capability result plus the account trial window so the UI can explain the
current state without duplicating capability rules or reading billing storage
directly. `billing.capabilities` remains the enforcement query for operational
feature gating.

## MVP Account Surfaces

`/app/billing` is a read-only account-access surface. It shows the current access
state, subscription tier when present, active/read-only trial status, and hand
receipt capability context. It must not add Stripe checkout, invoices, customer
portal links, webhooks, or fake billing automation.

`/app/settings` exposes the signed-in owner email, access/read-only state,
session sign-out, and product-boundary messaging. The settings surface reminds
users that Field Ledger is personal property-accountability assistance, not an
official Army system of record, and that classified information, PHI, and
sensitive operational details do not belong in the app.

## Read-Only Enforcement Pattern

Read-only behavior is enforced in three layers:

1. Application services derive capabilities and block writes when
   `isReadOnly` is true.
2. tRPC routers translate read-only write attempts to `FORBIDDEN` responses
   with the canonical message `This account is read-only.`
3. Module UI queries `billing.capabilities` and disables, hides, or explains
   write actions while preserving record review.

Core operational reads remain available for paused/read-only accounts. This
includes hand receipts, items, contacts, locations, search results,
requirements and completion history, document metadata and downloads, active
2062 assignments, closed 2062 coverage history, and activity. Expired trials
with no active plan resolve to the same read-only capability behavior
dynamically.

Read-only write blocking applies to the remaining MVP operational workflows:

- Requirements: create, edit, complete, pause, resume, and next-due adjustment
  actions are blocked while list and completion-history reads remain available.
- Documents: upload initiation and upload completion are blocked while existing
  document list, metadata, and download reads remain available.
- Formal 2062s: assignment creation, whole-assignment close, and individual
  item-link removal are blocked while active assignment and item coverage reads
  remain available.

## Capability Helpers

- `isAccountReadOnly`: checks whether an account is in read-only capability
  mode.
- `getActiveHandReceiptLimit`: returns the current active hand receipt limit, or
  unlimited when the value is `null`.
- `canCreateHandReceipt`: allows creation only when the account is writable and
  the active hand receipt limit has room.
- `canRestoreHandReceipt`: uses the same writable account and active limit rule
  as hand receipt creation.
- `canArchiveHandReceipt`: blocks lifecycle archive actions for read-only
  accounts.
- `canMoveItem`: blocks item moves for read-only accounts.
- `canCreateRequirement`: blocks requirement creation for read-only accounts.
- `canEditRequirement`: blocks requirement edit and lifecycle actions for
  read-only accounts.
- `canUploadDocument`: blocks private document upload for read-only accounts.
- `canClose2062Assignment`: blocks whole-assignment close actions for read-only
  accounts.
- `canRemove2062ItemLink`: blocks individual 2062 item-link removal for
  read-only accounts.

## Provider Boundary

This slice does not add Stripe checkout, invoices, webhooks, a customer portal,
or fake subscription automation. The stored tier and access-state fields are the
app-owned capability inputs for MVP simulation and future Stripe integration.
