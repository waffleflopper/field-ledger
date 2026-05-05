# PRD: Field Ledger Phase 6 - MVP Hardening and Release Readiness

## Problem Statement

Field Ledger has moved through the major MVP workflow phases: authenticated
account access, the app shell, audit/activity, hand receipts, property items,
global search, contacts, locations, item requirements, private documents, and
formal 2062 assignments. The next part is not another major feature area. The
next part is making the MVP trustworthy enough to release, demo, and hand back
to future agents without hidden gaps.

The core user needs Field Ledger to behave consistently when their account is
paused/read-only. They should keep access to their property records, documents,
2062 history, requirements, and activity, but the app must not let them keep
operating as though the account is active. If some workflows block writes and
others still allow create, edit, archive, restore, upload, close, move, or
complete actions, the access model becomes confusing and the product boundary
looks unreliable.

The user also needs confidence that their data is isolated from other owner
accounts. Supabase RLS is the ownership backstop for account-owned data, but RLS
coverage must be audited across the whole MVP, not assumed because some tables
already have policies. Application services still own product rules, but the
database should prove that account-owned rows cannot be read or mutated across
accounts.

Field Ledger also depends on audit/activity history as part of the accountability
promise. Meaningful state changes should leave readable history. If major MVP
workflows do not emit activity, or if activity labels are too technical to be
useful, the user loses one of the product's main safeguards: the ability to
understand what changed and when.

Finally, the app must feel like a real mobile-first tool across phone, tablet,
and desktop. The MVP should not ship with important screens that overflow,
stretch phone layouts awkwardly, hide active 2062 access, or present paused
account reminders as active operational work. Documentation and verification
must match the actual implementation so future slices can build from a known
state instead of rediscovering MVP assumptions.

## Solution

Phase 6 will harden the MVP across five release-readiness passes:

1. A paused/read-only account pass across every MVP workflow.
2. An RLS and account-isolation audit across account-owned data.
3. An activity coverage audit across meaningful property-accountability events.
4. A responsive UX hardening pass across core app screens.
5. A verification and documentation closeout pass.

Paused/read-only accounts will keep read access to existing records and history,
but write workflows will be consistently blocked through the same capability
boundary used by the rest of the app. The UI should explain the paused state in
plain language and remove or disable operational actions where useful. The
server-side application services must remain the source of enforcement so the
read-only state is not just a visual guard.

RLS hardening will verify that all account-owned MVP tables have row-level
security (database rules that restrict row access), owner-scoped policies, and
tests for cross-account reads and writes. Any privileged or service-role access
must stay rare, isolated, and documented. RLS should protect ownership, while
application services continue to protect business behavior such as access
state, lifecycle rules, 2062 constraints, and requirement due behavior.

Activity hardening will review the MVP workflow surface and add missing events
where meaningful. Activity labels should be readable and domain-centered, not
raw implementation names. Activity should help users answer what changed across
hand receipts, items, contacts, locations, requirements, documents, and 2062
assignments without turning the MVP into a full audit browser.

Responsive UX hardening will refine the app against the established
mobile-first shell and mock-derived route responsibility. Phone navigation
should stay thumb-friendly, tablet and desktop should use the sidebar model
well, core screens should avoid overflow or overlapping content, and active
2062 access should remain discoverable without becoming a primary phone nav
item.

Verification closeout will run the repo's full local checks, reconcile docs with
implemented MVP behavior, and keep deferred post-MVP ideas explicit. This phase
should produce a shippable MVP baseline, not expand scope into import/export,
reports, OCR, photos, tags, collaboration, offline editing, or real billing
automation.

## User Stories

