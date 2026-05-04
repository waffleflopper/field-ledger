# PRD: Field Ledger Phase 5 - Documents and 2062 Assignments

## Problem Statement

Field Ledger now has the foundation for authenticated use, account access,
audit/activity, hand receipts, property items, global search, contacts,
locations, manual signed-to state, item requirements, and dashboard due-work
visibility. The next part is the formal accountability layer users need when
property is signed to another person with a DA Form 2062.

Without this phase, the app can record that an item is manually signed to a
contact, but it cannot preserve the document that proves formal coverage. Users
would still need to manage scanned 2062s outside the app, remember which
document applies to which items, and manually reconcile returned property.
That weakens the core Field Ledger promise: quickly answering what property is
held, where it is, who it is signed to, and which 2062s are active.

This phase also needs to protect the product boundary. Field Ledger helps an
individual owner organize private accountability records. It is not an
official Army system of record, not a property book system, not a document
management system for unit files, and not a place for classified information,
PHI, or sensitive operational details. Uploaded 2062s are private supporting
records for the account owner's workflow, and users remain responsible for
official records and regulations.

The implementation must keep formal 2062 behavior distinct from manual
signed-to state. Manual signed-to state is useful but informal. Active 2062s
must mean formal 2062 assignments only. Documents must be preserved by default,
assignment history must survive close/remove actions, and item movement/archive
rules must not accidentally break the meaning of an active 2062.

## Solution

Phase 5 will add private document upload, document metadata, a file storage
boundary, formal 2062 assignment creation, Active 2062s review, close/remove
workflows, and enforcement of active 2062 constraints across item workflows.

Users will be able to upload accepted PDF/image documents for 2062 workflows.
Document records will be account-owned, stored privately through the app-owned
file storage boundary, and preserved by default. Closing a 2062, removing an
item link, archiving an item, or archiving a hand receipt must not delete the
uploaded file. Uploads will emit audit/activity events and will be blocked for
paused/read-only accounts.

Users will be able to create a one-item 2062 assignment from item detail. The
item will be preselected, contact selection will be required, and a document
upload will be required. If the item already has manual signed-to state, the
flow will default the contact to that person and convert the item to formal
2062 coverage when the assignment is created.

Users will also be able to create a multi-item 2062 assignment from a hand
receipt. The assignment will belong to one hand receipt, one contact, one
primary document, and one or more linked items from that same hand receipt. The
flow will prevent selecting items from other hand receipts. Each linked item
will show signed-to state from active 2062 coverage after creation.

Users will be able to review formal Active 2062s in a dedicated list. The list
will exclude manual signed-to records and show enough context to answer who
has property, how many items are covered, which hand receipt the assignment
belongs to, and how to open the assignment context. Mobile access should be
discoverable from the More/dashboard context without becoming a primary bottom
navigation item. Tablet and desktop access should fit the sidebar or secondary
navigation model.

Users will be able to close a whole 2062 assignment or remove one returned
item from a multi-item 2062. Closing a 2062 clears current signed-to state for
all active linked items. Removing one item link clears current signed-to state
for only that item and leaves the assignment active if other item links remain.
Return/close dates default to today, past dates are allowed, future dates must
be blocked, and all history and documents are preserved.

Finally, item workflows will enforce active 2062 meaning. An item with active
2062 coverage cannot move to another hand receipt until its active 2062 item
link is closed. Archiving an item with active 2062 coverage is allowed only as
a deliberate accountability action that warns the user and closes the item
link. If archiving closes the last active item link on an assignment, the user
is warned before confirmation and the assignment closes explicitly. All
meaningful state changes emit audit/activity events.

## User Stories

