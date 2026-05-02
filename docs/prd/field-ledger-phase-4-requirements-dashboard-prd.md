# PRD: Field Ledger Phase 4 - Requirements and Dashboard

## Problem Statement

Field Ledger now has the product foundation for authenticated use, account
access, audit/activity, hand receipts, property items, global search, contacts,
locations, and manual signed-to state. The next part is the operational loop
that turns those property records into daily accountability work: users need to
know which item-level requirements are overdue, which ones are due soon, which
ones are coming up, and what was last completed.

Without this phase, Field Ledger can describe property but cannot yet help the
user maintain it. The dashboard would still be mostly a navigation surface
instead of the first place a user checks when they open the app. Item detail
would not yet answer whether a radio, vehicle kit, sensitive item, battery,
calibration, inspection, or similar piece of property has an upcoming recurring
obligation. Users would still need separate notes, calendar reminders, or
memory to track maintenance and inspection cadence.

This phase also needs to protect the product boundary. A Field Ledger
requirement is an item-level recurring obligation chosen by the user. It is not
a commander cyclic inventory program, not a property book office workflow, not
a shared unit task list, and not an official Army system of record. The app
should help the individual holder stay organized while keeping the official
record, command processes, and regulations outside the product.

Requirements must preserve accountability history. Completing a requirement
should create a permanent completion record instead of merely pushing a due date
forward. Late completions should calculate the next due date from when the work
was actually done. Manual next-due changes should handle real-world schedule
adjustments without changing the underlying interval. Archived records and
paused accounts must not generate active operational work.

## Solution

Phase 4 will add item-level requirements, requirement completion history,
next-due calculation, manual next-due adjustment, pause/resume behavior, and the
dashboard requirement priority model inside the real app shell.

Users will be able to add requirements to an item from item detail. A
requirement belongs to exactly one item. Supported intervals will include
weekly, monthly, quarterly, semiannual, annual, custom days, and custom months.
Duplicate requirement names on the same item will warn the user but remain
confirmable because real property workflows sometimes repeat similar labels.
Creation and editing will emit audit events and will be blocked for
paused/read-only accounts.

Users will be able to complete a requirement with a completion date and optional
notes. Completion defaults to today, allows past dates, blocks future dates, and
creates a permanent requirement completion record. The next due date will be
calculated from the entered completion date, not from the previous due date, so
late work moves the future schedule realistically.

Users will be able to manually adjust a requirement's next due date without
changing its interval. The next completion after that adjustment will again
calculate from the actual completion date. Users will also be able to pause and
resume individual requirements. Paused requirements remain preserved on the item
but do not appear as active dashboard work. Adjustments, pause, and resume will
emit audit events.

The dashboard will make requirements the first operational priority. It will
show overdue requirements first, due soon requirements from today through 14
days, and upcoming requirements from 15 through 30 days. Requirements beyond 30
days will be hidden by default. Requirements attached to archived items or
archived hand receipts will be suppressed. Paused/read-only account state will
allow review of existing requirement data but will not present reminders as
active work or allow requirement mutations.

Item detail will show active requirements, support creation/editing where the
account can write, allow marking a requirement complete, and expose at least
recent completion history. The experience must remain mobile-first while using
tablet and desktop space cleanly instead of stretching a phone layout.

## User Stories