1. As a paused/read-only user, I want to keep viewing my hand receipts, so that I do not lose access to accountability records.
2. As a paused/read-only user, I want to keep viewing my property items, so that I can still answer what property I have.
3. As a paused/read-only user, I want to keep viewing contacts and locations, so that existing item context stays understandable.
4. As a paused/read-only user, I want to keep viewing requirements, so that historical obligation context is still available.
5. As a paused/read-only user, I want to keep viewing documents and 2062 history, so that formal accountability evidence remains available.
6. As a paused/read-only user, I want to keep viewing activity, so that I can understand past changes even while active work is paused.
7. As a paused/read-only user, I want create actions blocked consistently, so that I understand that new operational work is paused.
8. As a paused/read-only user, I want edit actions blocked consistently, so that existing records are not changed while access is read-only.
9. As a paused/read-only user, I want archive and restore actions blocked consistently, so that record lifecycle changes do not happen while access is read-only.
10. As a paused/read-only user, I want requirement completion blocked, so that the dashboard does not act like active maintenance work is still allowed.
11. As a paused/read-only user, I want requirement pause, resume, and next-due adjustment blocked, so that requirement lifecycle changes stop with other write workflows.
12. As a paused/read-only user, I want document upload blocked, so that new private files are not added while access is paused.
13. As a paused/read-only user, I want 2062 creation blocked, so that new formal assignment workflows do not start while access is paused.
14. As a paused/read-only user, I want 2062 close and remove-link actions blocked, so that formal assignment history is not mutated while access is paused.
15. As a paused/read-only user, I want item move and manual signed-to changes blocked, so that current accountability state does not change while access is paused.
16. As a paused/read-only user, I want dashboard reminders not presented as active work, so that the app does not tell me to perform actions I cannot record.
17. As a paused/read-only user, I want plain UI messaging explaining the account state, so that I know why actions are unavailable.
18. As a trial user, I want normal workflows to keep working while my trial is valid, so that hardening does not accidentally reduce trial access.
19. As an active Base user, I want normal workflows to respect the Base hand receipt limit, so that release hardening preserves tier behavior.
20. As an active Pro user, I want normal workflows to remain available, so that release hardening does not block paid active use.
21. As a user, I want hand receipt create, edit, archive, and restore behavior protected by server-side checks, so that UI-only controls are not the only safeguard.
22. As a user, I want item create, edit, archive, restore, move, location, and signed-to behavior protected by server-side checks, so that property state stays trustworthy.
23. As a user, I want requirement create, edit, complete, pause, resume, and adjustment behavior protected by server-side checks, so that requirement history stays trustworthy.
24. As a user, I want document upload and 2062 workflows protected by server-side checks, so that formal accountability records stay trustworthy.
25. As a user, I want each app-owned table protected by RLS, so that another account cannot read my data.
26. As a user, I want each app-owned table protected against cross-account writes, so that another account cannot change my records.
27. As a user, I want linked records such as items, requirements, documents, and 2062 assignment links to stay within my account, so that relationships cannot cross ownership boundaries.
28. As a user, I want account isolation tested for core workflows, so that privacy is proven instead of assumed.
29. As a user, I want private document metadata and 2062 links protected by RLS, so that uploaded accountability evidence stays account-owned.
30. As a user, I want audit/activity events protected by RLS, so that another account cannot see my history.
31. As a user, I want meaningful hand receipt events recorded, so that bucket lifecycle changes are visible.
32. As a user, I want meaningful item events recorded, so that property changes are visible.
33. As a user, I want contact and location creation or assignment changes recorded where meaningful, so that item context changes are visible.
34. As a user, I want requirement events recorded, so that completion and due-date changes are visible.
35. As a user, I want document upload events recorded, so that document history is visible.
36. As a user, I want 2062 creation, close, and item-link events recorded, so that formal assignment changes are visible.
37. As a user, I want archive/restore and close/remove history preserved, so that accountability history survives lifecycle changes.
38. As a user, I want activity labels to be readable, so that I understand history without reading technical event names.
39. As a user, I want activity context to include useful names and counts where appropriate, so that the history tells me what changed.
40. As a user, I want audit metadata to stay lightweight, so that activity does not store classified, PHI, sensitive operational details, or file contents.
41. As a phone user, I want core workflows to be thumb-friendly, so that I can use Field Ledger while physically working with property.
42. As a phone user, I want important actions and dialogs to fit the screen, so that I can complete work without layout problems.
43. As a phone user, I want text to avoid overflow or overlap, so that records remain readable.
44. As a phone user, I want active 2062 access discoverable without crowding bottom navigation, so that formal documents remain easy to find.
45. As a tablet user, I want layouts to use the extra space intelligently, so that lists, details, and actions are easier to review.
46. As a desktop user, I want the sidebar experience to feel reliable and professional, so that the app does not feel like a stretched phone screen.
47. As a desktop or tablet user, I want sidebar collapse behavior to stay reliable, so that navigation and workspace space both work.
48. As a user, I want dashboard priority preserved, so that overdue and due-soon work remains the first thing I see when active.
49. As a paused/read-only user, I want dashboard priority adjusted for read-only review, so that active operational reminders do not create confusing calls to action.
50. As a user, I want empty states to explain real state, so that the app does not feel broken when there is no data or no active work.
51. As a user, I want error states for blocked writes to be clear, so that I know whether access, validation, or another rule stopped the action.
52. As a project owner, I want the MVP verification command set documented, so that future agents know what must pass before release.
53. As a project owner, I want the local database and RLS verification expectations documented, so that account isolation can be rechecked.
54. As a project owner, I want domain docs to match implemented MVP behavior, so that future slices do not work from stale rules.
55. As a project owner, I want architecture docs to match implemented boundaries, so that future agents keep business behavior out of routes.
56. As a project owner, I want UI docs to match the implemented shell and responsive behavior, so that future UI slices do not drift.
57. As a project owner, I want testing docs to match the current suite, so that release checks are repeatable.
58. As a project owner, I want deferred post-MVP ideas clearly documented, so that hardening does not absorb future features by accident.
59. As a developer, I want read-only enforcement in application services, so that every client path receives the same product rule.
60. As a developer, I want routes and UI to compose module behavior rather than own hardening rules, so that the architecture stays easy to extend.
61. As a developer, I want RLS tests for account-owned repositories and tables, so that ownership rules survive future changes.
62. As a developer, I want activity coverage tests where behavior is important, so that future slices do not silently drop history.
63. As a developer, I want responsive browser tests focused on critical flows, so that UI confidence improves without creating a brittle suite.
64. As a developer, I want the final MVP closeout to avoid unrelated refactors, so that release readiness stays reviewable.