1. As an individual Army property holder, I want uploaded 2062 scans stored with my property records, so that I do not need a separate file pile to understand current accountability.
2. As a user, I want 2062 files stored privately, so that scans are not publicly accessible.
3. As a user, I want document metadata saved with my account, so that the app can link files to accountability workflows.
4. As a user, I want accepted document types to include PDF and common images, so that I can upload scanned or photographed 2062s.
5. As a user, I want upload failures to be clear, so that I know whether the document was saved.
6. As a user, I want uploaded document names and basic metadata visible where useful, so that I can recognize the right file later.
7. As a user, I want document uploads to emit activity, so that document history is preserved.
8. As a paused/read-only user, I want to view existing documents, so that I do not lose access to accountability records.
9. As a paused/read-only user, I want document upload blocked consistently, so that read-only account behavior is understandable.
10. As a user, I want closing a 2062 not to delete its document, so that evidence remains available after return.
11. As a user, I want archiving an item not to delete linked documents, so that history stays intact.
12. As a user, I want archiving a hand receipt not to delete linked documents, so that old accountability records remain reviewable.
13. As a user, I want a focused upload 2062 flow from item detail, so that one-off assignments are quick.
14. As a user, I want the item upload flow to preselect the current item, so that I do not accidentally assign the wrong property.
15. As a user, I want the item upload flow to require a contact, so that every formal assignment has a person.
16. As a user, I want the item upload flow to let me create a contact inline, so that I can keep moving when the person is not already saved.
17. As a user, I want the item upload flow to require a document, so that formal coverage has attached evidence.
18. As a user, I want an item with manual signed-to state to default the 2062 contact to the same person, so that conversion is fast and accurate.
19. As a user, I want uploading a 2062 for a manually signed-to item to convert it to formal 2062 coverage, so that the item no longer shows as informal.
20. As a user, I want manual signed-to state cleared or replaced when formal coverage is created, so that current signed-to state is not duplicated.
21. As a user, I want creating a one-item 2062 to emit activity, so that assignment history is preserved.
22. As a user, I want a focused upload 2062 flow from hand receipt detail, so that multi-item 2062s can be created from the bucket they belong to.
23. As a user, I want a 2062 assignment to belong to one hand receipt, so that the document's scope stays understandable.
24. As a user, I want the hand receipt upload flow to require a contact, so that every formal assignment has a person.
25. As a user, I want the hand receipt upload flow to require a document, so that formal coverage has attached evidence.
26. As a user, I want to select one or more items from the current hand receipt, so that one 2062 can cover multiple items.
27. As a user, I want the flow to block creating an empty 2062, so that every assignment covers actual property.
28. As a user, I want items from other hand receipts excluded from selection, so that I cannot mix buckets inside one 2062.
29. As a user, I want search/filter behavior inside the multi-item selector, so that large hand receipts remain workable on mobile.
30. As a user, I want selected items summarized before creation, so that I can catch mistakes before saving the assignment.
31. As a user, I want creating a multi-item 2062 to emit assignment and item-link activity, so that history explains what changed.
32. As a user, I want each item to have at most one active 2062 link, so that current accountability is unambiguous.
33. As a user, I want an item to preserve many historical closed 2062 links, so that prior assignments remain visible.
34. As a user, I want the app to block adding an item to a new active 2062 when it already has active 2062 coverage, so that I do not create conflicting assignments.
35. As a user, I want active 2062 coverage to update linked items' signed-to state, so that item surfaces show the current assignee.
36. As a user, I want manual signed-to items and formal 2062 items visually distinguished, so that I know which ones have document coverage.
37. As a user, I want Active 2062s to include only formal 2062 assignments, so that the term stays accurate.
38. As a user, I want manual signed-to records excluded from Active 2062s, so that informal assignments do not appear as documents.
39. As a user, I want each Active 2062 row to show contact, item count, hand receipt, date/status, and an open action, so that I can quickly understand the assignment.
40. As a mobile user, I want Active 2062s discoverable without adding another bottom-nav item, so that primary navigation stays focused.
41. As a tablet or desktop user, I want Active 2062s available from the sidebar or secondary navigation, so that formal accountability is easy to review.
42. As a user, I want an empty Active 2062s state, so that I know whether there are no formal documents currently out.
43. As a user, I want to open an active 2062 context from the list, so that I can review covered items and close or remove links.
44. As a user, I want to close a whole 2062 assignment, so that returned property no longer appears signed out.
45. As a user, I want close date to default to today, so that current returns are fast to record.
46. As a user, I want to enter a past close date, so that I can record returns after the fact.
47. As a user, I want future close dates blocked, so that assignment history does not pretend property already returned.
48. As a user, I want closing a 2062 to clear current signed-to state for all active linked items, so that returned items stop appearing assigned out.
49. As a user, I want closing a 2062 to preserve the document and item history, so that accountability evidence remains reviewable.
50. As a user, I want closing a 2062 to emit assignment and item activity, so that history explains the return.
51. As a user, I want to remove one item from a multi-item 2062, so that one returned item can be handled without closing the whole assignment.
52. As a user, I want removing one item link to clear signed-to state only for that item, so that other covered items stay assigned out.
53. As a user, I want a multi-item assignment to stay active when other item links remain, so that partial returns do not close the whole document.
54. As a user, I want removing the last active item link to lead toward closing the assignment, so that empty active assignments do not linger.
55. As a user, I want item detail to show current 2062 coverage, so that I can understand formal assignment state from the property record.
56. As a user, I want item detail to show historical 2062 links, so that I can review prior assignment history.
57. As a user, I want hand receipt detail to show active 2062 context where useful, so that the bucket's formal coverage is understandable.
58. As a user, I want an item with active 2062 coverage blocked from moving to another hand receipt, so that the document's hand receipt scope stays true.
59. As a user, I want the move block to explain that the active 2062 link must be closed first, so that I know how to proceed.
60. As a user, I want archiving an item with active 2062 coverage to warn me, so that I understand the accountability impact.
61. As a user, I want archiving an item with active 2062 coverage to close that item link, so that archived property does not remain actively assigned out.
62. As a user, I want archiving one item from a multi-item 2062 to leave other item links active, so that unrelated property stays covered.
63. As a user, I want archiving the last active item on a 2062 to prompt me to close the assignment, so that empty active coverage is not confusing.
64. As a user, I want all 2062 state changes to emit readable activity labels, so that I can understand what changed without technical event names.
65. As a developer, I want document behavior owned by a documents module, so that file metadata and storage rules do not drift into route components.
66. As a developer, I want file storage behind an app-owned provider boundary, so that Supabase Storage details do not leak into domain or UI code.
67. As a developer, I want 2062 behavior owned by an assignments-2062 module, so that assignment rules stay testable and reusable.
68. As a developer, I want assignment creation to run through application services, so that document, contact, item-link, capability, and audit behavior stay consistent.
69. As a developer, I want close/remove behavior to run through application services, so that item signed-to state and audit events stay consistent.
70. As a developer, I want item move/archive workflows to call assignment-domain checks, so that active 2062 constraints are enforced outside the UI.
71. As a developer, I want document and assignment records account-owned and protected by RLS, so that one account cannot read or mutate another account's data.
72. As a developer, I want vertical slices to land schema, services, typed API, UI, tests, and docs together, so that documents and 2062s do not become disconnected screens.
73. As a future OCR user, I want documents attached through a clean document boundary, so that later extraction can build on existing records without rewriting assignment workflows.
74. As a future import/export user, I want 2062 data exposed through typed query boundaries, so that export support can include document and assignment context later.

