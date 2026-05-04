import type { AccountRecord } from "@/modules/accounts/application/ensure-account";
import { recordAuditEvent, type AuditRepository } from "@/modules/audit";
import { deriveAccountCapabilities } from "@/modules/billing";
import { createContact, type ContactRepository } from "@/modules/contacts";
import type { DocumentRepository } from "@/modules/documents";
import type { HandReceiptRepository } from "@/modules/hand-receipts";
import type { ItemRepository } from "@/modules/items";
import type { AssignmentItemLinkRepository } from "./assignment-item-link-repository";
import type { AssignmentRepository } from "./assignment-repository";
import type {
  AssignmentItemLinkRecord,
  CreateAssignmentInput,
  CreateAssignmentWithItemsInput,
} from "./types";
import {
  AccountReadOnlyError,
  Active2062CoverageConflictError,
  ContactDisplayNameRequiredError,
  ContactNotFoundError,
  DocumentNotFoundError,
  DocumentReceiptMismatchError,
  EmptyItemSelectionError,
  HandReceiptNotActiveError,
  HandReceiptNotFoundError,
  ItemNotActiveError,
  ItemNotFoundError,
  ItemReceiptMismatchError,
} from "./types";

type CreateAssignmentArgs = {
  account: AccountRecord;
  actorId: string;
  input: CreateAssignmentInput;
  assignmentRepository: AssignmentRepository;
  assignmentItemLinkRepository: AssignmentItemLinkRepository;
  auditRepository: AuditRepository;
  contactRepository: ContactRepository;
  documentRepository: DocumentRepository;
  handReceiptRepository: HandReceiptRepository;
  itemRepository: ItemRepository;
  now?: Date;
  createAssignmentId?: () => string;
  createAssignmentItemLinkId?: () => string;
};

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "constraint" in error &&
    error.constraint === "assignment_item_links_one_active_item_idx"
  );
}