## Implementation Decisions

- Treat this phase as MVP hardening and release readiness, not a new feature phase.
- Build on the existing authenticated app shell, account access model, billing capability boundary, audit module, hand receipt module, item module, contacts module, locations module, requirements module, documents module, assignments-2062 module, tRPC setup, Drizzle schema, local Supabase setup, RLS session context, and provider boundaries.
- Keep one owner account as the product ownership unit.
- Preserve the product boundary: Field Ledger is not an official Army system of record and must not store classified information, PHI, or sensitive operational details.
- Preserve the MVP online-first decision.
- Preserve the import/export, reports, OCR, item photos, tags, collaboration, offline editing, real Stripe automation, email reminders, and push reminders boundaries as post-MVP unless a later PRD changes scope.
- Use the existing capability boundary to decide whether an account can perform write workflows.
- Treat `paused_read_only` as view-only access to existing records and history.
- Treat expired trial/no active plan behavior as read-only through the same capability model, even when persisted account state has not yet been updated.
- Enforce read-only behavior in application services, not only route components or UI state.
- UI controls should disable, hide, or explain blocked write actions in the places where users encounter them.
- Read-only messaging should be simple and user-facing. Prefer clear product language over billing-provider language.
- Dashboard requirement work should not be presented as active operational work for paused/read-only accounts.
- Review all MVP write workflows for read-only enforcement, including create, edit, archive, restore, complete, pause, resume, upload, link, close, remove, move, location change, signed-to assignment, and generated-state mutations.
- Keep application services responsible for business rules such as access state, hand receipt limits, archive behavior, assignment rules, requirement rules, and 2062 constraints.
- Keep routes thin: routes compose module UI and call typed procedures.
- Keep provider details behind app-owned boundaries. Hardening should not introduce direct Better Auth, Supabase Storage, Stripe, or raw provider calls into UI/domain code.
- Verify every account-owned MVP table has RLS enabled.
- Verify every account-owned MVP table has owner-scoped policies for the operations it supports.
- Verify linked account-owned records cannot cross ownership boundaries through foreign keys, policies, or service-layer validation as appropriate.
- Keep RLS policies based on the application-set session context, consistent with the existing app-owned auth/account boundary.
- Keep privileged or service-role database access rare, isolated, and documented.
- Treat RLS as ownership protection and application services as product-behavior protection.
- Audit the activity surface for missing meaningful events across hand receipts, items, contacts, locations, requirements, documents, and 2062 assignments.
- Emit activity from application services after successful state changes.
- Avoid audit noise when a user submits a no-op change.
- Keep audit metadata lightweight and useful. Do not store document contents, large snapshots, classified information, PHI, sensitive operational details, or unnecessary personal data in audit metadata.
- Keep activity labels readable and domain-centered.
- Activity UI should show useful names and context where available, not raw ids or technical event strings.
- Keep the Activity surface simple for MVP; do not build a full audit browser, advanced filtering, exports, or admin audit tools in this phase.
- Use the mock-derived app shell as the source of truth for layout, route responsibility, and workflow intent.
- Preserve phone bottom navigation and tablet/desktop collapsible sidebar behavior.
- Keep Active 2062s discoverable on mobile without making it a primary bottom navigation item.
- Review core screens on phone, tablet, and desktop for overflow, overlap, unreachable actions, cramped dialogs, poor empty states, and awkward stretched layouts.
- Responsive hardening may refine UI components, copy, layout, spacing, and navigation affordances, but should not redesign the product or introduce a new visual system.
- Update docs when implemented behavior, terminology, commands, route responsibility, testing expectations, or architecture boundaries differ from the current docs.
- Add an ADR only if hardening discovers or requires a major architecture or product-boundary decision.
- Keep verification repeatable through the documented pnpm commands.