## Implementation Decisions

- Build this phase on the existing authenticated app shell, account boundary,
  capability layer, audit foundation, hand receipt module, item module,
  contacts module, tRPC setup, Drizzle schema, local Supabase foundation,
  requirement/dashboard work, and private ownership model.
- Introduce or complete a documents module as a domain-first module with
  document metadata behavior, persistence, file storage port usage, module UI
  where useful, and tests.
- Introduce a file storage provider boundary for private uploads. Supabase
  Storage is the expected adapter, but domain and UI code should call app-owned
  services/ports.
- Model documents as account-owned records.
- Store document metadata including filename, MIME type, size, storage path,
  and uploaded timestamp.
- Accept PDF and common image uploads for MVP 2062 workflows.
- Keep documents private by default.
- Preserve uploaded documents by default.
- Do not delete documents as part of 2062 close, item-link removal, item
  archive, or hand receipt archive behavior.
- Block document upload for paused/read-only accounts while allowing read
  access to existing document metadata and files.
- Emit audit/activity events for document upload.
- Introduce or complete an assignments-2062 module as a domain-first module
  with assignment rules, item-link lifecycle behavior, persistence,
  application services, module UI where useful, and tests.
- Model a 2062 assignment as account-owned and belonging to exactly one hand
  receipt, one contact, one primary document, and one or more linked items.
