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
helpers such as `canCreateHandReceipt(capabilities, currentActiveCount)`.

UI workflows should use the typed tRPC boundary, currently
`billing.capabilities`, so client code does not need to know how access state or
tier data is stored.

## Provider Boundary

This slice does not add Stripe checkout, invoices, webhooks, a customer portal,
or fake subscription automation. The stored tier and access-state fields are the
app-owned capability inputs for MVP simulation and future Stripe integration.
