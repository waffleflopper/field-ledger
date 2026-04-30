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

## Future 2062 Boundary

Active 2062 behavior at archive time is intentionally deferred to the 2062
implementation phase. This slice does not create, close, relink, or warn on
formal 2062 assignments.

Future 2062 work should decide whether a hand receipt with active 2062s can be
archived directly, requires a confirmation warning, or requires active 2062s to
be closed first. Until that workflow exists, archive only changes the hand
receipt lifecycle state and preserves audit history.