## Testing Decisions

- Use TDD where the hardening slice has clear behavior to prove.
- Good tests should verify externally visible behavior and domain rules, not private implementation details.
- Unit tests should cover application-service read-only blocking for representative write workflows across hand receipts, items, requirements, documents, and 2062 assignments.
- Unit tests should cover capability decisions for trialing, active Base, active Pro, expired trial/no active plan, and paused/read-only states.
- Unit tests should cover activity emission decisions where a workflow has meaningful state changes.
- Unit tests should cover no-op behavior where a repeated or unchanged request should not emit audit noise.
- Integration tests should cover representative typed API workflows that must block paused/read-only writes while preserving reads.
- Integration tests should cover representative activity reads and readable labels for hardened workflow events.
- Integration tests should cover dashboard behavior for active accounts and paused/read-only accounts.
- RLS tests should cover every account-owned MVP table and the operations that table supports.
- RLS tests should prove cross-account reads are blocked.
- RLS tests should prove cross-account writes are blocked.
- RLS tests should cover relationship boundaries where a table links records such as hand receipts, items, requirements, documents, assignment records, or assignment item links.
- RLS repository tests should be added where app adapters need proof that authenticated database sessions cannot access another account's rows.
- Browser tests should stay focused on critical release-readiness flows instead of covering every button.
- Browser tests should include mobile and desktop app shell behavior.
- Browser tests should cover dashboard requirement visibility and paused/read-only dashboard treatment.
- Browser tests should cover at least one blocked read-only write path from the UI.
- Browser tests should cover Active 2062 discoverability and core layout behavior where the UX hardening pass touches that surface.
- Responsive verification should include phone, tablet, and desktop viewports for core screens.
- Full closeout should run lint, typecheck, unit tests, integration tests, RLS tests, focused browser tests, and formatting checks.
- Local database verification should remain separate where local Supabase is required.
- If the repo's verification command fails for an environment issue, document the blocker clearly and still run the narrower checks that can run.
- Prior art exists in the current account capability tests, hand receipt workflow tests, item workflow tests, requirement tests, document tests, assignments-2062 tests, RLS tests, and app shell/browser tests. Hardening should extend those patterns instead of inventing a separate verification style.

## Out of Scope

- New major product features.
- Organization or team collaboration.
- Official Army system-of-record behavior.
- Storage of classified information, PHI, or sensitive operational details.
- Real Stripe checkout, webhooks, invoices, customer portal, or subscription automation.
- CSV/XLSX import/export implementation.
- Dedicated reports module.
- Offline read cache or offline editing.
- Push notifications or email reminders.
- OCR or automatic extraction from 2062 scans.
- Item photos.
- QR code generation or scanning.
- Tags, categories, hand receipt sections, or requirement templates.
- Complex calendar recurrence rules.
- Multi-hand-receipt 2062 assignments.
- Multi-user shared hand receipts.
- Full audit browser, advanced activity filters, audit export, or admin audit tooling.
- New design system, major app-shell redesign, or pixel-perfect mock recreation.
- Broad unrelated refactors.
- Hard deletion of accountable records as a normal workflow.

## Further Notes

This PRD should be sliced with `to-issues` into small vertical hardening slices.
The expected issue order is:

1. Read-only account behavior pass.
2. RLS and account isolation audit.
3. Activity coverage audit.
4. Responsive UX hardening.
5. Verification and documentation closeout.

The slices should remain demoable or verifiable on their own. For example, a
read-only slice should prove representative blocked workflows end to end, while
the RLS slice should prove account isolation independently of UI polish.

This phase should leave Field Ledger with a clear MVP baseline: the product
does what the MVP says, the docs describe the behavior that exists, the major
ownership and access rules are enforced below the UI, and the verification
commands give future agents a trustworthy release-readiness checklist.
