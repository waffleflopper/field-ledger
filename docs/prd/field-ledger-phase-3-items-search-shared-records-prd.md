# PRD: Field Ledger Phase 3 - Items, Search, Contacts, and Locations

## Problem Statement

Field Ledger now has the product foundation for signed-in use, account access,
audit/activity, and hand receipt management. The next part is the core property
record workflow: users need to put real accountable items into those hand
receipts, find them without remembering which bucket they live in, and reuse the
people and places that describe item accountability.

Without this phase, hand receipts remain empty buckets. The app cannot yet
answer the most important day-to-day property questions: what item do I have,
where is it, which hand receipt is it under, and who currently has it? The user
would still be forced back into memory, spreadsheets, or scattered notes for the
actual property records.

This phase also needs to protect the domain model before the 2062 and
requirements phases arrive. One item record must mean one physical accountable
item. Every item needs at least one stable identifier. Manual signed-to state
must reference a reusable contact rather than free text. Locations must be
reusable account-level records instead of one-off strings. Search must be global
across hand receipts, because users often remember an ECN, serial number,
nomenclature, contact, or location before they remember the right hand receipt.

Field Ledger remains a personal Army property-accountability tool for one owner
account managing many hand receipts. It is not an official Army system of
record, not a unit workspace, and not a place for classified information, PHI,
or sensitive operational details.

## Solution

Phase 3 will add property item management, global item search, lightweight
contacts, manual signed-to state, and reusable locations inside the real app
shell.

Users will be able to create items inside a selected hand receipt. Each item
will require nomenclature and a hand receipt. Each item must have at least one
stable identifier: ECN, serial number, or a generated Field Ledger ID. Generated
IDs will be permanent, human-friendly, account-sequential, and searchable so
users can track items even when no ECN or serial number is available. Duplicate
nomenclature will be allowed. Duplicate ECN or serial number will warn the user
but remain confirmable because real property records can be messy.

Users will be able to view and edit item details over time. Identifier changes
must keep the item valid and emit audit events. Item detail should work well
without photos and should leave stable room for later requirements and 2062
sections without implementing those workflows in this phase.

Users will be able to archive, restore, and move items between their hand
receipts. Archive will remove an item from normal active workflows without
deleting history. Restore will return it to active workflows. Move will update
which hand receipt owns the item while preserving audit history. Because formal
2062 assignments are not implemented until a later phase, this phase should
leave a clear constraint hook for the future rule that an item with active 2062
coverage cannot move to another hand receipt until that coverage is closed.

The Items surface will become global search by default. Normal search will
search across active hand receipts and active items by ECN, serial number,
generated ID, nomenclature, hand receipt name, location, and signed-to contact.
Results will show the hand receipt context and the strongest matching
identifiers so the user can understand the result without opening every record.
Archived items and archived hand receipts will be excluded by default, with a
deliberate option to include archived items and items that belong to archived
hand receipts.

Contacts and locations will be account-wide, lightweight shared records.
Contacts require only display name and are used for manual signed-to state now
and 2062 assignments later. Manual signed-to state must always reference a
contact record. If the user types a new signed-to name, Field Ledger should
create a contact instead of saving a free-text assignee.
Existing contacts should be suggested to reduce accidental duplicates.
Locations require only name, are optional for items, and can be reused across
hand receipts. Location changes and manual signed-to changes are meaningful
accountability events and should be audited.

Paused/read-only accounts can view items, contacts, locations, manual signed-to
state, and search results, but cannot create, edit, archive, restore, move, or
assign records.

## User Stories

