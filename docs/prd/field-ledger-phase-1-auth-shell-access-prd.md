# PRD: Field Ledger Phase 1 - Auth, Account Access, and Real App Shell

## Problem Statement

Field Ledger has a working scaffold, but it is not yet a usable product surface.
The app still needs the first real user-facing foundation: secure sign-in, a
single-owner account model, trial/access state, billing capability checks, and a
responsive authenticated shell that future property-accountability workflows can
land inside.

Without this phase, later vertical slices would have to invent their own session
handling, account initialization, access checks, route layout, and placeholder
navigation. That would create drift before the first hand receipt feature even
ships. Field Ledger needs the product doorway, account boundary, and app frame
settled early so each later module can focus on its own domain behavior instead
of rebuilding the same foundation.

This phase must also preserve the product boundary. Field Ledger is a personal
Army property-accountability tool for one owner account managing many hand
receipts. It is not an official Army system of record, not a team workspace, and
not a place for classified information, PHI, or sensitive operational details.

## Solution

Phase 1 will turn the scaffold into the first real Field Ledger application
experience. Users will be able to sign in, enter authenticated product routes,
receive an initialized owner account, and see trial/access behavior represented
through an internal capability layer.

The app will use Better Auth behind an internal session boundary so UI,
routes, and product modules do not spread provider-specific auth details. On
first entry, a signed-in user will receive a single owner account with trial
state initialized. Access state will distinguish trialing, active, and
paused/read-only accounts, while subscription tier will remain a separate
concept. Trial access will behave like Pro access for capability checks.

The UI will move from scaffold proof to the real app shell. Authenticated routes
will live inside the product area. Phone layout will use bottom navigation for
Dashboard, Items, Hand Receipts, and More. Tablet and desktop layouts will use a
collapsible left sidebar. Dashboard will become the authenticated home, with
route placeholders for future MVP surfaces that are clearly marked as not-yet
implemented rather than pretending to have product behavior.

The phase will also add minimal first-run onboarding. New users should see the
core Field Ledger boundary in plain language: property accountability only, not
an official record system, and no classified, PHI, or sensitive operational
data. This should be lightweight and useful, not a long tour.

## User Stories

