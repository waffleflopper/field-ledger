# Hand Receipt Archive Behavior

Hand receipt archive is a reversible lifecycle state for accountable records.
Archiving is not deletion.

## Current Behavior

- Active hand receipts appear in normal `/app/hand-receipts` workflows by
  default.
- Archived hand receipts are hidden from the normal active list.
- Archived hand receipts remain reviewable through the deliberate Archived
  view.
- Archived hand receipts can be restored to active status.
- Archived hand receipts do not count against the Base tier active hand receipt
  limit.
- Restoring an archived hand receipt counts against the active hand receipt
  limit and is blocked when a Base account is already at that limit.
- Paused/read-only accounts can review active and archived records, but cannot
  archive or restore them.
- Archive and restore emit audit events:
  - `hand_receipt.archived`
  - `hand_receipt.restored`

## Future Requirement Boundary

When item requirements exist, archived hand receipts should suppress reminders
for contained property so inactive buckets do not create day-to-day requirement
noise. This slice does not implement requirements, due-date calculations,
completion history, or reminder suppression.

Future requirement work should treat hand receipt status as a workflow input and
decide whether suppressed reminders remain visible in historical or detail-only
contexts.

## 2062 Boundary

Item archive behavior now handles active 2062 coverage in the item workflow:
the user receives a warning, the item is archived, only that item's active
2062 link is closed, and the linked document plus closed-link history are
preserved. If that item was the final active link on the assignment, the
assignment closes.

Hand receipt archive behavior for receipts with active 2062 assignments remains
outside this item-workflow slice. Future hand receipt archive work should decide
whether a hand receipt with active 2062s can be archived directly, requires a
confirmation warning, or requires active 2062s to be closed first. Until that
workflow exists, hand receipt archive only changes the hand receipt lifecycle
state and preserves audit history.
