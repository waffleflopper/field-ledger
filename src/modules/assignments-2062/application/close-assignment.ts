import type { AccountRecord } from "@/modules/accounts/application/ensure-account";
import { recordAuditEvent, type AuditRepository } from "@/modules/audit";
import {
  canClose2062Assignment,
  canRemove2062ItemLink,
  deriveAccountCapabilities,
} from "@/modules/billing";
import type { ItemRepository } from "@/modules/items";
import type { AssignmentItemLinkRepository } from "./assignment-item-link-repository";
import type { AssignmentRepository } from "./assignment-repository";
import { isValidDateOnly, toLocalDateOnly } from "./date-only";
import {
  AccountReadOnlyError,
  AssignmentAlreadyClosedError,
  CloseDateFutureError,
  CloseDateInvalidError,
  ItemLinkAlreadyClosedError,
  ItemLinkNotFoundError,
} from "./types";

type CloseAssignmentInput = {
  account: AccountRecord;
  actorId: string;
  assignmentId: string;
  closedOn?: string;
  assignmentRepository: AssignmentRepository;
  assignmentItemLinkRepository: AssignmentItemLinkRepository;
  auditRepository: AuditRepository;
  itemRepository: ItemRepository;
  now?: Date;
};

type RemoveItemLinkInput = {
  account: AccountRecord;
  actorId: string;
  itemLinkId: string;
  closedOn?: string;
  assignmentRepository: AssignmentRepository;
  assignmentItemLinkRepository: AssignmentItemLinkRepository;
  auditRepository: AuditRepository;
  itemRepository: ItemRepository;
  now?: Date;
};

function assertCanCloseAssignment(account: AccountRecord, now: Date) {
  const capabilities = deriveAccountCapabilities(account, now);

  if (!canClose2062Assignment(capabilities)) {
    throw new AccountReadOnlyError();
  }
}

function assertCanRemoveItemLink(account: AccountRecord, now: Date) {
  const capabilities = deriveAccountCapabilities(account, now);

  if (!canRemove2062ItemLink(capabilities)) {
    throw new AccountReadOnlyError();
  }
}

function normalizeCloseDate(closedOn: string | undefined, now: Date) {
  const today = toLocalDateOnly(now);
  const closeDate = closedOn ?? today;

  if (!isValidDateOnly(closeDate)) {
    throw new CloseDateInvalidError();
  }

  if (closeDate > today) {
    throw new CloseDateFutureError();
  }

  return closeDate;
}

function closeDateToTimestamp(closeDate: string) {
  return new Date(`${closeDate}T12:00:00.000Z`);
}

async function clearFormalSignedToState({
  accountId,
  itemId,
  itemRepository,
  now,
}: {
  accountId: string;
  itemId: string;
  itemRepository: ItemRepository;
  now: Date;
}) {
  const updatedItem = await itemRepository.update(accountId, itemId, {
    signedToContactId: null,
    updatedAt: now,
  });

  if (!updatedItem) {
    throw new Error("Item signed-to state was not cleared.");
  }

  return updatedItem;
}

export async function closeAssignment({
  account,
  actorId,
  assignmentId,
  closedOn,
  assignmentRepository,
  assignmentItemLinkRepository,
  auditRepository,
  itemRepository,
  now = new Date(),
}: CloseAssignmentInput) {
  assertCanCloseAssignment(account, now);
  const closeDate = normalizeCloseDate(closedOn, now);
  const closedAt = closeDateToTimestamp(closeDate);
  const assignment = await assignmentRepository.findById(
    account.id,
    assignmentId,
  );

  if (!assignment) {
    return null;
  }

  if (assignment.status === "closed") {
    throw new AssignmentAlreadyClosedError();
  }

  const activeLinks = await assignmentItemLinkRepository.findByAssignmentId(
    account.id,
    assignment.id,
    { status: "active" },
  );

  for (const link of activeLinks) {
    await clearFormalSignedToState({
      accountId: account.id,
      itemId: link.itemId,
      itemRepository,
      now,
    });
  }

  for (const link of activeLinks) {
    const closedLink = await assignmentItemLinkRepository.updateStatus(
      account.id,
      link.id,
      "closed",
      now,
      closedAt,
    );

    if (!closedLink) {
      throw new Error("Assignment item link was not closed.");
    }
  }

  const closedAssignment = await assignmentRepository.updateStatus(
    account.id,
    assignment.id,
    "closed",
    now,
  );

  if (!closedAssignment) {
    throw new Error("Assignment was not closed.");
  }

  await recordAuditEvent({
    accountId: account.id,
    actorId,
    action: "assignment.closed",
    target: { type: "assignment", id: assignment.id },
    metadata: {
      name:
        assignment.contactName ??
        `${activeLinks.length} ${activeLinks.length === 1 ? "item" : "items"}`,
      closedOn: closeDate,
      handReceiptId: assignment.handReceiptId,
      itemCount: activeLinks.length,
      itemIds: activeLinks.map((link) => link.itemId),
      contactId: assignment.contactId,
      contactName: assignment.contactName ?? null,
      documentId: assignment.documentId,
      documentFilename: assignment.documentFilename ?? null,
    },
    occurredAt: now,
    repository: auditRepository,
  });

  return {
    assignment: closedAssignment,
    closedItemLinks: activeLinks.length,
  };
}

