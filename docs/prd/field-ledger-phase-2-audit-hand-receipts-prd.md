# PRD: Field Ledger Phase 2 - Audit, Activity, and Hand Receipts

## Problem Statement

Field Ledger has the first product foundation: authentication, a single-owner
account boundary, trial/access capability checks, and a responsive authenticated
app shell. The next product step is where the app starts becoming useful for
property accountability instead of only preparing the frame.

Before Field Ledger can create real property records, it needs an audit
foundation. Hand receipts, items, 2062 assignments, requirements, contacts, and
locations all need meaningful state changes to be recorded from the start. If
the first real workflows ship without audit events, the app would immediately
lose accountability history and later slices would have to backfill behavior
that should have been part of the original domain model.

The first major domain workflow is hand receipt management. Users need to
create named hand receipts as buckets for property items, add optional formal
metadata when useful, view and edit those records, and archive or restore them
without deleting history. This must happen inside the real `/app/hand-receipts`
surface and through the existing account capability boundary, not as route-owned
demo logic.

This phase must preserve the product boundary. Field Ledger remains a personal
Army property-accountability tool for one owner account managing many hand
receipts. It is not an official Army system of record, not a unit workspace, and
not a place for classified information, PHI, or sensitive operational details.

## Solution

Phase 2 will add the audit and activity foundation, then build hand receipt
management on top of it as the first real property-accountability workflow.

The audit foundation will introduce account-owned audit events protected by RLS.
Application services will be able to record the actor, action, target,
timestamp, and useful contextual metadata for meaningful state changes. Audit
logging will sit behind a Field Ledger-owned boundary so future modules can emit
events without coupling themselves to routes, UI components, or provider
implementation details. Activity will be the user-visible version of that
history: simple, readable, secondary to core workflows, and useful enough to
show recent changes without becoming a full audit browser.

Hand receipts will become real records owned by the current account. A hand
receipt will require a name and may include optional formal metadata such as
notes, hand receipt number, holder name, unit name, UIC, and effective date.
Users will be able to create, list, view, edit, archive, and restore hand
receipts from the app shell. Active hand receipts will appear in normal
day-to-day lists by default. Archived hand receipts will be preserved for
history, hidden from normal active lists by default, and restorable.

Creation and mutation behavior will use the existing capability layer. Trial
accounts should receive Pro-like behavior. Base accounts may create up to three
active hand receipts. Pro accounts may create unlimited active hand receipts.
Paused/read-only accounts can review existing hand receipts and activity, but
cannot create, edit, archive, or restore records.

Each meaningful hand receipt change will emit an audit event. The user-facing
activity surfaces will show readable labels such as hand receipt created,
updated, archived, or restored rather than raw implementation names. The detail
page will leave room for future item lists, upload 2062 actions, and scoped
activity without implementing item, document, 2062, or requirement workflows in
this phase.

## User Stories

