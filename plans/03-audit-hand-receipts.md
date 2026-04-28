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

- [ ] Audit events are account-owned and protected by RLS.
- [ ] The audit logger can record actor, action, target, timestamp, and useful metadata.
- [ ] The logger is available to application services without coupling them to UI routes.
- [ ] Tests prove audit events can be written and isolated by account.
- [ ] Docs explain which workflows must emit audit events.

---

## Phase 2: Simple Activity Surfaces

**User stories covered**: As a user, I can see recent activity without needing a full audit browser.

### What To Build

Add simple activity UI surfaces in the app shell, starting with dashboard/recent activity and a general activity route if useful.

### Acceptance Criteria

- [ ] Recent activity is visible in a low-priority dashboard area.
- [ ] A broader activity surface exists or is clearly staged in the app shell.
- [ ] Activity labels are user-readable and do not expose raw implementation details.
- [ ] Activity remains secondary to dashboard requirements and quick actions.

---

## Phase 3: Create and List Hand Receipts

**User stories covered**: As a user, I can create hand receipts as buckets for my property items.

### What To Build

Implement hand receipt creation and listing, including optional metadata support and account capability checks.

### Acceptance Criteria

- [ ] User can create a hand receipt with required name.
- [ ] Optional metadata can be stored without being required.
- [ ] Base/Pro/trial hand receipt creation rules are enforced through the capability layer.
- [ ] Read-only/paused accounts cannot create hand receipts.
- [ ] Hand receipt creation emits an audit event.
- [ ] The list builds into `/app/hand-receipts`.

---

## Phase 4: Hand Receipt Detail and Editing

**User stories covered**: As a user, I can view and update a hand receipt’s details.

### What To Build

Add hand receipt detail and edit behavior, including the mock-derived detail route structure that will later contain item lists and upload actions.

### Acceptance Criteria

- [ ] User can view a hand receipt detail page.
- [ ] User can edit required and optional metadata.
- [ ] Updates emit audit events.
- [ ] Detail UI leaves room for item list, upload 2062 action, and activity without implementing those workflows prematurely.
- [ ] Paused/read-only accounts cannot edit.

---

## Phase 5: Archive and Restore Hand Receipts

**User stories covered**: As a user, I can remove a hand receipt from day-to-day workflows without losing history.

### What To Build

Implement hand receipt archive and restore, including warnings and default filtering of archived records.

### Acceptance Criteria

- [ ] Active hand receipts can be archived.
- [ ] Archived hand receipts are hidden from normal lists/search surfaces by default.
- [ ] Archived hand receipts can be restored.
- [ ] Archive and restore emit audit events.
- [ ] Read-only/paused accounts cannot archive or restore.
- [ ] Docs capture any unresolved future behavior around active 2062s/reminders at hand receipt archive time.

