# Plan: MVP Hardening and Release Readiness

> Source: Field Ledger MVP scope, testing strategy, architecture docs, and AI change guidelines.

This plan tightens the MVP after the major feature plans land. It should not add major new features.

## Architectural Decisions

- **MVP is online-first**.
- **Import/export boundary exists but implementation is post-MVP**.
- **Reports, OCR, item photos, tags, collaboration, and offline editing are out of MVP**.
- **Account paused/read-only state must be respected everywhere**.
- **Audit/activity must cover major workflows**.
- **RLS protects account-owned data**.

---

## Phase 1: Read-Only Account State Pass

**User stories covered**: As a paused user, I keep access to my data but cannot keep operating the app as active.

### What To Build

Audit and enforce paused/read-only account behavior across all MVP workflows.

### Acceptance Criteria

- [x] Paused accounts can view their existing data.
- [x] Paused accounts cannot create, edit, archive, restore, complete, upload, link, close, or move records.
- [x] Dashboard does not present reminders as active operational work for paused accounts.
- [x] UI messaging explains account paused/read-only state simply.
- [x] Tests cover representative blocked workflows.

---

## Phase 2: RLS and Account Isolation Audit

**User stories covered**: As a user, my property data is isolated from other accounts.

### What To Build

Verify RLS coverage and account isolation for all MVP user-owned tables and workflows.

### Acceptance Criteria

- [x] Every account-owned table has RLS enabled.
- [x] Policies prevent cross-account reads.
- [x] Policies prevent cross-account writes.
- [x] Service-role or privileged access, if any, is documented and isolated.
- [x] RLS tests cover core domain tables.

---

## Phase 3: Activity Coverage Audit

**User stories covered**: As a user, major accountability events are visible in activity/history.

### What To Build

Audit MVP workflows for missing audit events and make activity surfaces coherent.

### Acceptance Criteria

- [x] Hand receipt workflows emit expected events.
- [x] Item workflows emit expected events.
- [x] Contact/location changes emit expected events where meaningful.
- [x] Requirement workflows emit expected events.
- [x] 2062/document workflows emit expected events.
- [x] Activity UI shows useful labels and context.

---

## Phase 4: Responsive UX Hardening

**User stories covered**: As a user, Field Ledger feels like a real mobile-first tool on phone, tablet, and desktop.

### What To Build

Review and refine MVP screens against the mock-derived UI spec and responsive requirements.

### Acceptance Criteria

- [x] Phone navigation and core workflows are thumb-friendly.
- [x] Tablet/desktop sidebar collapse works reliably.
- [x] Desktop/tablet layouts use space intelligently instead of stretching phone views.
- [x] Dashboard priority is preserved.
- [x] Text does not overflow or overlap in core screens.
- [x] Active 2062 access is discoverable on mobile and desktop.

---

## Phase 5: Verification and Documentation Closeout

**User stories covered**: As the project owner, I can trust the MVP state and hand future work to agents safely.

### What To Build

Run the full verification pass and reconcile docs/ADRs with the implemented MVP.

### Acceptance Criteria

- [x] Lint, typecheck, unit tests, integration tests, and focused browser tests pass.
- [x] `AGENTS.md` reflects actual commands and workflow.
- [x] Domain, architecture, UI, testing, and roadmap docs match MVP behavior.
- [x] ADRs capture any major decisions made during implementation.
- [x] Deferred post-MVP ideas remain explicitly documented and out of MVP.