1. As an individual Army property holder, I want to create hand receipts, so that I can organize the property buckets I manage.
2. As a user, I want hand receipt creation to happen inside the real app shell, so that the workflow feels like part of Field Ledger rather than a setup demo.
3. As a user, I want a hand receipt to require a name, so that each bucket has a clear human-readable identity.
4. As a user, I want hand receipt metadata to be optional, so that I can start with the simple records I actually have.
5. As a user, I want to add a hand receipt number when I have one, so that formal context can be preserved.
6. As a user, I want to add a holder name when useful, so that the record can reflect the person or role associated with the receipt.
7. As a user, I want to add unit name and UIC when useful, so that formal hand receipt context is available without being required.
8. As a user, I want to add an effective date when useful, so that the record can match my local accountability context.
9. As a user, I want to add notes to a hand receipt, so that I can preserve useful context without creating separate documents.
10. As a user, I want optional metadata to remain optional, so that Field Ledger does not slow down quick setup.
11. As a user, I want to see my active hand receipts in a list, so that I can choose the bucket I need.
12. As a user, I want the hand receipt list to fit mobile screens well, so that I can use it while working with property.
13. As a tablet or desktop user, I want the hand receipt list to use the app shell efficiently, so that review and navigation are comfortable on larger screens.
14. As a user, I want the hand receipt list to show useful summary fields, so that I can distinguish similar receipts.
15. As a user, I want the list to exclude archived hand receipts by default, so that day-to-day work stays focused.
16. As a user, I want a way to review archived hand receipts, so that preserved records are still reachable.
17. As a user, I want to open a hand receipt detail page, so that I can review its current information.
18. As a user, I want the detail page to have a stable place for future items, so that the hand receipt can grow into the main bucket view later.
19. As a user, I want the detail page to have a stable place for a future Upload 2062 action, so that the later workflow has an obvious home.
20. As a user, I want the detail page to show relevant activity when useful, so that I can see recent changes to that bucket.
21. As a user, I want to edit a hand receipt name, so that I can correct or refine records over time.
22. As a user, I want to edit optional formal metadata, so that the record can become more complete later.
23. As a user, I want edits to preserve history, so that corrections do not erase accountability context.
24. As a user, I want to archive a hand receipt, so that old or inactive buckets leave normal workflows without being deleted.
25. As a user, I want archive behavior to warn me before the record leaves active workflows, so that I understand what will change.
26. As a user, I want archived hand receipts to remain viewable, so that I can still review historical records.
27. As a user, I want to restore an archived hand receipt, so that I can recover from mistakes or resume tracking.
28. As a user, I want restored hand receipts to return to active lists, so that they behave like active records again.
29. As a Base subscriber, I want the app to enforce the three-active-hand-receipt limit, so that tier behavior is clear.
30. As a Base subscriber at the active limit, I want to understand why I cannot create another active hand receipt, so that the block does not feel broken.
31. As a Base subscriber, I want archived hand receipts not to count against the active hand receipt limit, so that history does not consume active capacity.
32. As a Pro subscriber, I want unlimited active hand receipts, so that larger property responsibilities are supported.
33. As a trial user, I want Pro-like hand receipt creation capability, so that I can evaluate the real workflow.
34. As a paused/read-only user, I want to review hand receipts, so that I do not lose access to accountability records.
35. As a paused/read-only user, I want create and edit actions blocked or disabled consistently, so that read-only behavior is understandable.
36. As a user, I want meaningful hand receipt changes to be recorded, so that property-accountability history can be trusted.
37. As a user, I want hand receipt creation to appear in activity, so that I can see when a bucket was started.
38. As a user, I want hand receipt updates to appear in activity, so that corrections and metadata changes are visible.
39. As a user, I want hand receipt archive and restore actions to appear in activity, so that lifecycle changes are visible.
40. As a user, I want activity labels to be readable, so that I can understand what changed without reading technical logs.
41. As a user, I want recent activity visible in a low-priority dashboard area, so that I can see important changes without distracting from operational work.
42. As a user, I want a broader Activity surface to exist in the app shell, so that I have a place to review more history as workflows grow.
43. As a user, I want Activity to stay secondary to Dashboard, Items, and Hand Receipts, so that it supports accountability without becoming the main workflow.
44. As a developer, I want audit events to be account-owned, so that history is protected by the same ownership boundary as product records.
45. As a developer, I want audit events protected by RLS, so that one account cannot read another account's history.
46. As a developer, I want an audit logger boundary, so that modules can emit events without knowing storage or provider details.
47. As a developer, I want audit logging available to application services, so that business workflows can record meaningful changes outside route components.
48. As a developer, I want audit events to capture actor, action, target, timestamp, and useful metadata, so that future activity surfaces have enough context.
49. As a developer, I want audit event action names to be stable domain concepts, so that activity labels can stay readable as implementation changes.
50. As a developer, I want the hand receipts module to own hand receipt behavior, so that rules do not drift into routes or generic UI code.
51. As a developer, I want tRPC procedures to call hand receipt application services, so that UI has a typed app API without owning business behavior.
52. As a developer, I want hand receipt persistence hidden behind the module boundary, so that schema changes do not leak through the app shell.
53. As a developer, I want tests proving audit emission for hand receipt workflows, so that later slices can trust the audit foundation.
54. As a developer, I want tests proving active/archive filtering, so that archived accountable records do not clutter normal workflows.
55. As a developer, I want docs updated for audit-event expectations, so that future slices know which changes must emit history.
56. As a developer, I want unresolved future archive effects documented, so that 2062 and requirement slices do not guess later.

## Implementation Decisions

- Build this phase on the existing authenticated app shell, account boundary,
  billing capability layer, tRPC setup, Drizzle schema, and local Supabase
  foundation.
- Introduce an audit module as a domain-first module with application services,
  persistence, tests, and a simple interface for recording audit events.
- Treat audit logging as a provider boundary. Product modules should call a
  Field Ledger-owned audit logger interface rather than writing provider- or
  database-specific audit code directly.
- Store audit events as account-owned records.
- Protect audit events with RLS.
- Capture actor, action, target, timestamp, and useful metadata for each audit
  event.
- Keep audit event metadata useful but not excessive. Do not store classified,
  PHI, sensitive operational details, or large snapshots of product records.
- Use stable domain action names for meaningful state changes.
- Surface Activity as readable user-facing history derived from audit events.
- Keep Activity simple in this phase: recent dashboard activity plus the
  existing Activity route as a broader review surface.
- Do not build a full audit browser, advanced filters, exports, or admin-style
  investigation tooling in this phase.
- Introduce a hand receipts module as a domain-first module with application
  services, validation, persistence, module UI where useful, and tests.
- Model each hand receipt as account-owned.
- Require hand receipt name.
- Support optional notes, hand receipt number, holder name, unit name, UIC, and
  effective date.
