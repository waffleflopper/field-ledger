# PRD: Field Ledger MVP

## Problem Statement

Individual Army hand receipt and sub-hand receipt holders need a practical way to manage property accountability without turning their own tracking process into a brittle spreadsheet, a pile of scanned 2062s, or a memory exercise. The user needs to know what property they have, where it is, who it is signed to, which 2062s are active, and what item-level requirements are overdue or coming due.

The current problem is not a lack of official systems. It is that the individual holder needs a personal operational tool that helps them stay organized while still respecting the reality that official records, regulations, commanders, and property book offices remain outside this app. The product must be personal, mobile-first, and fast enough to use during real property work, while still being structured enough to grow into a subscription service without drifting into accidental architecture.

The project also has a second problem: because this codebase will be built heavily with AI-assisted development, the project needs strong documentation, domain language, module boundaries, provider boundaries, testing expectations, and UI plans from the beginning. The MVP must not become a single giant demo route that only proves a vertical slice. It must become the first real version of the product shell and workflows.

## Solution

Field Ledger will be a mobile-first personal web app for individual Army property accountability. One owner account can manage many hand receipts. Each hand receipt is a lightweight bucket for property items, with optional formal metadata. Each item represents one physical accountable item and can track nomenclature, ECN, serial number, app-generated ID, location, signed-to state, 2062 coverage, recurring requirements, and history.

The app will support reusable account-level contacts and locations. Manual signed-to state will reference a contact even when no 2062 exists. Formal 2062 workflows will support both quick single-item upload from an item detail page and multi-item upload from a hand receipt. Uploaded 2062 documents will be stored privately, linked to assignment records, and preserved by default.

Recurring item requirements will help the user track maintenance, inspections, calibration, battery replacement, or similar item-specific obligations. Requirements will calculate next due dates from the date work was last completed, preserve completion history, and surface overdue and upcoming work on the dashboard.

The MVP will include account/trial/access state, simulated billing capabilities, audit/activity history, global search, hand receipt and item management, contacts, locations, requirements, document upload, 2062 assignment workflows, and a responsive app shell. The UI will be mobile-first, with phone bottom navigation and a collapsible desktop/tablet sidebar. The design mock is layout and workflow truth, but not pixel-perfect law.

The codebase will use a single Next.js app repo with strong domain-first modules, Better Auth for auth/session behavior, Supabase Postgres/Storage, Drizzle migrations, tRPC, TanStack Query, Tailwind v4, shadcn/ui, local Supabase development, and explicit provider boundaries for auth, account access, billing, file storage, audit, notifications, and future import/export.

## User Stories

