# Plan: Items, Global Search, Contacts, and Locations

> Source: Field Ledger domain model, UI spec, and roadmap phases 5-6.

This plan establishes the core property item workflow, global search, and reusable account-level contacts/locations.

## Architectural Decisions

- **Item identity**: one item record equals one physical accountable item.
- **Identifier rule**: ECN, serial number, or generated app ID is required.
- **Generated ID**: permanent, human-friendly, account-sequential, searchable.
- **Duplicates**: duplicate ECN/serial warns but can be confirmed; duplicate nomenclature is allowed.
- **Contacts**: account-wide, display name required only.
- **Locations**: account-wide, optional, name required only.
- **Manual signed-to**: always references/creates a contact record.

---

## Phase 1: Property Item Creation

**User stories covered**: As a user, I can add an item to a hand receipt with enough identity to track it.

### What To Build

Implement item creation inside a selected hand receipt, including identifier validation and generated ID support.

### Acceptance Criteria

- [ ] Item requires nomenclature and a hand receipt.
- [ ] Item requires ECN, serial number, or generated ID.
- [ ] User can generate an app ID when ECN/serial is unknown.
- [ ] Generated ID remains stable and searchable.
- [ ] Duplicate ECN/serial warnings are shown and can be confirmed.
- [ ] Creation emits an audit event.

---

## Phase 2: Item Detail and Editing

**User stories covered**: As a user, I can view and correct item details over time.

### What To Build

Add item detail and editing, including ECN/serial edits with audit history and placeholders for later requirements/2062 sections.

### Acceptance Criteria

- [ ] User can view item detail from hand receipt and search contexts.
- [ ] User can edit nomenclature, ECN, serial number, generated ID presence rules, and notes if present.
- [ ] Identifier edits keep the item valid.
- [ ] Identifier changes emit audit events.
- [ ] Item UI works well without photos.
- [ ] Read-only/paused accounts cannot edit.

---

## Phase 3: Archive, Restore, and Move Items

**User stories covered**: As a user, I can maintain my hand receipts as items are turned in, transferred, or moved between my hand receipts.

### What To Build

Implement item archive/restore and moving items between hand receipts, with active 2062 movement constraints staged for the later 2062 module.

### Acceptance Criteria

- [ ] User can archive an item with optional reason/notes.
- [ ] Archived items are hidden from normal lists/search by default.
- [ ] User can restore archived items.
- [ ] User can move an item between hand receipts.
- [ ] Movement behavior leaves a clear constraint hook for active 2062 coverage.
- [ ] Archive, restore, and move emit audit events.

---

## Phase 4: Global Item Search

**User stories covered**: As a user, I can search across all hand receipts without choosing a hand receipt first.

### What To Build

Implement global item search across identifiers, nomenclature, hand receipt name, location, and signed-to contact as those records exist.

### Acceptance Criteria

- [x] Search is global by default.
- [x] Results show which hand receipt each item belongs to.
- [x] Results show strongest matching identifiers.
- [x] Archived records are excluded by default with a clear include-archived option.
- [x] Search route builds into `/app/items`.
- [x] Search is usable on mobile and desktop.

Implemented in issue #44. Normal search matches active item identifiers,
nomenclature, hand receipt name, signed-to contact, and location through the
items application boundary, limited to active hand receipts and active items.
The include-archived option expands search to archived item records and items
that belong to archived hand receipts.

---

## Phase 5: Contacts and Manual Signed-To

**User stories covered**: As a user, I can record who has an item even when no 2062 is attached.

### What To Build

Implement account-wide contacts and manual signed-to fallback through contact selection/creation.

### Acceptance Criteria

- [ ] User can create contacts with display name only.
- [ ] Contacts are account-wide.
- [ ] Manual signed-to always references a contact.
- [ ] Typing a new signed-to name creates a contact.
- [ ] Existing contacts are suggested to reduce duplicates.
- [ ] Manual signed-to items appear in signed-out surfaces with a no-2062 indicator.

---

## Phase 6: Locations

**User stories covered**: As a user, I can record where items are located using reusable location names.

### What To Build

Implement account-wide reusable locations and item location assignment.

### Acceptance Criteria

- [ ] User can create locations with name only.
- [ ] Locations are account-wide and optional.
- [ ] Items can have no location or one current location.
- [ ] Location changes emit audit events.
- [ ] Search/filtering can use location context.
- [ ] Read-only/paused accounts cannot change locations.