1. As an individual Army property holder, I want to add a recurring requirement to an item, so that maintenance, inspection, calibration, or replacement obligations stay attached to the property they belong to.
2. As a user, I want requirements to belong to items only, so that the app does not drift into commander cyclic inventory or unit-level task tracking.
3. As a user, I want requirement creation to happen from item detail, so that recurring work starts from the property record I am already viewing.
4. As a user, I want the item detail page to show requirements, so that I can understand the item's operational obligations without leaving the record.
5. As a user, I want requirement names to be human-readable, so that I can recognize the work that needs to be done.
6. As a user, I want weekly requirements, so that short recurring obligations can be tracked.
7. As a user, I want monthly requirements, so that common monthly checks can be tracked.
8. As a user, I want quarterly requirements, so that three-month recurring obligations can be tracked.
9. As a user, I want semiannual requirements, so that six-month recurring obligations can be tracked.
10. As a user, I want annual requirements, so that yearly inspections or reviews can be tracked.
11. As a user, I want custom-day intervals, so that odd schedules can be tracked without waiting for a template feature.
12. As a user, I want custom-month intervals, so that local schedules measured in months can be tracked cleanly.
13. As a user, I want duplicate requirement names on the same item to warn me, so that I can catch likely mistakes.
14. As a user, I want duplicate requirement names to be confirmable, so that the app does not block messy real-world workflows.
15. As a user, I want requirement creation to emit activity, so that the start of the recurring obligation is preserved.
16. As a user, I want requirement edits to emit activity, so that changed schedules or names remain visible.
17. As a paused/read-only user, I want to view existing requirements, so that I do not lose access to accountability records.
18. As a paused/read-only user, I want requirement creation and editing blocked consistently, so that read-only account behavior is understandable.
19. As a user, I want to mark a requirement complete, so that completed work is recorded.
20. As a user, I want completion to default to today, so that current work can be recorded quickly.
21. As a user, I want to enter a past completion date, so that I can record work after doing it.
22. As a user, I want future completion dates blocked, so that requirement history does not contain impossible completions.
23. As a user, I want completion to create permanent history, so that past work is preserved.
24. As a user, I want completion notes to be optional, so that I can add useful context only when needed.
25. As a user, I want completion notes to stay lightweight, so that the app does not encourage sensitive operational detail.
26. As a user, I want completing a requirement to emit activity, so that meaningful item history is visible.
27. As a user, I want the next due date to calculate from the completion date, so that late work moves the schedule realistically.
28. As a user, I want late completion to avoid pretending the next due date started from the missed date, so that the app reflects what actually happened.
29. As a user, I want early completion to calculate the next date from when I actually completed the work, so that the schedule remains understandable.
30. As a user, I want date-only requirement behavior, so that due dates do not depend on time of day or timezone details I do not care about.
31. As a user, I want to manually adjust a requirement's next due date, so that I can reflect real-world schedule changes.
32. As a user, I want manual next-due adjustment not to change the interval, so that a one-time schedule correction does not rewrite the recurring rule.
33. As a user, I want the next completion after manual adjustment to calculate from the completion date, so that the normal cadence resumes cleanly.
34. As a user, I want manual adjustment to emit activity, so that due-date overrides are explainable later.
35. As a user, I want to pause a requirement, so that a preserved obligation can stop appearing as active work when it temporarily does not apply.
36. As a user, I want to resume a paused requirement, so that the obligation can return to active workflows.
37. As a user, I want pause and resume to emit activity, so that requirement lifecycle changes are preserved.
38. As a user, I want paused requirements hidden from active dashboard work, so that the dashboard only shows actionable obligations.
39. As a user, I want paused requirements still visible from item detail, so that I can review and resume them later.
40. As a user, I want overdue requirements shown first on the dashboard, so that missed work gets attention before everything else.
41. As a user, I want due soon requirements shown for today through 14 days, so that near-term work is visible.
42. As a user, I want upcoming requirements shown for 15 through 30 days, so that I can plan ahead without cluttering the urgent list.
43. As a user, I want requirements beyond 30 days hidden by default, so that the dashboard stays focused.
44. As a user, I want each dashboard requirement row to show the item context, so that I know which property needs action.
45. As a user, I want each dashboard requirement row to show hand receipt context, so that global dashboard work stays understandable.
46. As a user, I want each dashboard requirement row to show the due date and status window, so that I can quickly judge urgency.
47. As a mobile user, I want dashboard requirement sections to be thumb-friendly and scannable, so that I can use them while physically working with property.
48. As a tablet or desktop user, I want the dashboard to use available space efficiently, so that requirement review does not feel like a stretched phone list.
49. As a user, I want a dashboard empty state when no requirements need attention, so that I understand the system is quiet rather than broken.
50. As a user, I want archived item requirements suppressed, so that inactive property does not create active reminders.
51. As a user, I want archived hand receipt requirements suppressed, so that inactive buckets do not create active reminders.
52. As a user, I want restored item and hand receipt requirements to return to active behavior unless individually paused, so that active property work resumes naturally.
53. As a paused/read-only user, I want the dashboard not to present requirements as active operational reminders, so that read-only state does not feel like the app is still asking me to perform work.
54. As a paused/read-only user, I want to review existing due dates and history, so that I can still understand my records.
55. As a user, I want item detail to show active requirements before detailed history, so that current work stays easy to find.
56. As a user, I want item detail to show recent requirement completion history, so that I can quickly see what was last done.
57. As a user, I want a way to view more completion history when needed, so that older work remains preserved.
58. As a user, I want requirement actions disabled or hidden consistently when I cannot write, so that the UI does not invite actions that will fail.
59. As a user, I want requirement activity labels to be readable, so that I can understand requirement changes without technical event names.
60. As a developer, I want requirement behavior owned by a requirements module, so that scheduling rules do not drift into route components.
61. As a developer, I want due-date calculation in a small testable domain service, so that interval behavior can be proven without browser tests.
62. As a developer, I want requirement completion behavior in application services, so that completion history, next-due calculation, and audit emission stay consistent.
63. As a developer, I want requirement dashboard queries exposed through a typed application boundary, so that the dashboard does not own scheduling rules.
64. As a developer, I want requirement records account-owned and protected by RLS, so that one account cannot read or mutate another account's requirements.
65. As a developer, I want requirement completion records account-owned and protected by RLS, so that completion history is isolated by account.
66. As a developer, I want requirement writes to use capability checks, so that paused/read-only behavior is enforced outside the UI.
67. As a developer, I want audit emission covered for requirement creation, editing, completion, adjustment, pause, and resume, so that accountability history remains trustworthy.
68. As a developer, I want vertical slices to land schema, service behavior, typed API, UI, tests, and docs together, so that requirements do not become a disconnected reminder widget.
69. As a future notification user, I want requirements to have clean due windows and status rules, so that email or push reminders can be added later without rewriting the domain model.
70. As a future offline user, I want requirement reads exposed through typed query boundaries, so that a later read-only offline cache can include due work without screen-specific logic.