1. As an individual Army property holder, I want to manage my hand receipts in one app, so that I can keep track of my property without relying on scattered spreadsheets or memory.
2. As an individual Army property holder, I want the app to be personal to my account, so that I can manage my own property without setting up an organization workspace.
3. As a user, I want to sign in securely, so that my hand receipt data is private to me.
4. As a user, I want to use email/password sign-in, so that I can access the app with a familiar account flow.
5. As a user, I want to use magic-link sign-in, so that I can access the app without always typing a password.
6. As a future user, I want the app architecture to allow social sign-in later, so that I can choose a convenient login method if the product adds it.
7. As a new user, I want a 30-day trial, so that I can decide whether Field Ledger fits my workflow before paying.
8. As a trial user, I want trial access to feel like the full product, so that I can evaluate the real workflow.
9. As a user whose trial has expired without a subscription, I want to keep access to my data, so that I do not lose accountability records.
10. As a user whose trial has expired without a subscription, I want the account to become read-only, so that the product does not silently continue active operational behavior without a plan.
11. As a Base subscriber, I want to manage up to three active hand receipts, so that I can use the lower tier if my needs are modest.
12. As a Pro subscriber, I want unlimited active hand receipts, so that I can manage larger property responsibilities.
13. As a user, I want archived hand receipts not to count against normal active workflows, so that old records do not clutter my day-to-day view.
14. As a user, I want the app to explain that it is not an official Army system of record, so that I understand the boundary of the tool.
15. As a user, I want the app to warn against storing classified, PHI, or sensitive operational data, so that I do not misuse the product.
16. As a mobile user, I want a phone-first interface, so that I can use the app while physically working with property.
17. As a tablet user, I want the app to take advantage of extra screen space, so that I can review lists and details more efficiently.
18. As a desktop user, I want a professional sidebar layout, so that the app feels like a serious tool and not a stretched phone screen.
19. As a desktop or tablet user, I want the sidebar to be collapsible, so that I can choose between navigation visibility and workspace space.
20. As a user, I want Dashboard, Items/Search, Hand Receipts, and More as primary mobile navigation, so that I can get to core workflows quickly.
21. As a user, I want the dashboard to prioritize overdue and due-soon requirements, so that I immediately know what needs attention.
22. As a user, I want quick actions on the dashboard, so that I can quickly add an item, upload a 2062, search, or start common work.
23. As a user, I want signed-out items visible after more urgent dashboard work, so that I can monitor current property accountability.
24. As a user, I want simple recent activity visible, so that I can see important changes without opening a full audit browser.
25. As a user, I want to create hand receipts, so that I can organize property into the buckets I actually manage.
26. As a user, I want hand receipt metadata to be optional, so that I can start with a simple bucket and add formal details only when useful.
27. As a user, I want to edit hand receipt metadata, so that I can correct or refine records over time.
28. As a user, I want to archive a hand receipt, so that it leaves day-to-day workflows without deleting history.
29. As a user, I want to restore an archived hand receipt, so that I can recover from mistakes or resume tracking.
30. As a user, I want archived hand receipts to suppress contained reminders, so that old records do not create false operational work.
31. As a user, I want to create property items inside a hand receipt, so that every item has a clear bucket from the start.
32. As a user, I want each item to represent one physical piece of property, so that location, assignment, requirements, and history remain clear.
33. As a user, I want item nomenclature to be required, so that each item has a human-readable identity.
34. As a user, I want ECN to be optional but supported, so that I can track the identifier when it exists.
35. As a user, I want serial number to be optional but supported, so that I can track serialized items.
36. As a user, I want every item to have ECN, serial number, or generated app ID, so that no item exists without any stable identifier.
37. As a user, I want to generate an app ID when ECN and serial number are unknown, so that I can still track the item.
38. As a user, I want generated app IDs to be stable, so that future labels, QR codes, and searches keep working.
39. As a user, I want duplicate item names to be allowed, so that I can track many of the same item type.
40. As a user, I want duplicate ECN or serial number warnings, so that I can catch likely data mistakes.
41. As a user, I want duplicate ECN or serial number entries to be confirmable, so that the app does not block messy real-world records.
42. As a user, I want to edit ECN and serial number with audit history, so that I can correct mistakes without losing accountability.
43. As a user, I want to archive an item, so that turned-in or transferred property leaves active workflows.
44. As a user, I want to restore an archived item, so that I can undo an accidental archive.
45. As a user, I want to move an item between my hand receipts, so that I can reflect property moving between buckets I manage.
46. As a user, I want the app to block moving an item with an active 2062 to another hand receipt, so that formal 2062 meaning stays intact.
47. As a user, I want to search globally across all hand receipts, so that I do not need to remember where an item is filed.
48. As a user, I want search results to show the hand receipt each item belongs to, so that global results stay understandable.
49. As a user, I want search to include ECN, serial number, generated ID, nomenclature, contact, location, and hand receipt context, so that I can find items from whatever detail I know.
50. As a user, I want archived records excluded from normal search by default, so that active work stays uncluttered.
51. As a user, I want an option to include archived records in search, so that I can find historical property records.
52. As a user, I want reusable contacts, so that assignee names stay consistent.
53. As a user, I want only contact display name to be required, so that contact creation stays fast.
54. As a user, I want the signed-to field to suggest existing contacts, so that I avoid creating duplicates like differently formatted names.
55. As a user, I want typing a new signed-to name to create a contact, so that manual signed-to state still references a structured record.
56. As a user, I want contacts to be account-wide, so that the same person can be used across multiple hand receipts.
57. As a user, I want reusable locations, so that item places stay consistent.
58. As a user, I want locations to be optional, so that I can track items even when location is unknown or not useful.
59. As a user, I want locations to be account-wide, so that the same room or place can apply across hand receipts.
60. As a user, I want location changes audited, so that item movement history is trustworthy.
61. As a user, I want to manually sign an item to a contact without a 2062, so that the app supports the risky but real workflow some people use.
62. As a user, I want manual signed-to items clearly marked as having no 2062, so that I can distinguish formal and informal accountability.
63. As a user, I want manual signed-to items included in signed-out item views, so that I see everything currently assigned out.
64. As a user, I want Active 2062s to show only formal 2062 assignments, so that the term stays accurate.
65. As a user, I want to upload a 2062 directly from an item, so that one-off assignments are quick.
66. As a user, I want to upload a 2062 from a hand receipt and select multiple items, so that I can handle a multi-item 2062 efficiently.
67. As a user, I want a 2062 upload to require a contact, so that every formal assignment has a person.
68. As a user, I want a 2062 upload to require at least one item, so that no empty assignment exists.
69. As a user, I want a 2062 upload to require a document, so that formal coverage has attached evidence.
70. As a user, I want one 2062 assignment to be scoped to one hand receipt, so that the workflow matches how the form should come out of a hand receipt.
71. As a user, I want the hand receipt-level 2062 flow to limit item selection to that hand receipt, so that I cannot accidentally mix buckets.
72. As a user, I want uploading a 2062 for a manually signed-to item to convert it to formal 2062 coverage, so that the item state stays clean.
73. As a user, I want one item to have at most one active 2062 link, so that current accountability is unambiguous.
74. As a user, I want an item to preserve many historical 2062 links, so that I can see past assignment history.
75. As a user, I want to close a whole 2062 assignment, so that returned property no longer appears signed out.
76. As a user, I want closing a 2062 to clear current signed-to state on linked items, so that returned items are no longer shown as assigned out.
77. As a user, I want to remove one item from a multi-item 2062, so that one returned item can be handled without closing the whole assignment.
78. As a user, I want past close dates allowed for 2062s, so that I can record returns after the fact.
79. As a user, I want uploaded 2062 files preserved by default, so that accountability evidence is not destroyed.
80. As a user, I want uploaded documents private, so that scans are not publicly accessible.
81. As a user, I want to see Active 2062s in a simple list, so that I can quickly answer what formal documents are still out.
82. As a mobile user, I want Active 2062s accessible without making it a bottom-nav item, so that the main nav stays focused but the workflow is still easy to reach.
83. As a desktop user, I want Active 2062s accessible from the sidebar or secondary navigation, so that the larger layout exposes more operational surfaces.
84. As a user, I want to create item requirements, so that recurring property obligations are tracked with the item.
85. As a user, I want requirement intervals for weekly, monthly, quarterly, semiannual, annual, custom days, and custom months, so that common schedules are supported.
86. As a user, I want requirements to calculate from last completed date, so that late work moves the next due date realistically.
87. As a user, I want completing a requirement to create history, so that past work is preserved.
88. As a user, I want to enter a past completion date, so that I can record work after doing it.
89. As a user, I want future completion dates blocked, so that requirement history does not contain impossible completions.
90. As a user, I want optional completion notes, so that I can record useful context when needed.
91. As a user, I want to manually adjust a requirement’s next due date, so that local reality can be reflected.
92. As a user, I want duplicate requirement names on the same item to warn but not block, so that I can catch mistakes without losing flexibility.
93. As a user, I want archived items and hand receipts to suppress requirements, so that inactive records do not create active reminders.
94. As a user, I want restored items and hand receipts to resume requirements unless individually paused, so that active work returns naturally.
95. As a user, I want the dashboard to show overdue requirements, so that I can act on missed work first.
96. As a user, I want the dashboard to show due-soon requirements through 14 days, so that near-term work is visible.
97. As a user, I want the dashboard to show upcoming requirements from 15 to 30 days, so that I can plan ahead without clutter.
98. As a user, I want requirements beyond 30 days hidden by default, so that the dashboard stays focused.
99. As a user, I want due thresholds to be configurable later, so that the MVP default does not permanently lock the product.
100. As a user, I want audit/activity history from the start, so that important accountability changes are not lost.
101. As a user, I want activity labels to be readable, so that I can understand what changed without reading technical logs.
102. As a user, I want item detail activity, so that I can understand recent changes to a specific item.
103. As a user, I want hand receipt activity where useful, so that I can see recent changes inside a bucket.
104. As a future user, I want import/export to be planned as a module boundary, so that CSV/XLSX support can be added later without messy screen-specific logic.
105. As a future user, I want offline read cache to be architecturally possible later, so that I can eventually view recent property data without a connection.
106. As a future user, I want QR-code support to be possible later, so that I can scan an item and open its record quickly.
107. As a future user, I want optional item photos to be possible later, so that I can add visual context when helpful.
108. As a future user, I want OCR to be possible later, so that 2062 scans can eventually help populate or verify data.
109. As a developer, I want strong module boundaries, so that AI-assisted development does not scatter business rules.
110. As a developer, I want provider boundaries for Supabase, Stripe, storage, and notifications, so that integrations can change without rewriting domain logic.
111. As a developer, I want RLS protecting account-owned data, so that database ownership rules exist below the UI.
112. As a developer, I want app services enforcing business behavior, so that RLS handles ownership while modules handle product rules.
113. As a developer, I want tRPC to be the main app API layer, so that UI and server operations remain typed.
114. As a developer, I want domain-first modules, so that tests and behavior stay close to the domain language.
115. As a developer, I want Phase 0 docs and ADRs to govern implementation, so that future decisions are explicit.
116. As a developer, I want slice issues to be TDD-ready, so that `field-ledger-slice` can implement them completely.
117. As a developer, I want the MVP built into the real UI shell, so that vertical slices do not produce a fake product.
118. As a developer, I want focused tests around domain rules and workflows, so that the codebase stays safe without becoming brittle.

