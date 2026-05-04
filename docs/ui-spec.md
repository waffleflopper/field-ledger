# UI Specification

See root `PRODUCT.md` for strategic product/design principles and root
`DESIGN.md` for visual tokens, typography, component rules, and anti-patterns.

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
- More sheet groups secondary record surfaces separately from account surfaces,
  keeps Active 2062s visible in the Records group, and scrolls within the
  viewport when content grows.

Tablet/desktop:

- collapsible left sidebar
- Dashboard remains home
- Active 2062s can be visible in sidebar or secondary nav

Implementation note:

- The authenticated shell lives at the literal `/app` URL path through the
  protected Next route group.
- Phone navigation uses the bottom nav below the Tailwind `md` breakpoint.
- Tablet and desktop navigation use the collapsible sidebar at `md` and above.

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

`/app` redirects to `/app/dashboard`.

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

Paused/read-only accounts keep dashboard review access, but operational
requirement sections should not ask the user to complete active work. Use a
plain read-only notice instead of due-work calls to action.

## Read-Only UI Pattern

Use `billing.capabilities` as the UI source of truth for access gating. UI
gating explains the application-service rule; it does not replace server-side
enforcement.

- Detail pages should show an inline read-only banner near the page heading.
- Write buttons should be disabled or hidden where the action cannot start.
- Disabled controls should keep plain reasons near the control or in the
  native `title` where the existing component pattern uses titles.
- Existing records, archived history, search results, documents, 2062 context,
  and activity remain reviewable.
- `DashboardReadOnlyNotice` suppresses active requirement work tiles for
  read-only accounts.
- Requirement UI remains visible as review context, but create, edit, complete,
  pause, resume, and due-date adjustment controls are unavailable.
- Document UI keeps existing document review/download paths available, but
  upload entry points are unavailable.
- 2062 UI keeps active assignments and coverage history visible, but create,
  close, and remove-item-link controls are unavailable.

## Responsive Form Pattern

Form-heavy dialogs should stay within the phone viewport and scroll internally
when their fields exceed available height. Primary form actions must remain
reachable by scrolling the dialog, not by scrolling hidden page content behind
the overlay.

Step-based workflows should avoid tall stacked progress rails on phone. Use
compact horizontal rails or equivalent compressed progress indicators, with
full-width primary buttons where thumb reach matters.

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
- Block future return dates.
- Preserve document and history.
- Clear current signed-to state for linked items.

### Remove One Item From Multi-Item 2062

- Close only that item link.
- Keep assignment active if other items remain linked.
- Removing the last active item closes the assignment.
- Allow past return date and block future return dates.
- Preserve item history and document.

### Move Or Archive Covered Items

- Move dialog blocks items with active 2062 coverage and explains that the
  active item link must be closed before moving to another hand receipt.
- Archive dialog warns when an item has active 2062 coverage.
- Confirmed archive closes only that item's active 2062 link, preserves the
  document and history, and tells the user when the archived item is the final
  active link on the assignment.

## UI Constraints

- Item UI must work well with no item photo.
- Do not reserve a large permanent image slot for optional future photos.
- Manual signed-to items appear in signed-out surfaces but are clearly marked "No 2062" or equivalent.
- Active 2062s means formal 2062 assignments only.
