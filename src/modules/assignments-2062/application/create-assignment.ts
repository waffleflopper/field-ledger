import type { AccountRecord } from "@/modules/accounts/application/ensure-account";
import { recordAuditEvent, type AuditRepository } from "@/modules/audit";
import { deriveAccountCapabilities } from "@/modules/billing";
import { createContact, type ContactRepository } from "@/modules/contacts";
import type { DocumentRepository } from "@/modules/documents";
import type { ItemRepository } from "@/modules/items";
import type { AssignmentItemLinkRepository } from "./assignment-item-link-repository";
import type { AssignmentRepository } from "./assignment-repository";
import type { CreateAssignmentInput } from "./types";

type CreateAssignmentArgs = {
  account: AccountRecord;
  actorId: string;
  input: CreateAssignmentInput;
  assignmentRepository: AssignmentRepository;
  assignmentItemLinkRepository: AssignmentItemLinkRepository;
  auditRepository: AuditRepository;
  contactRepository: ContactRepository;
  documentRepository: DocumentRepository;
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

export class Active2062CoverageConflictError extends Error {
  constructor() {
    super("Item already has active 2062 coverage.");
  }
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
  itemRepository,
  now = new Date(),
  createAssignmentId = () => globalThis.crypto.randomUUID(),
  createAssignmentItemLinkId = () => globalThis.crypto.randomUUID(),
}: CreateAssignmentArgs) {
  const capabilities = deriveAccountCapabilities(account, now);

  if (capabilities.isReadOnly) {
    throw new Error("This account is read-only.");
  }

  const item = await itemRepository.findById(account.id, input.itemId);

  if (!item) {
    throw new Error("Item was not found.");
  }

  if (item.status !== "active") {
    throw new Error("Item must be active to upload a 2062.");
  }

  const activeLink = await assignmentItemLinkRepository.findActiveByItemId(
    account.id,
    item.id,
  );

  if (activeLink) {
    throw new Active2062CoverageConflictError();
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
    throw new Error("Contact was not found.");
  }

  const document = await documentRepository.findById(
    account.id,
    input.documentId,
  );

  if (!document) {
    throw new Error("Document was not found.");
  }

  if (document.handReceiptId !== item.handReceiptId) {
    throw new Error("Document must belong to the item's hand receipt.");
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