1. As an individual Army property holder, I want to create property items inside a hand receipt, so that my hand receipt buckets contain the actual property I manage.
2. As a user, I want item creation to happen inside the real Field Ledger app shell, so that the workflow feels like part of the product rather than a setup demo.
3. As a user, I want each item to belong to one hand receipt, so that every property record has a clear current bucket.
4. As a user, I want one item record to represent one physical accountable item, so that location, assignment, requirements, and history stay understandable.
5. As a user, I want nomenclature to be required, so that each item has a human-readable property description.
6. As a user, I want ECN to be optional but supported, so that I can track local identifiers when they exist.
7. As a user, I want serial number to be optional but supported, so that serialized property can be tracked accurately.
8. As a user, I want every item to have ECN, serial number, or generated ID, so that no item exists without a stable identifier.
9. As a user, I want to generate an app ID when ECN and serial number are unavailable, so that I can still track the item.
10. As a user, I want generated IDs to be permanent, so that labels, references, and search results do not break later.
11. As a user, I want generated IDs to be human-friendly, so that I can read and communicate them without copying a long technical ID.
12. As a user, I want generated IDs to be account-sequential, so that they feel orderly inside my own account without implying global official numbering.
13. As a user, I want generated IDs to be searchable, so that I can quickly find an item even without ECN or serial data.
14. As a user, I want duplicate nomenclature to be allowed, so that I can track many of the same item type.
15. As a user, I want duplicate ECN warnings, so that I can catch likely data mistakes.
16. As a user, I want duplicate serial number warnings, so that I can catch likely data mistakes.
17. As a user, I want duplicate ECN or serial number warnings to be confirmable, so that messy real-world records do not block me.
18. As a user, I want item creation to emit activity, so that the start of a property record is preserved.
19. As a user, I want to open item detail from a hand receipt, so that I can inspect the property record in context.
20. As a user, I want to open item detail from search results, so that finding an item leads directly to the record.
21. As a user, I want item detail to show the hand receipt context, so that I always know which bucket owns the item.
22. As a user, I want item detail to work well without photos, so that the MVP does not depend on future media features.
23. As a user, I want item detail to leave room for later requirements, so that recurring obligations can land naturally in a future phase.
24. As a user, I want item detail to leave room for later 2062 sections, so that formal assignment coverage can land naturally in a future phase.
25. As a user, I want to edit item nomenclature, so that I can correct or refine records over time.
26. As a user, I want to edit ECN, so that identifier mistakes can be corrected.
27. As a user, I want to edit serial number, so that serialized property records can be corrected.
28. As a user, I want identifier edits to keep the item valid, so that an item cannot accidentally lose all stable identifiers.
29. As a user, I want identifier edits to emit activity, so that important accountability corrections are visible.
30. As a user, I want to add and edit item notes when notes exist in the slice, so that useful context can be preserved without becoming sensitive operational detail.
31. As a user, I want to archive an item, so that turned-in, transferred, or inactive property leaves normal workflows without being deleted.
32. As a user, I want archived items hidden from normal hand receipt lists, so that day-to-day property work stays focused.
33. As a user, I want archived items excluded from normal search by default, so that active results stay useful.
34. As a user, I want to include archived items and archived hand receipts deliberately, so that historical records remain findable.
35. As a user, I want to restore an archived item, so that I can recover from mistakes or resume tracking the item.
36. As a user, I want archive and restore to emit activity, so that item lifecycle changes are preserved.
37. As a user, I want to move an item between my hand receipts, so that Field Ledger can reflect property moving between buckets I manage.
38. As a user, I want moves to preserve item history, so that the item remains the same accountable record after a hand receipt change.
39. As a user, I want moves to emit activity, so that changes in hand receipt ownership are visible.
40. As a future 2062 user, I want move behavior to have a clear active-2062 constraint hook, so that formal assignment rules can be enforced when 2062s exist.
41. As a user, I want the Items route to search across all hand receipts, so that I do not need to choose a hand receipt before looking for property.
42. As a user, I want global search to match ECN, so that local identifiers are useful.
43. As a user, I want global search to match serial number, so that serialized property is easy to find.
44. As a user, I want global search to match generated IDs, so that generated-ID-only records are first-class.
45. As a user, I want global search to match nomenclature, so that I can search by the item description I remember.
46. As a user, I want global search to match hand receipt name, so that I can narrow results by bucket context.
47. As a user, I want global search to match location, so that I can find items by where they are kept.
48. As a user, I want global search to match signed-to contact, so that I can find property by who currently has it.
49. As a user, I want search results to show each item's hand receipt, so that global results stay understandable.
50. As a user, I want search results to show the strongest matching identifiers, so that I can quickly confirm I found the right item.
51. As a mobile user, I want search to be fast and thumb-friendly, so that I can use it while physically working with property.
52. As a desktop user, I want search results to be scannable, so that larger property sets remain manageable.
53. As a user, I want an empty search state that helps me start adding or locating records, so that the Items route is useful before the account has many items.
54. As a user, I want reusable contacts, so that assignee names stay consistent across hand receipts.
55. As a user, I want contacts to be account-wide, so that the same person can be used anywhere in my account.
56. As a user, I want contact display name to be the only required field, so that creating contacts stays fast.
57. As a user, I want existing contacts suggested while assigning an item, so that I avoid duplicates such as differently formatted names.
58. As a user, I want typing a new signed-to name to create a contact, so that manual signed-to state still references a structured record.
59. As a user, I want manual signed-to state to reference a contact, so that assignment data is reusable instead of being one-off text.
60. As a user, I want manually signed-to items to be clearly marked as having no 2062, so that I can distinguish informal assignment from formal coverage.
61. As a user, I want manually signed-to items to appear in signed-out surfaces where those surfaces exist, so that I see all currently assigned-out property.
62. As a user, I want manual signed-to changes to emit activity, so that assignment changes are preserved.
63. As a future 2062 user, I want manual signed-to state to be convertible to formal 2062 coverage later, so that this phase does not block the document workflow.
64. As a user, I want reusable locations, so that item places stay consistent across hand receipts.
65. As a user, I want locations to be account-wide, so that the same place can apply to many items.
66. As a user, I want location name to be the only required field, so that location creation stays lightweight.
67. As a user, I want items to support no location, so that unknown or unhelpful location data is not forced.
68. As a user, I want each item to have at most one current location, so that the item state stays clear.
69. As a user, I want to assign a location from item create or edit flows, so that location can be captured when it is known.
70. As a user, I want to change an item's location, so that Field Ledger reflects where the property currently is.
71. As a user, I want location changes to emit activity, so that item movement context is preserved.
72. As a user, I want search and filtering to use location context, so that locations become useful beyond item detail.
73. As a paused/read-only user, I want to view items, contacts, locations, and search results, so that I do not lose access to my records.
74. As a paused/read-only user, I want create, edit, archive, restore, move, signed-to, and location actions blocked consistently, so that read-only mode is understandable.
75. As a developer, I want item behavior owned by the items module, so that item rules do not drift into routes or generic UI code.
76. As a developer, I want contact behavior owned by the contacts module, so that manual signed-to and future 2062 assignment workflows share a clean record boundary.
77. As a developer, I want location behavior owned by the locations module, so that item places stay reusable and testable.
78. As a developer, I want search behavior exposed through a typed application boundary, so that the UI can search globally without owning query rules.
79. As a developer, I want item, contact, and location records account-owned and protected by RLS, so that one account cannot read or mutate another account's records.
80. As a developer, I want audit emission covered for item, signed-to, and location changes, so that later slices can trust the accountability history.
81. As a developer, I want vertical slices to land schema, service behavior, API, UI, tests, and docs together, so that this phase does not split into disconnected technical layers.
82. As a developer, I want later import/export, QR, photos, requirements, and 2062 work preserved as future boundaries, so that this phase does not sprawl beyond item records and shared references.