export async function createAssignment({
  account,
  actorId,
  input,
  assignmentRepository,
  assignmentItemLinkRepository,
  auditRepository,
  contactRepository,
  documentRepository,
  handReceiptRepository,
  itemRepository,
  now = new Date(),
  createAssignmentId = () => globalThis.crypto.randomUUID(),
  createAssignmentItemLinkId = () => globalThis.crypto.randomUUID(),
}: CreateAssignmentArgs) {
  const capabilities = deriveAccountCapabilities(account, now);

  if (capabilities.isReadOnly) {
    throw new AccountReadOnlyError();
  }

  const item = await itemRepository.findById(account.id, input.itemId);

  if (!item) {
    throw new ItemNotFoundError();
  }

  if (item.status !== "active") {
    throw new ItemNotActiveError();
  }

  const handReceipt = await handReceiptRepository.findById(
    account.id,
    item.handReceiptId,
  );

  if (!handReceipt) {
    throw new HandReceiptNotFoundError();
  }

  if (handReceipt.status !== "active") {
    throw new HandReceiptNotActiveError();
  }

  const activeLink = await assignmentItemLinkRepository.findActiveByItemId(
    account.id,
    item.id,
  );

  if (activeLink) {
    throw new Active2062CoverageConflictError();
  }

  if ("contactDisplayName" in input && !input.contactDisplayName?.trim()) {
    throw new ContactDisplayNameRequiredError();
  }

  const contact =
    "contactId" in input && input.contactId
      ? await contactRepository.findById(account.id, input.contactId)
      : await createContact({
          account,
          actorId,
          input: { displayName: input.contactDisplayName ?? "" },
          contactRepository,
          auditRepository,
          now,
        });

  if (!contact) {
    throw new ContactNotFoundError();
  }

  const document = await documentRepository.findById(
    account.id,
    input.documentId,
  );

  if (!document) {
    throw new DocumentNotFoundError();
  }

  if (document.handReceiptId !== item.handReceiptId) {
    throw new DocumentReceiptMismatchError(
      "Document must belong to the item's hand receipt.",
    );
  }

  const convertedFromManualSignedTo = item.signedToContactId !== null;

  const assignment = await assignmentRepository.create({
    id: createAssignmentId(),
    accountId: account.id,
    handReceiptId: item.handReceiptId,
    contactId: contact.id,
    documentId: document.id,
    status: "active",
    createdAt: now,
    updatedAt: now,
  });

  let link;
  try {
    link = await assignmentItemLinkRepository.create({
      id: createAssignmentItemLinkId(),
      accountId: account.id,
      assignmentId: assignment.id,
      itemId: item.id,
      status: "active",
      closedAt: null,
      createdAt: now,
      updatedAt: now,
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new Active2062CoverageConflictError();
    }

    throw error;
  }

  if (convertedFromManualSignedTo) {
    const updatedItem = await itemRepository.update(account.id, item.id, {
      signedToContactId: null,
      updatedAt: now,
    });

    if (!updatedItem) {
      throw new Error("Item signed-to state was not cleared.");
    }
  }

  await recordAuditEvent({
    accountId: account.id,
    actorId,
    action: "assignment.created",
    target: { type: "assignment", id: assignment.id },
    metadata: {
      itemId: item.id,
      contactId: contact.id,
      documentId: document.id,
      convertedFromManualSignedTo,
    },
    occurredAt: now,
    repository: auditRepository,
  });

  await recordAuditEvent({
    accountId: account.id,
    actorId,
    action: "assignment_item_link.created",
    target: { type: "item", id: item.id },
    metadata: {
      assignmentId: assignment.id,
      contactId: contact.id,
      documentId: document.id,
    },
    occurredAt: now,
    repository: auditRepository,
  });

  return {
    assignment: {
      ...assignment,
      contactName: contact.displayName,
      documentFilename: document.filename,
    },
    link,
  };
}

export async function createAssignmentWithItems({
  account,
  actorId,
  input,
  assignmentRepository,
  assignmentItemLinkRepository,
  auditRepository,
  contactRepository,
  documentRepository,
  handReceiptRepository,
  itemRepository,
  now = new Date(),
  createAssignmentId = () => globalThis.crypto.randomUUID(),
  createAssignmentItemLinkId = () => globalThis.crypto.randomUUID(),
}: Omit<CreateAssignmentArgs, "input"> & {
  input: CreateAssignmentWithItemsInput;
  handReceiptRepository: HandReceiptRepository;
}) {
  const capabilities = deriveAccountCapabilities(account, now);

  if (capabilities.isReadOnly) {
    throw new AccountReadOnlyError();
  }

  const uniqueItemIds = Array.from(new Set(input.itemIds));

  if (uniqueItemIds.length === 0) {
    throw new EmptyItemSelectionError();
  }

  const handReceipt = await handReceiptRepository.findById(
    account.id,
    input.handReceiptId,
  );

  if (!handReceipt) {
    throw new HandReceiptNotFoundError();
  }

  if (handReceipt.status !== "active") {
    throw new HandReceiptNotActiveError();
  }

  if ("contactDisplayName" in input && !input.contactDisplayName?.trim()) {
    throw new ContactDisplayNameRequiredError();
  }

  const contact =
    "contactId" in input && input.contactId
      ? await contactRepository.findById(account.id, input.contactId)
      : await createContact({
          account,
          actorId,
          input: { displayName: input.contactDisplayName ?? "" },
          contactRepository,
          auditRepository,
          now,
        });

  if (!contact) {
    throw new ContactNotFoundError();
  }

  const document = await documentRepository.findById(
    account.id,
    input.documentId,
  );

  if (!document) {
    throw new DocumentNotFoundError();
  }

  if (document.handReceiptId !== input.handReceiptId) {
    throw new DocumentReceiptMismatchError();
  }

  const items = await Promise.all(
    uniqueItemIds.map((itemId) => itemRepository.findById(account.id, itemId)),
  );

  if (items.some((item) => item === null)) {
    throw new ItemNotFoundError();
  }

  const activeItems = items.map((item) => {
    if (!item) {
      throw new ItemNotFoundError();
    }

    if (item.status !== "active") {
      throw new ItemNotActiveError("Items must be active to upload a 2062.");
    }

    if (item.handReceiptId !== input.handReceiptId) {
      throw new ItemReceiptMismatchError();
    }

    return item;
  });

  const activeLinks = await Promise.all(
    activeItems.map((item) =>
      assignmentItemLinkRepository.findActiveByItemId(account.id, item.id),
    ),
  );

  if (activeLinks.some(Boolean)) {
    throw new Active2062CoverageConflictError();
  }

  const assignment = await assignmentRepository.create({
    id: createAssignmentId(),
    accountId: account.id,
    handReceiptId: input.handReceiptId,
    contactId: contact.id,
    documentId: document.id,
    status: "active",
    createdAt: now,
    updatedAt: now,
  });

  const links: AssignmentItemLinkRecord[] = [];

  try {
    for (const item of activeItems) {
      links.push(
        await assignmentItemLinkRepository.create({
          id: createAssignmentItemLinkId(),
          accountId: account.id,
          assignmentId: assignment.id,
          itemId: item.id,
          status: "active",
          closedAt: null,
          createdAt: now,
          updatedAt: now,
        }),
      );
    }
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new Active2062CoverageConflictError();
    }

    throw error;
  }

  await Promise.all(
    activeItems
      .filter((item) => item.signedToContactId !== null)
      .map(async (item) => {
        const updatedItem = await itemRepository.update(account.id, item.id, {
          signedToContactId: null,
          updatedAt: now,
        });

        if (!updatedItem) {
          throw new Error("Item signed-to state was not cleared.");
        }
      }),
  );

  await recordAuditEvent({
    accountId: account.id,
    actorId,
    action: "assignment.created",
    target: { type: "assignment", id: assignment.id },
    metadata: {
      handReceiptId: input.handReceiptId,
      itemIds: activeItems.map((item) => item.id),
      itemCount: activeItems.length,
      contactId: contact.id,
      contactName: contact.displayName,
      documentId: document.id,
      documentFilename: document.filename,
      convertedFromManualSignedToCount: activeItems.filter(
        (item) => item.signedToContactId !== null,
      ).length,
    },
    occurredAt: now,
    repository: auditRepository,
  });

  for (const item of activeItems) {
    await recordAuditEvent({
      accountId: account.id,
      actorId,
      action: "assignment_item_link.created",
      target: { type: "item", id: item.id },
      metadata: {
        assignmentId: assignment.id,
        contactId: contact.id,
        contactName: contact.displayName,
        documentId: document.id,
        documentFilename: document.filename,
        itemIdentifier: item.ecn ?? item.serialNumber ?? item.generatedId,
      },
      occurredAt: now,
      repository: auditRepository,
    });
  }

  return {
    assignment: {
      ...assignment,
      contactName: contact.displayName,
      documentFilename: document.filename,
    },
    links,
    items: activeItems,
  };
}