1. As a user, I want to sign in securely, so that my hand receipt data is private to me.
2. As a user, I want to use email/password sign-in, so that I can access the app with a familiar account flow.
3. As a user, I want magic-link sign-in to be supported where feasible, so that I can access the app without always typing a password.
4. As a user, I want to sign out, so that I can leave Field Ledger securely on a shared or borrowed device.
5. As a signed-out visitor, I want auth pages to stay outside the product shell, so that the app does not imply I am inside my account before I sign in.
6. As a signed-out visitor, I want protected product routes to redirect me toward sign-in, so that private property-accountability screens are not exposed.
7. As a signed-in user, I want to enter the app area after authentication, so that I can begin managing my account.
8. As a signed-in user, I want my session to persist appropriately, so that I do not have to sign in on every navigation.
9. As a developer, I want auth provider details hidden behind an internal session boundary, so that product code does not directly depend on Better Auth everywhere.
10. As a developer, I want session checks to be usable from server-side workflows, so that protected operations do not rely only on client UI checks.
11. As a developer, I want session checks to be usable from the app shell, so that navigation and route protection can reflect the current user.
12. As a new user, I want an owner account created for me when I first enter Field Ledger, so that my property data has a clear ownership boundary.
13. As a new user, I want account initialization to be automatic, so that setup does not feel like configuring an organization workspace.
14. As a new user, I want account initialization to be safe to retry, so that refreshes or repeated app entry do not create duplicate account records.
15. As an individual Army property holder, I want Field Ledger to be personal to my account, so that I can manage my own property without setting up a unit or team workspace.
16. As a developer, I want account-owned data protected by RLS, so that database ownership rules exist below the UI.
17. As a developer, I want account records to support future user-owned tables, so that later hand receipt, item, contact, location, requirement, and document records can share the same account boundary.
18. As a new user, I want a 30-day trial, so that I can decide whether Field Ledger fits my workflow before paying.
19. As a trial user, I want trial access to feel like the full product, so that I can evaluate the real workflow.
20. As a product owner, I want trial access to use Pro-like capabilities, so that trial users can test the shape of the full product.
21. As a user whose trial has expired without a subscription, I want to keep access to my data, so that I do not lose accountability records.
22. As a user whose trial has expired without a subscription, I want my account to become read-only, so that the product does not silently continue active operational behavior without a plan.
23. As a Base subscriber, I want the app to know I can manage up to three active hand receipts, so that lower-tier limits can be enforced later.
24. As a Pro subscriber, I want the app to know I can manage unlimited active hand receipts, so that larger property responsibilities are supported.
25. As a developer, I want account access state separated from subscription tier, so that trialing, active, and paused behavior does not get tangled with billing provider details.
26. As a developer, I want billing and access behavior represented as capability checks, so that future product workflows can ask what the account may do without knowing about Stripe.
27. As a developer, I want simulated billing capabilities without fake checkout or webhooks, so that the MVP can prove access behavior before real billing integration.
28. As a paused user, I want product navigation to remain visible where appropriate, so that I can still review my data.
29. As a paused user, I want write actions to be blocked or disabled consistently, so that read-only mode is understandable and enforceable.
30. As a mobile user, I want a phone-first interface, so that I can use the app while physically working with property.
31. As a tablet user, I want the app to use extra screen space intelligently, so that I can review lists and details more efficiently.
32. As a desktop user, I want a professional sidebar layout, so that Field Ledger feels like a serious tool and not a stretched phone screen.
33. As a phone user, I want bottom navigation for Dashboard, Items, Hand Receipts, and More, so that the main workflows are reachable with my thumb.
34. As a tablet or desktop user, I want a collapsible left sidebar, so that I can choose between navigation visibility and workspace space.
35. As a user, I want Dashboard to be my authenticated home, so that opening Field Ledger starts from the operational overview.
36. As a user, I want the app shell to include future MVP surfaces as placeholders, so that navigation feels coherent before every workflow exists.
37. As a user, I want placeholders to be honest about what is not implemented yet, so that the app does not pretend fake product workflows exist.
38. As a mobile user, I want Active 2062s accessible without making it a primary bottom-nav item, so that the main nav stays focused.
39. As a desktop user, I want Active 2062s accessible from the sidebar or secondary navigation, so that larger layouts expose more operational surfaces.
40. As a user, I want the app to explain that Field Ledger is not an official Army system of record, so that I understand the boundary of the tool.
41. As a user, I want the app to warn against storing classified, PHI, or sensitive operational data, so that I do not misuse the product.
42. As a new user, I want first-run onboarding to be short, so that I can get into the product without a long tutorial.
43. As a new user, I want onboarding to point me toward creating my first hand receipt later, so that the first real workflow has a clear destination.
44. As a developer, I want the onboarding flow to respect access state, so that paused/read-only behavior is not bypassed by first-run screens.
45. As a developer, I want routes to stay thin and call typed procedures, so that business behavior remains in domain modules.
46. As a developer, I want account access checks to be testable in isolation, so that future slices can rely on them safely.
47. As a developer, I want app-shell behavior covered by focused browser checks, so that mobile and desktop navigation do not regress.
48. As a developer, I want this phase to avoid hand receipt, item, document, and requirement workflows, so that those domains can land as separate vertical slices.

## Implementation Decisions

- Build Phase 1 on the existing Next.js, TypeScript, Tailwind v4, shadcn/ui, tRPC, TanStack Query, Drizzle, and local Supabase foundation.
- Use Better Auth as the auth provider for this phase.
- Keep auth/session behavior behind an app-owned boundary rather than using raw provider calls across routes and UI.
- Support email/password sign-in in the initial auth surface.
- Support magic-link sign-in where feasible without delaying the core session boundary.
- Keep future social sign-in architecturally possible, but do not implement social providers in this phase.
- Put authenticated product routes inside the real Field Ledger app area.
- Keep public routes and auth routes outside the authenticated app shell.
- Create a single owner account for each signed-in user.
- Make account initialization idempotent, meaning safe to run more than once without duplicate setup.
- Treat the owner account as the product ownership unit for future hand receipts, items, contacts, locations, documents, requirements, and audit events.
- Do not introduce organization, team, unit, commander, or PBO workspace concepts.
- Model account access state separately from subscription tier.
- Support trialing, active, and paused/read-only access states.
- Initialize new accounts with a 30-day trial.
- Treat trial access as Pro-like for capability checks.
- Model Base tier as allowing up to three active hand receipts.
- Model Pro tier as allowing unlimited active hand receipts.
- Represent billing behavior as internal capability checks, not fake Stripe flows.
- Do not wire real Stripe checkout, webhooks, invoices, customer portal, or subscription automation.
- Make capability checks available to server workflows and UI workflows without exposing billing-provider details.
- Ensure expired trial with no active plan resolves to paused/read-only behavior.
- Use RLS for account-owned data created in this phase, with auth/account
  context set by the app rather than relying on `auth.uid()` as the
  auth-provider contract.