- Require contact, document, hand receipt, and at least one item to create a
  2062 assignment.
- Require all linked items to belong to the assignment's hand receipt.
- Allow one item to have at most one active 2062 link.
- Preserve many historical closed 2062 links per item.
- Treat manual signed-to state and formal 2062 coverage as distinct states.
- Convert manual signed-to state to formal 2062 coverage when a 2062 is
  uploaded for that item.
- Default the contact in single-item upload when the item already has manual
  signed-to state.
- Clear or replace manual signed-to state when formal 2062 coverage is created.
- Build single-item upload 2062 behavior from item detail.
- Build multi-item upload 2062 behavior from hand receipt detail.
- Keep item selection for multi-item 2062s scoped to the current hand receipt.
- Update linked item signed-to surfaces from active 2062 coverage.
- Build Active 2062s as a simple MVP list for formal 2062 assignments only.
- Exclude manual signed-to records from Active 2062s.
- Show contact, item count, hand receipt context, status/date, and an open
  action in Active 2062 rows or cards.
- Make Active 2062s discoverable on mobile without adding it to primary bottom
  navigation.
- Make Active 2062s accessible from tablet/desktop sidebar or secondary
  navigation.
- Support closing all active item links for a 2062 assignment.
- Support closing a single item link from a multi-item 2062.
- Clearing a whole 2062 clears current signed-to state for all active linked
  items.
- Removing one item link clears current signed-to state for only that item.
- Keep a multi-item assignment active when at least one active item link
  remains.
- Prompt or force assignment close when the last active item link would be
  removed, so empty active assignments do not linger.
- Default close/remove return date to today.
- Allow past close/remove dates.
- Block future close/remove dates in both the UI and domain service.
- Emit audit/activity events for assignment creation, item-link creation,
  whole-assignment close, single-item removal, manual-to-formal conversion, and
  assignment-related item state changes.
- Block moving an item with an active 2062 link to another hand receipt until
  the active link is closed.
- Allow archiving an item with active 2062 coverage only as a deliberate action
  that warns the user and closes that item link.
- If archiving closes the final active item link on a 2062 assignment, warn the
  user before confirmation and close the assignment explicitly.
- Keep routes thin: routes compose module UI and call typed procedures; document
  storage rules and 2062 assignment rules live in module application services.
- Protect document, 2062 assignment, and 2062 item-link tables with RLS.
- Use the application-set account/session context for RLS, consistent with the
  existing account-owned table direction.
- Keep audit metadata useful but not excessive. Do not store classified, PHI,
  sensitive operational details, or large document snapshots in audit metadata.
- Leave OCR, automatic 2062 extraction, QR codes, item photos, reports,
  import/export, offline read cache, email reminders, and push reminders for
  future phases.
- Update domain, architecture, testing, and product docs if implementation
  changes terminology, route responsibility, audit expectations, document
  lifecycle behavior, or 2062 assignment lifecycle behavior.

## Testing Decisions

- Use TDD where behavior is clear, especially accepted upload types,
  capability checks, 2062 assignment validation, active-link uniqueness,
  manual-to-formal conversion, close/remove behavior, item move/archive
  constraints, and audit emission.
- Good tests should prove externally visible behavior and domain rules, not
  private implementation details.
- Unit tests should cover document upload validation, document preservation
  decisions, assignment creation validation, same-hand-receipt item selection,
  empty assignment blocking, active-link uniqueness, manual-to-formal
  conversion, close/remove date validation, whole-assignment close, single-item
  removal, and signed-to state updates.
