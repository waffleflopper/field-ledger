# Plan: Auth, Account Access, and Real App Shell

> Source: Field Ledger MVP scope, UI spec, ADR 0001, ADR 0002, and ADR 0004.

This plan creates the first real user-facing foundation: sign-in, account records, trial/access state, and the responsive product shell.

## Architectural Decisions

- **Auth provider**: Better Auth behind the app-owned auth/session boundary.
- **Account ownership**: one owner account owns all user data.
- **Access model**: access state is separate from subscription tier.
- **Trial**: 30-day trial with Pro-like access.
- **Expired trial/no plan**: account-paused/read-only.
- **Routes**: product routes under `/app/...`.
- **Shell**: phone bottom nav; tablet/desktop collapsible left sidebar.
- **Billing**: simulated capability checks only; no Stripe checkout/webhooks yet.
- **Provider rule**: auth and billing logic stay behind app-owned boundaries.

---

## Phase 1: Better Auth Sign-In and Session Boundary

**User stories covered**: As a user, I can sign in to Field Ledger and reach the app area securely.

### What To Build

Add Better Auth sign-in using email/password support for the scaffold stage. Create an internal session boundary so app code does not spread provider-specific session logic.

### Acceptance Criteria

- [x] A user can sign in and sign out locally.
- [x] Authenticated `/app/...` routes require a session.
- [x] Public/auth routes remain outside the app shell.
- [x] App code uses an internal session boundary rather than raw provider calls everywhere.
- [x] Tests or verification steps prove protected route behavior.

---

## Phase 2: Account Record and Trial Initialization

**User stories covered**: As a new user, my account is initialized with trial access when I first enter the app.

### What To Build

Create the account model and first-run account initialization behavior, including trial start/end fields and basic account access state.

### Acceptance Criteria

- [x] New signed-in users get an account record.
- [x] Trial state is initialized consistently.
- [x] Access state can distinguish trialing, active, and paused/read-only.
- [x] User-owned account data is protected by RLS.
- [x] Account initialization is idempotent (safe to run more than once).

---

## Phase 3: Account Access and Billing Capability Layer

**User stories covered**: As the product owner, I can simulate subscription tiers without wiring Stripe yet.

### What To Build

Add the access/capability layer that answers questions such as whether the account can create hand receipts, whether the account is paused, and which tier limits apply.

### Acceptance Criteria

- [x] Trial accounts receive Pro-like capabilities.
- [x] Base tier capability limit is 3 active hand receipts.
- [x] Pro tier capability allows unlimited hand receipts.
- [x] Expired trial with no active plan becomes read-only.
- [x] UI/server workflows can ask capabilities without knowing billing-provider details.
- [x] No fake checkout, fake invoice, or fake webhook system is introduced.

---

## Phase 4: Responsive App Shell

**User stories covered**: As a user, I can navigate the real Field Ledger shell on phone, tablet, and desktop.

### What To Build

Implement the mock-derived app shell with authenticated `/app/...` routing, phone bottom nav, desktop/tablet collapsible sidebar, and route placeholders that clearly mark future surfaces.

### Acceptance Criteria

- [x] Phone layout uses bottom navigation: Dashboard, Items, Hand Receipts, More.
- [x] Tablet/desktop layout uses a collapsible left sidebar.
- [x] Dashboard is the default authenticated home.
- [x] The initial route map exists with appropriate placeholder states.
- [x] Placeholder content does not implement fake product workflows.
- [x] Browser/UI verification covers mobile and desktop shell behavior.

---

## Phase 5: Minimal First-Run Onboarding

Implementation reference: issue #12 adds account-level
`onboarding_completed_at` state, tRPC onboarding procedures, and an app-shell
boundary notice.

**User stories covered**: As a new user, I understand the app boundary and can start by creating my first hand receipt later.

### What To Build

Add lightweight first-run onboarding that communicates the product boundary and directs the user toward creating a first hand receipt once that feature exists.

### Acceptance Criteria

- [x] The app states the lightweight compliance boundary: property accountability only, no classified/PHI/sensitive operational data.
- [x] The onboarding flow is minimal and does not become a long tour.
- [x] Onboarding routes build into the real shell/auth flow.
- [x] The flow respects paused/read-only access state.
