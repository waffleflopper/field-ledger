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

## Read-Only Enforcement Pattern

Read-only behavior is enforced in three layers:

1. Application services derive capabilities and block writes when
   `isReadOnly` is true.
2. tRPC routers translate read-only write attempts to `FORBIDDEN` responses
   with the canonical message `This account is read-only.`
3. Module UI queries `billing.capabilities` and disables, hides, or explains
   write actions while preserving record review.

Core property reads remain available for paused/read-only accounts. This
includes hand receipts, items, contacts, locations, search results, and
activity. Expired trials with no active plan resolve to the same read-only
capability behavior dynamically.

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
