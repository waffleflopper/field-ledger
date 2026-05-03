import { describe, expect, it } from "vitest";

import type { AccountRecord } from "@/modules/accounts/application/ensure-account";
import {
  Active2062CoverageConflictError,
  createAssignment,
} from "@/modules/assignments-2062";
import { InMemoryAssignmentItemLinkRepository } from "../../support/assignment-item-link-repository";
import { InMemoryAssignmentRepository } from "../../support/assignment-repository";
import { InMemoryAuditRepository } from "../../support/audit-repository";
import { InMemoryContactRepository } from "../../support/contact-repository";
import { InMemoryDocumentRepository } from "../../support/document-repository";
import { InMemoryItemRepository } from "../../support/item-repository";

const now = new Date("2026-05-02T12:00:00.000Z");

function createAccount(overrides: Partial<AccountRecord> = {}): AccountRecord {
  return {
    id: "account-1",
    userId: "owner-1",
    accessState: "active",
    subscriptionTier: "base",
    trialStartsAt: new Date("2026-04-01T12:00:00.000Z"),
    trialEndsAt: new Date("2100-01-01T00:00:00.000Z"),
    onboardingCompletedAt: null,
    ...overrides,
  };
}

function createRepositories() {
  return {
    assignmentRepository: new InMemoryAssignmentRepository(),
    assignmentItemLinkRepository: new InMemoryAssignmentItemLinkRepository(),
    auditRepository: new InMemoryAuditRepository(),
    contactRepository: new InMemoryContactRepository([
      {
        id: "contact-1",
        accountId: "account-1",
        displayName: "SPC Rivera",
        createdAt: now,
        updatedAt: now,
      },
    ]),
    documentRepository: new InMemoryDocumentRepository([
      {
        id: "document-1",
        accountId: "account-1",
        handReceiptId: "receipt-1",
        filename: "signed-2062.pdf",
        mimeType: "application/pdf",
        sizeBytes: 100,
        storagePath: "account-1/document-1",
        uploadedAt: now,
        createdAt: now,
        updatedAt: now,
      },
    ]),
    itemRepository: new InMemoryItemRepository([
      {
        id: "item-1",
        accountId: "account-1",
        handReceiptId: "receipt-1",
        nomenclature: "Radio",
        ecn: "ECN-1",
        serialNumber: null,
        generatedId: null,
        notes: null,
        status: "active",
        signedToContactId: null,
        signedToContactName: null,
        createdAt: now,
        updatedAt: now,
      },
    ]),
  };
}

