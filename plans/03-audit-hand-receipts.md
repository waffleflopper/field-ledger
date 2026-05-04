# Plan: Audit Foundation and Hand Receipts

> Source: Field Ledger domain model, architecture docs, testing strategy, and roadmap phases 3-4.

This plan makes audit/activity a foundation before the first major domain workflow, then implements hand receipt management through the capability layer.

## Architectural Decisions

- **Audit**: meaningful state changes emit audit events from the start.
- **Activity UI**: user-visible but simple.
- **Hand receipt role**: a lightweight bucket with optional formal metadata.
- **Archive behavior**: archive removes from day-to-day workflows and suppresses contained reminders later.
- **Restore**: archived hand receipts can be restored.
- **Billing/access**: hand receipt creation checks account capabilities.

---

## Phase 1: Audit Event Model and Logger Boundary

**User stories covered**: As a user, important changes are recorded so property-accountability history can be trusted.

### What To Build

Create the audit event foundation and an app-owned audit logger boundary that future modules can call.

### Acceptance Criteria

- [x] Audit events are account-owned and protected by RLS.
- [x] The audit logger can record actor, action, target, timestamp, and useful metadata.
- [x] The logger is available to application services without coupling them to UI routes.
- [x] Tests prove audit events can be written and isolated by account.
- [x] Docs explain which workflows must emit audit events.

---

## Phase 2: Simple Activity Surfaces

**User stories covered**: As a user, I can see recent activity without needing a full audit browser.

### What To Build

Add simple activity UI surfaces in the app shell, starting with dashboard/recent activity and a general activity route if useful.

### Acceptance Criteria

- [x] Recent activity is visible in a low-priority dashboard area.
- [x] A broader activity surface exists or is clearly staged in the app shell.
- [x] Activity labels are user-readable and do not expose raw implementation details.
- [x] Activity remains secondary to dashboard requirements and quick actions.

---

## Phase 3: Create and List Hand Receipts

**User stories covered**: As a user, I can create hand receipts as buckets for my property items.

### What To Build

Implement hand receipt creation and listing, including optional metadata support and account capability checks.

### Acceptance Criteria

- [x] User can create a hand receipt with required name.
- [x] Optional metadata can be stored without being required.
- [x] Base/Pro/trial hand receipt creation rules are enforced through the capability layer.
- [x] Read-only/paused accounts cannot create hand receipts.
- [x] Hand receipt creation emits an audit event.
- [x] The list builds into `/app/hand-receipts`.

---

## Phase 4: Hand Receipt Detail and Editing

**User stories covered**: As a user, I can view and update a hand receipt’s details.

### What To Build

Add hand receipt detail and edit behavior, including the mock-derived detail route structure that will later contain item lists and upload actions.

### Acceptance Criteria

- [x] User can view a hand receipt detail page.
- [x] User can edit required and optional metadata.
- [x] Updates emit audit events.
- [x] Detail UI leaves room for item list, upload 2062 action, and activity without implementing those workflows prematurely.
- [x] Paused/read-only accounts cannot edit.

---

## Phase 5: Archive and Restore Hand Receipts

**User stories covered**: As a user, I can remove a hand receipt from day-to-day workflows without losing history.

### What To Build

Implement hand receipt archive and restore, including warnings and default filtering of archived records.

### Acceptance Criteria

- [x] Active hand receipts can be archived.
- [x] Archived hand receipts are hidden from normal lists/search surfaces by default.
- [x] Archived hand receipts can be restored.
- [x] Archive and restore emit audit events.
- [x] Read-only/paused accounts cannot archive or restore.
- [x] Docs capture any unresolved future behavior around active 2062s/reminders at hand receipt archive time.