- Keep product rules in application services rather than route components, client-only checks, or RLS alone.
- Emit audit/activity only where the audit foundation exists or add explicit follow-up notes if this phase lands before that foundation.
- Implement the mock-derived responsive shell as the real product frame.
- Use phone bottom navigation for Dashboard, Items, Hand Receipts, and More.
- Use a collapsible left sidebar for tablet and desktop.
- Make Dashboard the authenticated home.
- Include route placeholders for MVP surfaces such as Items, Hand Receipts, Active 2062s, Contacts, Locations, Activity, Settings, and Billing.
- Keep placeholders honest and non-operational; they should not create fake hand receipt, item, document, or requirement behavior.
- Add minimal first-run onboarding focused on product boundary and next-step orientation.
- State the compliance boundary plainly: property accountability only, not official recordkeeping, no classified information, PHI, or sensitive operational details.
- Preserve the current local Supabase nondefault port setup.
- Preserve Phase 0 docs, repo-local skills, and architecture rules.
- Update docs when route shape, auth/session boundaries, access behavior, or terminology changes.

## Testing Decisions

- Use TDD where behavior is clear, especially account initialization, access-state resolution, and capability checks.
- Good tests should prove externally visible behavior and domain rules, not private implementation details.
- Unit tests should cover account access resolution, trial expiration behavior, Base and Pro hand receipt capability limits, and read-only capability decisions.
- Unit tests should cover account initialization rules if they can be isolated without database setup.
- Integration tests should cover signed-in account initialization, idempotent account setup, and capability lookup through the app service/API boundary.
- RLS tests should prove one account cannot read or write another account's account-owned records.
- Auth route verification should prove signed-out users cannot access protected product routes.
- Browser tests should cover sign-in/sign-out flow where locally practical.
- Browser tests should cover the app shell on mobile and desktop viewports.
- Browser tests should verify the phone bottom nav exposes Dashboard, Items, Hand Receipts, and More.
- Browser tests should verify the tablet/desktop sidebar can collapse and still preserve navigation.
- Browser tests should verify Dashboard is the authenticated home.
- Browser tests should verify first-run onboarding communicates the compliance/product boundary.
- Tests should avoid asserting provider internals unless the provider boundary itself is under test.
- Full verification for the sliced work should include formatting, linting, typechecking, unit tests, integration tests, RLS tests when database tables are introduced, focused browser tests, build, and any local Supabase checks needed by the slice.

## Out of Scope

- Hand receipt create/edit/archive/restore workflows.
- Property item create/edit/archive/restore/move workflows.
- Global item search.
- Contacts and locations management beyond any account/session support needed for this phase.
- Requirements, due date calculation, completion history, or dashboard requirement sections.
- Document upload.
- 2062 assignment creation, upload, close, remove-item, or Active 2062s behavior.
- Detailed audit browser.
- Real Stripe checkout, webhooks, invoices, customer portal, or subscription automation.
- Public marketing site.
- Organization/team collaboration.
- Commander, PBO, cyclic inventory, or official system-of-record behavior.
- CSV/XLSX import/export.
- Offline read cache or offline editing.
- Push notifications, email reminders, OCR, QR codes, item photos, tags, reports, and requirement templates.

## Further Notes

This PRD is intended to be sliced into vertical implementation issues before
work begins. Each issue should land in the real app shell and include schema,
service behavior, API, UI, tests, and docs where relevant.

The most important guardrail for this phase is avoiding provider and route
drift. Better Auth, account access, and future billing concepts should be
wrapped in Field Ledger-owned boundaries from the start. Later product modules
should be able to ask simple questions such as "who is the current owner
account?" and "can this account perform this action?" without knowing how auth
or billing is implemented.

The second guardrail is honesty in the app shell. It is good for future routes
to exist as visible product destinations, but they should not pretend to
implement workflows that belong to later phases.