describe("createAssignment", () => {
  it("creates one active 2062 assignment with an item link and audit events", async () => {
    const repositories = createRepositories();

    const result = await createAssignment({
      account: createAccount(),
      actorId: "owner-1",
      input: {
        itemId: "item-1",
        contactId: "contact-1",
        documentId: "document-1",
      },
      ...repositories,
      now,
      createAssignmentId: () => "assignment-1",
      createAssignmentItemLinkId: () => "link-1",
    });

    expect(result.assignment).toMatchObject({
      id: "assignment-1",
      handReceiptId: "receipt-1",
      contactId: "contact-1",
      documentId: "document-1",
      status: "active",
    });
    expect(result.link).toMatchObject({
      id: "link-1",
      assignmentId: "assignment-1",
      itemId: "item-1",
      status: "active",
    });
    expect(
      repositories.auditRepository.events.map((event) => event.action),
    ).toEqual(["assignment.created", "assignment_item_link.created"]);
  });

  it("converts manual signed-to state into formal 2062 coverage", async () => {
    const repositories = createRepositories();
    const item = repositories.itemRepository.items[0];

    if (!item) {
      throw new Error("Missing test item.");
    }

    repositories.itemRepository.items[0] = {
      ...item,
      signedToContactId: "contact-1",
      signedToContactName: "SPC Rivera",
    };

    await createAssignment({
      account: createAccount(),
      actorId: "owner-1",
      input: {
        itemId: "item-1",
        contactId: "contact-1",
        documentId: "document-1",
      },
      ...repositories,
      now,
      createAssignmentId: () => "assignment-1",
      createAssignmentItemLinkId: () => "link-1",
    });

    await expect(
      repositories.itemRepository.findById("account-1", "item-1"),
    ).resolves.toMatchObject({
      signedToContactId: null,
    });
    expect(repositories.auditRepository.events[0]?.metadata).toMatchObject({
      convertedFromManualSignedTo: true,
    });
  });

  it("blocks conflicting active coverage for the item", async () => {
    const repositories = createRepositories();
    repositories.assignmentItemLinkRepository.links.push({
      id: "existing-link",
      accountId: "account-1",
      assignmentId: "existing-assignment",
      itemId: "item-1",
      status: "active",
      closedAt: null,
      createdAt: now,
      updatedAt: now,
    });

    await expect(
      createAssignment({
        account: createAccount(),
        actorId: "owner-1",
        input: {
          itemId: "item-1",
          contactId: "contact-1",
          documentId: "document-1",
        },
        ...repositories,
        now,
      }),
    ).rejects.toBeInstanceOf(Active2062CoverageConflictError);
  });

  it("fails if manual signed-to conversion cannot be cleared", async () => {
    const repositories = createRepositories();
    const item = repositories.itemRepository.items[0];

    if (!item) {
      throw new Error("Missing test item.");
    }

    repositories.itemRepository.items[0] = {
      ...item,
      signedToContactId: "contact-1",
      signedToContactName: "SPC Rivera",
    };
    repositories.itemRepository.update = async () => null;

    await expect(
      createAssignment({
        account: createAccount(),
        actorId: "owner-1",
        input: {
          itemId: "item-1",
          contactId: "contact-1",
          documentId: "document-1",
        },
        ...repositories,
        now,
        createAssignmentId: () => "assignment-1",
        createAssignmentItemLinkId: () => "link-1",
      }),
    ).rejects.toThrow("Item signed-to state was not cleared.");
  });

  it("creates a lightweight contact inline when no existing contact is selected", async () => {
    const repositories = createRepositories();

    const result = await createAssignment({
      account: createAccount(),
      actorId: "owner-1",
      input: {
        itemId: "item-1",
        contactDisplayName: "SGT Morgan",
        documentId: "document-1",
      },
      ...repositories,
      now,
      createAssignmentId: () => "assignment-1",
      createAssignmentItemLinkId: () => "link-1",
    });

    expect(result.assignment.contactName).toBe("SGT Morgan");
    expect(repositories.contactRepository.contacts).toContainEqual(
      expect.objectContaining({
        accountId: "account-1",
        displayName: "SGT Morgan",
      }),
    );
    expect(
      repositories.auditRepository.events.map((event) => event.action),
    ).toEqual([
      "contact.created",
      "assignment.created",
      "assignment_item_link.created",
    ]);
  });

  it("blocks creation when the item does not exist", async () => {
    const repositories = createRepositories();

    await expect(
      createAssignment({
        account: createAccount(),
        actorId: "owner-1",
        input: {
          itemId: "missing-item",
          contactId: "contact-1",
          documentId: "document-1",
        },
        ...repositories,
        now,
      }),
    ).rejects.toThrow("Item was not found.");
  });

  it("blocks creation when the contact does not exist", async () => {
    const repositories = createRepositories();

    await expect(
      createAssignment({
        account: createAccount(),
        actorId: "owner-1",
        input: {
          itemId: "item-1",
          contactId: "missing-contact",
          documentId: "document-1",
        },
        ...repositories,
        now,
      }),
    ).rejects.toThrow("Contact was not found.");
  });

  it("blocks creation when the document does not exist", async () => {
    const repositories = createRepositories();

    await expect(
      createAssignment({
        account: createAccount(),
        actorId: "owner-1",
        input: {
          itemId: "item-1",
          contactId: "contact-1",
          documentId: "missing-document",
        },
        ...repositories,
        now,
      }),
    ).rejects.toThrow("Document was not found.");
  });

  it("blocks read-only accounts before creating assignment records", async () => {
    const repositories = createRepositories();

    await expect(
      createAssignment({
        account: createAccount({ accessState: "paused_read_only" }),
        actorId: "owner-1",
        input: {
          itemId: "item-1",
          contactId: "contact-1",
          documentId: "document-1",
        },
        ...repositories,
        now,
      }),
    ).rejects.toThrow("This account is read-only.");
    expect(repositories.assignmentRepository.assignments).toEqual([]);
  });
});