## Implementation Decisions

- Build Field Ledger as a single Next.js App Router application, not a monorepo.
- Use TypeScript, Tailwind v4, shadcn/ui, pnpm, tRPC, TanStack Query, Drizzle, Better Auth, Supabase Postgres, Supabase Storage, and local Supabase development.
- Use Vercel, hosted Supabase, and Stripe as the production direction.
- Start from a modern Next/shadcn foundation and add selected T3-style pieces manually rather than relying on a scaffold to define the architecture.
- Use Better Auth as the default auth provider.
- Preserve room for future social sign-in and linked auth identities.
- Keep auth/session behavior behind an app-owned boundary.
- Use Supabase RLS as the database ownership backstop for account-owned data,
  with application-set auth/account context rather than `auth.uid()` as the
  auth-provider contract.
- Keep product behavior in application services rather than relying on UI checks or RLS alone.
- Use Drizzle for app schema and migrations.
- Store user-owned app data with account ownership.
- Keep service-role or privileged database access rare, isolated, and documented.
- Make one owner account the unit of product ownership.
- Do not add organization/team collaboration in MVP.
- Keep account access state separate from subscription tier.
- Support trialing, active, and paused/read-only account access states.
- Model a 30-day trial with Pro-like access.
- Model Base as up to three active hand receipts.
- Model Pro as unlimited active hand receipts.
- After trial expiration with no active plan, keep data visible but make the account read-only.
- Treat Stripe as the likely real billing provider, but do not wire real checkout/webhooks in MVP.
- Implement simulated billing as capability checks, not fake invoices or fake checkout.
- Use domain-first modules for accounts, audit, billing, hand receipts, items, contacts, locations, documents, 2062 assignments, requirements, import/export, provider boundaries, and the app shell.
- Keep routes thin and make them compose module UI and typed procedures.
- Use tRPC procedures to call module application services.
- Allow Server Actions only for narrow framework-native use cases, and still route behavior through module services.
- Treat the design mock as source of truth for layout, route responsibility, and workflow intent.
- Do not treat the mock as pixel-perfect styling law.
- Use authenticated product routes under an app route group.
- Use bottom navigation on phone.
- Use a collapsible left sidebar on tablet and desktop.
- Make Dashboard the authenticated home.
- Prioritize dashboard content as overdue/upcoming requirements, quick actions, signed-out items, and then secondary activity/context.
- Make hand receipts lightweight buckets with required name and optional formal metadata.
- Support hand receipt archive and restore.
- Archive hand receipts rather than deleting them.
- Suppress contained reminders when a hand receipt is archived.
- Make one property item record represent one physical item.
- Require item nomenclature and hand receipt ownership.
- Require ECN, serial number, or generated app ID for every item.
- Allow ECN-only, serial-only, ECN plus serial, and generated-ID-only items.
- Keep generated item IDs permanent and human-friendly.
- Allow duplicate item names.
- Warn but allow duplicate ECN or serial numbers.
- Allow ECN and serial edits with audit history.
- Support item archive, restore, and movement between hand receipts.
- Block moving an item with an active 2062 link to another hand receipt until that link is closed.
- Make contacts account-wide and lightweight.
- Require only contact display name.
- Make manual signed-to state reference a contact record.
- Create a contact inline when the user types a new signed-to name.
- Make locations account-wide, reusable, optional, and name-only in MVP.
- Store 2062 files as private document records.
- Preserve uploaded documents by default.
- Model a 2062 assignment as belonging to one account, one hand receipt, one contact, one primary document, and one or more linked items from that hand receipt.
- Require contact, document, and at least one item to create a 2062 assignment.
- Allow at most one active 2062 link per item.
- Preserve many historical closed 2062 links per item.
- Support direct single-item 2062 upload from an item.
- Support multi-item 2062 upload from a hand receipt.
- Convert manual signed-to state to formal 2062 coverage when a 2062 is uploaded for that item.
- Closing a 2062 clears current signed-to state for linked items.
- Removing one item from a multi-item 2062 clears only that item’s current signed-to state.
- Allow past 2062 return/close dates and block or warn on future dates.
- Make Active 2062s a simple MVP list for formal 2062 assignments only.
- Make requirements item-level only.
- Do not model commander/PBO cyclic inventories in MVP.
- Support weekly, monthly, quarterly, semiannual, annual, custom-day, and custom-month requirement intervals.
- Calculate next due date from last completed date.
- Preserve requirement completion history.
- Allow past completion dates and block future completion dates.
- Allow optional completion notes.
- Allow manual next due date adjustment without changing the interval.
- Warn but allow duplicate requirement names on the same item.
- Surface overdue, due-soon, and upcoming requirements using the agreed dashboard windows.
- Record audit/activity events for meaningful state changes from the start.
- Surface activity simply in MVP, with detailed audit browsing deferred.
- Define import/export as an early post-MVP module boundary but do not implement CSV/XLSX import/export in MVP.
- Reserve offline read-cache as a future architecture path but do not implement offline behavior in MVP.
- Defer QR codes, OCR, item photos, reports, tags, collaboration, requirement templates, email reminders, push reminders, and real billing automation.