## Implementation Decisions

- Build this phase on the existing authenticated app shell, account boundary,
  capability layer, audit foundation, hand receipt module, tRPC setup, Drizzle
  schema, and local Supabase foundation.
- Introduce an items module as a domain-first module with application services,
  validation, persistence, module UI where useful, and tests.
- Introduce contacts and locations as account-wide shared-record modules with
  lightweight application services, persistence, UI where useful, and tests.
- Treat global item search as part of the item workflow for MVP, while keeping
  search rules behind a typed application boundary rather than route-owned query
  logic.
- Model each item as account-owned and belonging to exactly one current hand
  receipt.
- Model each item record as one physical accountable item, not a quantity-based
  line item.
- Require item nomenclature.
- Require ECN, serial number, or generated ID.
- Allow ECN-only, serial-only, ECN plus serial, and generated-ID-only items.
- Generate item IDs only when ECN and serial number are unknown or the user
  explicitly chooses to rely on the app-generated identifier.
- Make generated IDs permanent, human-friendly, account-sequential, and
  searchable.
- Preserve generated IDs even if ECN or serial number is added later.
- Allow duplicate nomenclature.
- Warn but allow duplicate ECN or serial number.
- Make duplicate identifier confirmation explicit enough that users understand
  they are accepting a possible duplicate record.
- Use capability checks before item, contact, location, signed-to, and movement
  mutations.
- Let paused/read-only accounts view records and search, but not mutate records.
- Archive items instead of deleting them.
- Hide archived items from normal active hand receipt lists and global search by
  default.
- Provide a deliberate include-archived option for item search across archived
  items and items that belong to archived hand receipts.
- Restore archived items to active workflows.
- Move items between hand receipts while preserving the item record and audit
  history.
- Leave a clear application-service hook for the future rule that active 2062
  coverage blocks moving an item to another hand receipt.
- Do not implement formal 2062 assignments, document upload, or active 2062
  enforcement in this phase.
- Make contacts account-wide and lightweight.
- Require only contact display name in MVP.
- Use contacts for manual signed-to state.
- Do not store manual signed-to as free text on the item.
- When a user types a new signed-to name, create a contact record and reference
  that contact.
- Suggest existing contacts during signed-to entry to reduce accidental
  duplicates.
- Clearly label manual signed-to state as no-2062 assignment context.
- Leave room for the later 2062 phase to convert manual signed-to state into
  formal 2062 coverage.