- Unit tests should cover item move/archive decisions when active 2062 coverage
  exists.
- Unit tests should cover Active 2062 filtering so manual signed-to records
  never appear in the formal list.
- Integration tests should cover document metadata creation through the module
  service or typed API boundary.
- Integration tests should cover private file storage through the app-owned
  storage port with provider details isolated behind the boundary.
- Integration tests should cover single-item 2062 creation from item detail
  behavior, including preselected item and manual-to-formal conversion.
- Integration tests should cover multi-item 2062 creation from hand receipt
  behavior, including same-hand-receipt enforcement.
- Integration tests should cover closing a whole 2062 and clearing signed-to
  state for all linked items.
- Integration tests should cover removing one item from a multi-item 2062 while
  preserving other active item links.
- Integration tests should cover paused/read-only accounts being able to read
  existing documents and assignments but unable to upload documents or mutate
  assignments.
- Integration tests should prove 2062 workflows emit audit/activity events.
- Integration tests should prove item movement is blocked while active 2062
  coverage exists.
- Integration tests should prove item archive with active 2062 coverage performs
  the deliberate close-link behavior and emits activity.
- RLS tests are required for document, 2062 assignment, and 2062 item-link
  tables because they are account-owned.
- RLS tests should prove one account cannot read or write another account's
  documents, assignment records, or item links.
- RLS tests should prove assignment item links cannot cross account ownership or
  hand receipt ownership boundaries.
- Browser tests should stay focused on critical flows: single-item upload 2062,
  multi-item upload 2062, Active 2062s list, whole-assignment close,
  single-item removal, read-only blocking, and basic mobile and desktop
  rendering.
- Browser tests should include the mobile route discovery path for Active 2062s
  and the tablet/desktop navigation path.
- Browser tests should avoid trying to prove every domain edge case when unit
  and integration tests cover those rules more clearly.
- Full verification for sliced work should include formatting, linting,
  typechecking, unit tests, integration tests, RLS tests, focused browser tests,
  build, and local Supabase checks required by the slice.

## Out of Scope

- Official Army system-of-record behavior.
- Property book office workflows.
- Commander cyclic inventory workflows.
- Organization/team collaboration.
- Public document sharing.
- General-purpose document management outside accountability workflows.
- Hard deletion of uploaded documents as a normal workflow.
- OCR or automatic extraction from 2062 scans.
- Automatic generation of filled 2062 forms.
- Digital signatures.
- Document versioning.
- Multiple primary documents per 2062 assignment.
- One 2062 assignment spanning multiple hand receipts.
- Active manual signed-to records appearing in Active 2062s.
- Moving actively covered items to another hand receipt without closing the
  active 2062 item link.
- Offline document upload or offline 2062 mutation.
- CSV/XLSX import/export implementation.
- Reports.
- QR codes.
- Item photos.
- Email reminders.
- Push reminders.
- Real Stripe checkout, webhooks, invoices, customer portal, or subscription
  automation.
- Storage of classified information, PHI, or sensitive operational details.

## Further Notes

This PRD is intended to be sliced into vertical implementation issues before
work begins. The slices should keep documents and 2062 assignments tied to real
item detail, hand receipt detail, and Active 2062 workflows instead of building
a detached file browser or a generic assignment subsystem.

The main guardrail is that formal 2062 assignment behavior belongs in the
assignments-2062 module, and private file behavior belongs behind the documents
module and file storage boundary. Routes and UI should compose those behaviors;
they should not decide assignment validity, active-link uniqueness, file
privacy, or signed-to state transitions.

The second guardrail is product language. Active 2062s means formal 2062
assignments only. Manual signed-to state remains visible in signed-out item
surfaces but must stay clearly labeled as informal/no-document coverage.

The third guardrail is preservation. Closing, removing, archiving, and future
historical workflows should preserve accountability evidence by default.
Destroying documents or assignment history should not be part of normal MVP
behavior.
