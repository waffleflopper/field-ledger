# Plan: Requirements and Dashboard

> Source: Field Ledger domain model, UI spec, testing strategy, and roadmap phase 7.

This plan implements item-level recurring requirements, completion history, and the dashboard priority model.

## Architectural Decisions

- **Scope**: requirements belong to items only.
- **No cyclic inventory modeling**: commander/PBO cyclic inventory is out of scope.
- **Scheduling**: interval-based from last completed date.
- **Interval edits**: when a requirement interval changes, recalculate the next
  due date from the latest completion date. If the requirement has no completion
  history yet, use the requirement creation date as the recalculation base.
- **Completion**: creates permanent history.
- **Operational dates**: date-only.
- **Dashboard windows**: overdue, due soon through 14 days, upcoming 15-30 days.
- **Priority**: no manual priority in MVP.

---

## Phase 1: Create and Edit Item Requirements

**User stories covered**: As a user, I can add recurring requirements to an item.

### What To Build

Implement item-level requirement creation/editing with preset and custom intervals.

### Acceptance Criteria

- [ ] Requirements belong to one item.
- [ ] Supported intervals include weekly, monthly, quarterly, semiannual, annual, custom days, and custom months.
- [ ] Duplicate requirement names on the same item warn but can be confirmed.
- [ ] Requirement creation/editing emits audit events.
- [ ] Read-only/paused accounts cannot create or edit requirements.
- [ ] Requirement notes can be edited without rewriting completion history.

---

## Phase 2: Due Date Calculation and Completion History

**User stories covered**: As a user, completing a requirement records what happened and calculates the next due date from when it was actually done.

### What To Build

Implement completion behavior, completion history, next-due calculation, optional notes, and past completion date support.

### Acceptance Criteria

- [ ] Completion defaults to today.
- [ ] Past completion dates are allowed.
- [ ] Future completion dates are blocked.
- [ ] Next due date calculates from the entered completion date.
- [ ] Completion creates a permanent history record.
- [ ] Completion can include optional notes.
- [ ] Completion emits an audit event.

---

## Phase 3: Manual Next Due Adjustment and Pause Behavior

**User stories covered**: As a user, I can adjust real-world due dates without changing the underlying requirement interval.

### What To Build

Allow manual next due date adjustment and requirement pause/resume behavior.

### Acceptance Criteria

- [ ] User can manually edit next due date.
- [ ] Manual adjustment does not change the interval.
- [ ] Next completion recalculates from completion date.
- [ ] Requirement can be paused/resumed.
- [ ] Adjustments and pause/resume emit audit events.

---

## Phase 4: Dashboard Requirement Sections

**User stories covered**: As a user, I can open the app and immediately see what needs attention.

### What To Build

Implement dashboard requirement sections using the MVP priority order and due windows.

### Acceptance Criteria

- [ ] Dashboard shows overdue requirements first.
- [ ] Dashboard shows due soon through 14 days.
- [ ] Dashboard shows upcoming 15-30 days.
- [ ] Requirements beyond 30 days are hidden by default.
- [ ] Archived hand receipt/item requirements are suppressed.
- [ ] Paused/read-only account state does not present reminders as active operational work.

---

## Phase 5: Requirement Surfaces on Item Detail

**User stories covered**: As a user, I can manage an item’s requirements from the item itself.

### What To Build

Add item-detail requirement list, create/edit actions, completion action, and compact history access.

### Acceptance Criteria

- [ ] Item detail shows active requirements.
- [ ] User can mark a requirement complete from item detail.
- [ ] User can view at least recent completion history.
- [ ] Mobile layout remains usable.
- [ ] Desktop layout uses available space without stretching mobile UI.