- Make locations account-wide and lightweight.
- Require only location name in MVP.
- Allow items to have no location.
- Allow each item to have at most one current location.
- Use location context in item detail and search/filtering where available.
- Emit audit events for item create, update, identifier changes, archive,
  restore, move, manual signed-to changes, and location changes.
- Keep audit metadata useful but not excessive. Do not store classified, PHI,
  sensitive operational details, or large record snapshots in audit metadata.
- Build item creation and item detail into the existing hand receipt workflow.
- Build the global item search experience into the existing Items route.
- Keep routes thin: routes compose module UI and call typed procedures; item,
  contact, location, and search rules live in module application services.
- Protect item, contact, and location tables with RLS.
- Use application-set account/session context for RLS, consistent with the
  existing account-owned table direction.
- Update domain, architecture, testing, and product docs if implementation
  changes terminology, route responsibility, audit expectations, or archive
  behavior.

## Testing Decisions

- Use TDD where behavior is clear, especially item identifier validation,
  generated ID behavior, duplicate warning decisions, archive/restore rules,
  move behavior, manual signed-to behavior, location assignment, search
  filtering, capability checks, and audit emission.
- Good tests should prove externally visible behavior and domain rules, not
  private implementation details.
- Unit tests should cover item identity validation, generated ID allocation
  rules, duplicate identifier warning decisions, item archive/restore lifecycle,
  move preconditions, manual signed-to contact requirements, location assignment
  rules, and read-only write blocking.
- Unit tests should cover search matching rules where those rules can be tested
  without database setup.
- Integration tests should cover creating, listing, viewing, editing,
  archiving, restoring, and moving items through the module service or typed API
  boundary.
- Integration tests should cover creating and selecting contacts through manual
  signed-to flows.
- Integration tests should cover creating and assigning locations through item
  flows.
- Integration tests should prove item, signed-to, and location workflows emit
  audit events.
- Integration tests should prove archived items are hidden from normal active
  lists and search results, then returned by explicit archived-record paths.
- Integration tests should prove global search matches ECN, serial number,
  generated ID, nomenclature, hand receipt name, contact, and location.
- RLS tests are required for items, contacts, and locations because they are
  account-owned tables.
- RLS tests should prove one account cannot read or write another account's
  items, contacts, or locations.
- Browser tests should stay focused on critical flows: add item from a hand
  receipt, item detail/edit, duplicate identifier warning and confirmation,
  global search, include-archived search behavior, manual signed-to entry,
  contact suggestion or creation, location assignment, and read-only blocking.
- Browser tests should verify the Items route is usable on mobile and desktop.
- Capability tests should reuse the existing billing/access module behavior
  rather than duplicating provider assumptions.
- Tests should avoid asserting provider internals unless the provider boundary
  itself is under test.
- Full verification for sliced work should include formatting, linting,
  typechecking, unit tests, integration tests, RLS tests, focused browser tests,
  build, and local Supabase checks required by the slice.

## Out of Scope

- Formal 2062 assignment creation, upload, close, remove-item, Active 2062s
  list behavior, or document storage.
- Enforcing active 2062 movement blocks beyond leaving a clear application
  service hook for the later 2062 phase.
- Requirement creation, due date calculation, completion history, dashboard
  requirement sections, or requirement suppression behavior beyond preserving
  future item/archive hooks.
- CSV/XLSX import/export.
- Offline read cache or offline editing.
- QR code generation or scanning.
- OCR.
- Item photos.
- Reports.
- Tags.
- Requirement templates.
- Real Stripe checkout, webhooks, invoices, customer portal, or subscription
  automation.
- Organization/team collaboration.
- Commander, PBO, cyclic inventory, or official system-of-record behavior.
- Storage of classified information, PHI, or sensitive operational details.

## Further Notes

This PRD is intended to be sliced into vertical implementation issues before
work begins. Each issue should land in the real app shell and include schema,
service behavior, API, UI, tests, and docs where relevant.

The most important guardrail for this phase is preserving item identity. An
item is one physical accountable item, not a line item, count, spreadsheet row,
or broad category. Search, contacts, locations, requirements, 2062 coverage, and
audit history all depend on that boundary staying sharp.

The second guardrail is avoiding free-text drift. Manual signed-to state should
create or reference contacts, and item locations should reference reusable
locations. The MVP can stay lightweight without collapsing shared records into
unstructured strings that later slices would need to unwind.

The third guardrail is keeping formal 2062 behavior out of this phase while
leaving the item model ready for it. Manual signed-to is explicitly no-2062
context. Formal 2062 assignments, documents, active links, close behavior, and
item movement blocks belong to the later 2062 phase.
