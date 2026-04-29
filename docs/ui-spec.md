# UI Specification

The UI source of truth is the repo-local mockup file:

`mocks/HandReceipt Concepts _standalone_.html`

The original mock component export is also preserved under `mocks/HandReceipt/`.

Treat the mock as source of truth for layout, workflow, and route responsibility. Do not treat it as pixel-perfect styling law.

## Design Direction

- Professional field utility.
- Fast, sturdy, calm, and legible.
- Mobile-first, not mobile-only.
- Tablet and desktop must use available space intelligently.
- Avoid generic SaaS dashboard aesthetics and purple AI gradients.
- UI should support repeated operational use.

## Navigation

Phone:

- bottom nav
- Dashboard
- Items/Search
- Hand Receipts
- More

Tablet/desktop:

- collapsible left sidebar
- Dashboard remains home
- Active 2062s can be visible in sidebar or secondary nav

## Initial Route Map

```text
/app/dashboard
/app/items
/app/items/[itemId]
/app/items/[itemId]/upload-2062
/app/hand-receipts
/app/hand-receipts/[handReceiptId]
/app/hand-receipts/[handReceiptId]/upload-2062
/app/active-2062s
/app/contacts
/app/locations
/app/activity
/app/settings
/app/billing
```

Public/future routes can live outside `/app`, such as `/`, `/pricing`, `/login`, `/privacy`, and `/terms`.

## Mock-Derived Screens

The mock includes:

- Mobile dashboard
- Mobile item detail
- Mobile hand receipt detail
- Mobile upload 2062, multi-item flow
- Mobile upload 2062, single-item flow
- Desktop dashboard
- Desktop item management and search

## Dashboard Priority

1. Overdue and due-soon requirements
2. Quick actions
3. Signed-out items
4. Activity and other secondary context

Due windows:

- overdue: before today
- due soon: today through 14 days
- upcoming: 15 through 30 days
- beyond 30 days: hidden by default

## Key Workflows

### Upload 2062 From Hand Receipt

- Start from hand receipt.
- Select or create contact.
- Upload PDF/image document.
- Select one or more items from that hand receipt.
- Create active 2062 assignment.
- Update linked items' signed-to state.
- Emit audit events.

### Upload 2062 From Item

- Start from item detail.
- Default item is preselected.
- If item has manual signed-to contact, default contact to that person.
- Upload document.
- Create one-item 2062 assignment.
- Convert manual signed-to state to formal 2062 coverage.

### Close 2062

- Close all active item links by default.
- Allow past return date.
- Preserve document and history.
- Clear current signed-to state for linked items.

### Remove One Item From Multi-Item 2062

- Close only that item link.
- Keep assignment active if other items remain linked.
- Preserve item history and document.

## UI Constraints

- Item UI must work well with no item photo.
- Do not reserve a large permanent image slot for optional future photos.
- Manual signed-to items appear in signed-out surfaces but are clearly marked "No 2062" or equivalent.
- Active 2062s means formal 2062 assignments only.
