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
- **Pause state**: requirement pause is represented by `pausedAt`, not by a
  `status = "paused"` enum value. Pause sets `pausedAt`; resume clears it.

---

## Phase 1: Create and Edit Item Requirements

**User stories covered**: As a user, I can add recurring requirements to an item.

### What To Build

Implement item-level requirement creation/editing with preset and custom intervals.

### Acceptance Criteria

- [x] Requirements belong to one item.
- [x] Supported intervals include weekly, monthly, quarterly, semiannual, annual, custom days, and custom months.
- [x] Duplicate requirement names on the same item warn but can be confirmed.
- [x] Requirement creation/editing emits audit events.
- [x] Read-only/paused accounts cannot create or edit requirements.
- [x] Requirement notes can be edited without rewriting completion history.

---

## Phase 2: Due Date Calculation and Completion History

**User stories covered**: As a user, completing a requirement records what happened and calculates the next due date from when it was actually done.

### What To Build

Implement completion behavior, completion history, next-due calculation, optional notes, and past completion date support.

### Acceptance Criteria

- [x] Completion defaults to today.
- [x] Past completion dates are allowed.
- [x] Future completion dates are blocked.
- [x] Next due date calculates from the entered completion date.
- [x] Completion creates a permanent history record.
- [x] Completion can include optional notes.
- [x] Completion emits an audit event.

---

## Phase 3: Manual Next Due Adjustment and Pause Behavior

**User stories covered**: As a user, I can adjust real-world due dates without changing the underlying requirement interval.

### What To Build

Allow manual next due date adjustment and requirement pause/resume behavior.

### Acceptance Criteria

- [x] User can manually edit next due date.
- [x] Manual adjustment does not change the interval.
- [x] Next completion recalculates from completion date.
- [x] Requirement can be paused/resumed.
- [x] Adjustments and pause/resume emit audit events.
- [x] Pause state uses `pausedAt` as the current suppression marker.

---

## Phase 4: Dashboard Requirement Sections

**User stories covered**: As a user, I can open the app and immediately see what needs attention.

### What To Build

Implement dashboard requirement sections using the MVP priority order and due windows.

### Acceptance Criteria

- [x] Dashboard shows overdue requirements first.
- [x] Dashboard shows due soon through 14 days.
- [x] Dashboard shows upcoming 15-30 days.
- [x] Requirements beyond 30 days are hidden by default.
- [x] Archived hand receipt/item requirements are suppressed.
- [x] Paused/read-only account state does not present reminders as active operational work.

---

## Phase 5: Requirement Surfaces on Item Detail

**User stories covered**: As a user, I can manage an item’s requirements from the item itself.

### What To Build

Add item-detail requirement list, create/edit actions, completion action, and compact history access.

### Acceptance Criteria

- [x] Item detail shows active requirements.
- [x] User can mark a requirement complete from item detail.
- [x] User can view at least recent completion history.
- [x] Mobile layout remains usable.
- [x] Desktop layout uses available space without stretching mobile UI.

## Phase 5 Completion Notes

- Item detail keeps the compact three-record completion preview and adds a
  "View all completions" dialog for the latest expanded history records.
- Requirement activity labels are readable through the audit formatter, and the
  audit router accepts requirement target-scoped activity reads.
- Dashboard sections keep the priority order and show per-window empty states
  when one window has no active requirement work.
- Read-only and archived-item requirement states preserve review access without
  inviting blocked create, edit, completion, pause, or resume actions.