## Testing Decisions

- Use TDD for feature slices where behavior is clear and testable.
- Good tests should verify external behavior and domain rules, not private implementation details.
- Unit tests should cover pure domain rules such as item identifier validation, duplicate warning decisions, generated ID behavior, subscription capability checks, requirement due date calculation, requirement completion behavior, archive/restore rules, and 2062 state transitions.
- Integration tests should cover module workflows such as account initialization, hand receipt create/edit/archive/restore, item create/edit/archive/restore/move, contact and location assignment, requirement completion, document upload metadata, 2062 link/close behavior, and audit event emission.
- RLS tests are required for account-owned tables and should prove that one account cannot read or write another account’s rows.
- Browser/UI tests should be focused on critical flows rather than every button.
- UI tests should cover the app shell on mobile and desktop, dashboard requirement visibility, global search, single-item 2062 upload, multi-item 2062 upload, and route navigation.
- Provider boundary tests should prove that business workflows use app-owned services rather than direct provider calls.
- Billing/access tests should cover trialing, active Base, active Pro, and paused/read-only behavior.
- Requirement tests should cover late completion recalculation, manual due date adjustment, past completion date support, and future date blocking.
- 2062 tests should cover single-item assignment, multi-item assignment, manual-to-2062 conversion, closing an assignment, removing one item link, active-link uniqueness, and move constraints.
- Activity/audit tests should verify that major workflows emit useful events.
- Tests should be added with each vertical slice rather than deferred to the end.
- The final MVP hardening pass should run lint, typecheck, unit tests, integration tests, RLS tests, and focused browser tests.