export async function removeAssignmentItemLink({
  account,
  actorId,
  itemLinkId,
  closedOn,
  assignmentRepository,
  assignmentItemLinkRepository,
  auditRepository,
  itemRepository,
  now = new Date(),
}: RemoveItemLinkInput) {
  assertCanRemoveItemLink(account, now);
  const closeDate = normalizeCloseDate(closedOn, now);
  const closedAt = closeDateToTimestamp(closeDate);
  const link = await assignmentItemLinkRepository.findById(
    account.id,
    itemLinkId,
  );

  if (!link) {
    throw new ItemLinkNotFoundError();
  }

  if (link.status === "closed") {
    throw new ItemLinkAlreadyClosedError();
  }

  const assignment = await assignmentRepository.findById(
    account.id,
    link.assignmentId,
  );

  if (!assignment) {
    return null;
  }

  const updatedItem = await clearFormalSignedToState({
    accountId: account.id,
    itemId: link.itemId,
    itemRepository,
    now,
  });

  const closedLink = await assignmentItemLinkRepository.updateStatus(
    account.id,
    link.id,
    "closed",
    now,
    closedAt,
  );

  if (!closedLink) {
    throw new Error("Assignment item link was not closed.");
  }

  await recordAuditEvent({
    accountId: account.id,
    actorId,
    action: "assignment_item_link.removed",
    target: { type: "item", id: link.itemId },
    metadata: {
      name: updatedItem.nomenclature,
      assignmentId: assignment.id,
      closedOn: closeDate,
      handReceiptId: assignment.handReceiptId,
      contactId: assignment.contactId,
      contactName: assignment.contactName ?? null,
      documentId: assignment.documentId,
      documentFilename: assignment.documentFilename ?? null,
    },
    occurredAt: now,
    repository: auditRepository,
  });

  const remainingActiveLinks =
    await assignmentItemLinkRepository.findByAssignmentId(
      account.id,
      assignment.id,
      { status: "active" },
    );
  let assignmentClosed = false;
  let closedAssignment = null;

  if (remainingActiveLinks.length === 0) {
    closedAssignment = await assignmentRepository.updateStatus(
      account.id,
      assignment.id,
      "closed",
      now,
    );

    if (!closedAssignment) {
      throw new Error("Assignment was not closed.");
    }

    assignmentClosed = true;

    await recordAuditEvent({
      accountId: account.id,
      actorId,
      action: "assignment.closed",
      target: { type: "assignment", id: assignment.id },
      metadata: {
        name: assignment.contactName ?? "Final item removed",
        closedOn: closeDate,
        handReceiptId: assignment.handReceiptId,
        itemCount: 1,
        itemIds: [link.itemId],
        contactId: assignment.contactId,
        contactName: assignment.contactName ?? null,
        documentId: assignment.documentId,
        documentFilename: assignment.documentFilename ?? null,
        reason: "last_item_link_removed",
      },
      occurredAt: now,
      repository: auditRepository,
    });
  }

  return {
    link: closedLink,
    assignmentClosed,
    assignment: closedAssignment,
  };
}