## Implementation Decisions

- Build this phase on the existing authenticated app shell, account boundary,
  capability layer, audit foundation, hand receipt module, item module, tRPC
  setup, Drizzle schema, and local Supabase foundation.
- Introduce a requirements module as a domain-first module with application
  services, scheduling rules, persistence, module UI where useful, and tests.
- Model each requirement as account-owned and belonging to exactly one item.
- Do not add hand receipt-level, account-level, commander, PBO, or cyclic
  inventory requirements in MVP.
- Model requirement completion as permanent account-owned history, not as a
  destructive due-date update.
- Store requirement dates as date-only values.
- Support weekly, monthly, quarterly, semiannual, annual, custom-day, and
  custom-month intervals.
- Keep complex recurrence rules out of MVP, including weekday rules such as
  "third Tuesday."
- Calculate next due date from the entered completion date.
- Default completion date to today.
- Allow past completion dates.
- Block future completion dates.
- Allow optional completion notes.
- Keep completion notes lightweight and user-entered; do not encourage
  classified, PHI, sensitive operational details, or large record snapshots.
- Warn but allow duplicate requirement names on the same item.
- Use capability checks before requirement create, edit, complete, adjust,
  pause, and resume behavior.
- Let paused/read-only accounts review requirement data and history but not
  mutate requirements.
- Suppress active reminder behavior for paused/read-only accounts.
- Allow manual next-due adjustment without changing the requirement interval.
- Make completion after a manual next-due adjustment calculate from the actual
  completion date.
- Support pausing and resuming individual requirements.
- Preserve paused requirements on item detail while excluding them from active
  dashboard work.
- Suppress requirements for archived items.
- Suppress requirements for archived hand receipts.
- Restore requirements to active behavior when the item and hand receipt return
  to active status unless the requirement itself is paused.
- Emit audit events for requirement create, edit, complete, manual next-due
  adjustment, pause, and resume.
- Keep audit metadata useful but not excessive. Do not store classified, PHI,
  sensitive operational details, or large snapshots of requirement records in
  audit metadata.
- Build requirement creation, editing, completion, pause/resume, and recent
  history into item detail.
- Build dashboard requirement sections into the existing Dashboard route.
- Prioritize dashboard content as overdue requirements, due soon requirements,
  upcoming requirements, quick actions, signed-out items, and then secondary
  activity/context.
- Use dashboard windows of overdue, due soon today through 14 days, and
  upcoming 15 through 30 days.
