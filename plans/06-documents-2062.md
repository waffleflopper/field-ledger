# Plan: Documents and 2062 Assignments

> Source: Field Ledger domain model, UI spec, architecture docs, and roadmap phase 8.

This plan implements private document storage, formal 2062 assignment workflows, and the Active 2062s view.

## Architectural Decisions

- **Document ownership**: documents are account-owned records.
- **Storage**: Supabase Storage behind a file storage boundary.
- **2062 scope**: one 2062 assignment belongs to one hand receipt.
- **2062 requirements**: contact, document, hand receipt, and at least one linked item.
- **Active state**: one active 2062 link max per item.
- **History**: many historical closed 2062 links per item.
- **Manual conversion**: uploading 2062 for a manually signed-to item converts to formal coverage.
- **Deletion**: preserve documents by default.

---

## Phase 1: Private Document Upload Foundation

**User stories covered**: As a user, uploaded 2062 scans are stored privately and can be linked to accountability workflows.

### What To Build

Implement the document module, private file storage boundary, and metadata persistence for PDF/image uploads.

### Acceptance Criteria

- [ ] User can upload an accepted document type for future 2062 use.
- [ ] Document metadata is stored account-owned.
- [ ] Files are private.
- [ ] Closing/archive workflows do not delete documents.
- [ ] Upload emits an audit event.
- [ ] Read-only/paused accounts cannot upload.

---

## Phase 2: Single-Item Upload 2062 Flow

**User stories covered**: As a user, I can go to one item and quickly upload a 2062 for that item.

### What To Build

Implement `/app/items/[itemId]/upload-2062` as a focused one-item assignment flow.

### Acceptance Criteria

- [ ] Flow starts from item detail.
- [ ] The item is preselected.
- [ ] User selects or creates a required contact.
- [ ] User uploads a required document.
- [ ] If item has manual signed-to contact, contact defaults to that person.
- [ ] Creating the 2062 clears/replaces manual signed-to state.
- [ ] Assignment and item-link creation emit audit events.

---

## Phase 3: Hand Receipt Multi-Item Upload 2062 Flow

**User stories covered**: As a user, I can upload one 2062 and link it to multiple items from the same hand receipt.

**Status**: Implemented by issue #61.

### What To Build

Implement `/app/hand-receipts/[handReceiptId]/upload-2062` with contact selection, document upload, and multi-item selection limited to the current hand receipt.

### Acceptance Criteria

- [x] Flow starts from hand receipt detail.
- [x] User selects or creates a required contact.
- [x] User uploads a required document.
- [x] User selects at least one item from the current hand receipt.
- [x] Items from other hand receipts cannot be selected.
- [x] Linked items show signed-to state from active 2062 coverage.
- [x] Creation emits audit events.

---

## Phase 4: Active 2062s List

**User stories covered**: As a user, I can see which formal 2062 assignments are currently active.

### What To Build

Add a simple Active 2062s list accessible from mobile More/dashboard context and visible from desktop/sidebar or secondary navigation.

### Acceptance Criteria

- [ ] Active 2062s list includes formal 2062 assignments only.
- [ ] Manual signed-to records do not appear as Active 2062s.
- [ ] Each row/card shows contact, item count, hand receipt context, date/status, and a way to open the assignment context.
- [ ] Mobile access is discoverable without making it a primary bottom nav item.
- [ ] Desktop access fits the sidebar/navigation model.

---

## Phase 5: Close 2062 and Remove Item Link

**User stories covered**: As a user, I can record returned property by closing a 2062 or removing one returned item from a multi-item 2062.

### What To Build

Implement closing all links for an active 2062 and closing a single item link from a multi-item 2062.

### Acceptance Criteria

- [x] Closing a 2062 clears current signed-to state for all linked items.
- [x] Removing one item link clears current signed-to state for only that item.
- [x] If other item links remain, the 2062 can stay active.
- [x] Removing the last active item link closes the assignment.
- [x] Return/close date defaults to today.
- [x] Past return/close dates are allowed.
- [x] Future return/close dates are blocked.
- [x] Document and history are preserved.
- [x] Close/remove actions emit audit events.

---

## Phase 6: Enforce 2062 Constraints Across Item Workflows

**User stories covered**: As a user, I cannot accidentally break the meaning of a 2062 by moving an actively covered item to another hand receipt.

### What To Build

Tie active 2062 constraints into item move/archive behavior.

### Acceptance Criteria

- [ ] Item with active 2062 cannot move to another hand receipt until the active 2062 item link is closed.
- [ ] Archiving an item with active 2062 is allowed with warning and closes that item link.
- [ ] If archiving closes the last active link on a 2062, the user is prompted to close the assignment.
- [ ] All state changes emit audit events.