## Out of Scope

- Organization/team collaboration.
- Account ownership transfer.
- Official Army system-of-record behavior.
- Storage of classified information, PHI, or sensitive operational details.
- Real Stripe checkout, webhooks, invoices, customer portal, or subscription automation in MVP.
- Public marketing site.
- CSV/XLSX import/export implementation.
- Dedicated reports module.
- Offline read cache or offline editing.
- Push notifications or email reminders.
- OCR or automatic extraction from 2062 scans.
- Item photos.
- QR code generation or scanning.
- Tags, categories, or hand receipt sections.
- Requirement templates.
- Complex calendar recurrence rules such as “third Tuesday.”
- Multi-hand-receipt 2062 assignments.
- Multi-user shared hand receipts.
- Heavy onboarding tour.
- Hard deletion of accountable records as a normal workflow.
- Pixel-perfect cloning of the mockup.
- Placeholder mega-route MVP.

## Further Notes

This PRD governs scaffold through MVP. The smaller phase plans are intended to be sliced with `to-issues` and implemented with `field-ledger-slice`.

The project should preserve the distinction between current MVP behavior and reserved future architecture paths. Import/export, offline read cache, QR codes, item photos, OCR, reports, and real Stripe automation are intentionally important future directions, but they should not leak into MVP scope unless a new decision explicitly changes the plan.

The product should stay personal, operational, and practical. Field Ledger should feel like a professional field utility for repeated accountability work, not a generic SaaS dashboard or a marketing shell.

Because AI agents are expected to help build this project, the docs, ADRs, issue templates, and repo-local skills are not optional ceremony. They are part of the product’s engineering strategy.