- Hide requirements beyond 30 days by default.
- Show item and hand receipt context in dashboard requirement rows.
- Keep routes thin: routes compose module UI and call typed procedures;
  requirement rules live in module application services.
- Protect requirement and requirement completion tables with RLS.
- Use the application-set account/session context for RLS, consistent with the
  existing account-owned table direction.
- Leave email reminders, push reminders, requirement templates, reports,
  import/export, and offline cache for future phases.
- Update domain, architecture, testing, and product docs if implementation
  changes terminology, route responsibility, audit expectations, dashboard
  ordering, or requirement lifecycle behavior.

## Testing Decisions

- Use TDD where behavior is clear, especially interval validation, due-date
  calculation, completion behavior, manual next-due adjustment, pause/resume,
  suppression rules, dashboard classification, capability checks, and audit
  emission.
- Good tests should prove externally visible behavior and domain rules, not
  private implementation details.
- Unit tests should cover supported interval definitions, custom interval
  validation, next-due calculation for day and month intervals, late completion,
  early completion, past completion dates, future completion blocking, duplicate
  name warning decisions, manual adjustment rules, pause/resume state, and
  dashboard window classification.
- Unit tests should cover suppression decisions for archived items, archived
  hand receipts, paused requirements, and paused/read-only accounts.
- Integration tests should cover creating, listing, editing, completing,
  adjusting, pausing, and resuming requirements through the module service or
  typed API boundary.
- Integration tests should prove completion creates permanent history and
  updates the next due date from the completion date.
- Integration tests should prove requirement workflows emit audit events.
- Integration tests should prove paused/read-only accounts can read requirement
  data but cannot mutate requirements.
- Integration tests should cover item detail requirement surfaces when those
  workflows are exercised through typed app paths.
- Integration tests should cover dashboard requirement queries across overdue,
  due soon, upcoming, beyond-30-days, archived, and paused states.
- RLS tests are required for requirement and requirement completion tables
  because both are account-owned.
- RLS tests should prove one account cannot read or write another account's
  requirements.
- RLS tests should prove one account cannot read or write another account's
  requirement completion history.
- Browser tests should stay focused on critical flows: dashboard requirement
  visibility, requirement creation from item detail, requirement completion from
  item detail, recent completion history, read-only blocking, and basic mobile
  and desktop rendering.
- Browser tests should avoid trying to cover every interval option when smaller
  unit and integration tests prove interval behavior more clearly.
- Full verification for sliced work should include formatting, linting,
  typechecking, unit tests, integration tests, RLS tests, focused browser tests,
  build, and local Supabase checks required by the slice.

## Out of Scope

- Hand receipt-level requirements.
- Account-level requirements.
- Commander, PBO, cyclic inventory, or official system-of-record workflows.
- Shared unit task lists or multi-user assignment of requirements.
- Requirement templates.
- Manual priority levels.
- Configurable dashboard windows in MVP.
- Complex recurrence rules such as "third Tuesday."
- Email reminders.
- Push notifications.
- Calendar integration.
- Reports.
- CSV/XLSX import/export.
- Offline read cache or offline editing.
- Requirement completion sync while offline.
- QR codes, OCR, item photos, tags, or document upload behavior.
- 2062 assignment creation, upload, close, remove-item, or Active 2062s
  behavior.
- Real Stripe checkout, webhooks, invoices, customer portal, or subscription
  automation.
- Organization/team collaboration.
- Storage of classified information, PHI, or sensitive operational details.
- Hard deletion of requirement records or completion history as a normal
  workflow.

## Further Notes

This PRD is intended to be sliced into vertical implementation issues before
work begins. The slices should keep requirements tied to real item detail and
dashboard workflows instead of building a generic reminder subsystem detached
from property accountability.

The main guardrail is that scheduling rules must live in the requirements
module, not in dashboard components or item-detail UI. The dashboard should ask
for categorized requirement work; it should not own the meaning of overdue, due
soon, upcoming, paused, suppressed, or manually adjusted requirements.

The second guardrail is product language. Field Ledger requirements are
user-owned item obligations. They may represent maintenance, inspection,
calibration, replacement, or similar recurring property work, but they should
not become cyclic inventory, official reporting, a shared task system, or a
place for sensitive operational details.