- Model hand receipt lifecycle as active or archived.
- Archive hand receipts instead of deleting them.
- Restore archived hand receipts to active status.
- Hide archived hand receipts from normal active lists by default.
- Provide a deliberate archived-record review path without making archived
  records part of the normal day-to-day list.
- Use capability checks before hand receipt creation.
- Treat trial access as Pro-like for hand receipt creation.
- Enforce the Base tier limit of three active hand receipts.
- Treat Pro as unlimited for active hand receipts.
- Do not count archived hand receipts against the Base active limit.
- Block or disable hand receipt create, edit, archive, and restore behavior for
  paused/read-only accounts.
- Let paused/read-only accounts read existing hand receipts and activity.
- Emit audit events for hand receipt create, update, archive, and restore.
- Make hand receipt routes compose module UI and call typed procedures.
- Keep hand receipt business rules out of route components.
- Build into the existing `/app/hand-receipts` list route.
- Add hand receipt detail/edit route structure needed for this phase and future
  item and 2062 workflows.
- Leave explicit room on hand receipt detail for future item list, Upload 2062,
  and scoped activity surfaces.
- Do not implement item creation, global search, contacts/locations management,
  document upload, 2062 assignments, or requirement behavior in this phase.
- Document that archived hand receipts will suppress contained reminders when
  requirements exist, but this phase does not implement requirements.
- Document that future active 2062 behavior at archive time remains resolved by
  the 2062 phase unless a slice explicitly narrows that rule earlier.
- Update domain, architecture, testing, and product docs if implementation
  changes terminology, route responsibility, audit expectations, or archive
  behavior.

## Testing Decisions

- Use TDD where behavior is clear, especially audit recording, hand receipt
  validation, capability enforcement, archive/restore rules, and active/archive
  filtering.
- Good tests should prove externally visible behavior and domain rules, not
  private implementation details.
- Unit tests should cover audit event construction, action naming decisions,
  hand receipt validation, active/archive lifecycle rules, Base active-limit
  decisions, Pro unlimited behavior, trial Pro-like behavior, and read-only
  write blocking.
- Integration tests should cover hand receipt create, list, view, edit,
  archive, and restore through the module service or typed API boundary.
- Integration tests should prove hand receipt workflows emit audit events.
- Integration tests should prove archived hand receipts are hidden from normal
  active lists and visible through the archived-record review path.
- RLS tests are required for audit events and hand receipts because both are
  account-owned tables.
- RLS tests should prove one account cannot read or write another account's
  hand receipts.
- RLS tests should prove one account cannot read another account's audit events.
- Browser tests should stay focused on critical flows: hand receipt list,
  create flow, detail/edit flow, archive/restore behavior, read-only blocking,
  and basic mobile/desktop rendering.
- Browser tests should verify user-readable Activity appears for hand receipt
  changes if the workflow can be exercised locally.
- Capability tests should reuse the existing billing module behavior rather
  than duplicating Stripe or subscription-provider assumptions.
- Tests should avoid asserting provider internals unless the provider boundary
  itself is under test.
- Full verification for sliced work should include formatting, linting,
  typechecking, unit tests, integration tests, RLS tests, focused browser tests,
  build, and local Supabase checks required by the slice.

## Out of Scope

- Property item create/edit/archive/restore/move workflows.
- Global item search.
- Contacts and locations management.
- Document upload.
- 2062 assignment creation, upload, close, remove-item, or Active 2062s
  behavior.
- Requirement creation, due date calculation, completion history, or dashboard
  requirement sections.
- Suppression of real requirement reminders, because requirements do not exist
  yet.
- Final 2062 archive conflict rules, unless a specific implementation slice
  chooses to settle a narrow hand receipt archive precondition.
- Detailed audit browsing, advanced activity filtering, export, or reports.
- Real Stripe checkout, webhooks, invoices, customer portal, or subscription
  automation.
- Organization/team collaboration.
- Commander, PBO, cyclic inventory, or official system-of-record behavior.
- CSV/XLSX import/export.
- Offline read cache or offline editing.
- Push notifications, email reminders, OCR, QR codes, item photos, tags,
  reports, and requirement templates.

## Further Notes

This PRD is intended to be sliced into vertical implementation issues before
work begins. The first slices should establish the audit foundation and then use
that foundation in hand receipt workflows. Each hand receipt slice should land
real UI, service behavior, typed API, persistence, RLS, tests, and docs updates
where relevant.

The main guardrail is that audit and hand receipt behavior must not become
route-owned convenience code. Audit logging should be a small, stable interface
that future modules can call. Hand receipts should be the first real proof that
Field Ledger's domain-module architecture can support an accountable workflow
inside the app shell.

The second guardrail is lifecycle language. Accountable records should be
archived, restored, or closed as appropriate; they should not be hard-deleted in
normal product workflows. In this phase, that means hand receipts can be
archived and restored while history remains preserved.
