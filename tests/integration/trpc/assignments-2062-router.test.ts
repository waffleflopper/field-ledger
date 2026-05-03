import { describe, expect, it } from "vitest";

import type { AccountRecord } from "@/modules/accounts/application/ensure-account";
import { appRouter } from "@/server/trpc/router";
import { InMemoryAccountRepository } from "../../support/account-repository";
import { InMemoryAssignmentItemLinkRepository } from "../../support/assignment-item-link-repository";
import { InMemoryAssignmentRepository } from "../../support/assignment-repository";
import { InMemoryAuditRepository } from "../../support/audit-repository";
import { createInMemoryAppUnitOfWork } from "../../support/app-unit-of-work";
import { InMemoryContactRepository } from "../../support/contact-repository";
import { InMemoryDocumentRepository } from "../../support/document-repository";
import { InMemoryHandReceiptRepository } from "../../support/hand-receipt-repository";
import { InMemoryItemRepository } from "../../support/item-repository";
import { createEmptyLocationRepository } from "../../support/location-repository";
import { createEmptyRequirementRepository } from "../../support/requirement-repository";

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

function createCaller(account = createAccount()) {
  const accountRepository = new InMemoryAccountRepository([account]);
  const assignmentRepository = new InMemoryAssignmentRepository();
  const assignmentItemLinkRepository =
    new InMemoryAssignmentItemLinkRepository();
  const auditRepository = new InMemoryAuditRepository();
  const contactRepository = new InMemoryContactRepository([
    {
      id: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
      accountId: account.id,
      displayName: "SPC Rivera",
      createdAt: now,
      updatedAt: now,
    },
  ]);
  const documentRepository = new InMemoryDocumentRepository([
    {
      id: "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb",
      accountId: account.id,
      handReceiptId: "cccccccc-cccc-4ccc-cccc-cccccccccccc",
      filename: "signed-2062.pdf",
      mimeType: "application/pdf",
      sizeBytes: 100,
      storagePath: `${account.id}/bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb`,
      uploadedAt: now,
      createdAt: now,
      updatedAt: now,
    },
  ]);
  const handReceiptRepository = new InMemoryHandReceiptRepository([
    {
      id: "cccccccc-cccc-4ccc-cccc-cccccccccccc",
      accountId: account.id,
      name: "Primary receipt",
      notes: null,
      handReceiptNumber: null,
      holderName: null,
      unitName: null,
      uic: null,
      effectiveDate: null,
      status: "active",
      createdAt: now,
      updatedAt: now,
    },
  ]);
  const itemRepository = new InMemoryItemRepository([
    {
      id: "dddddddd-dddd-4ddd-9ddd-dddddddddddd",
      accountId: account.id,
      handReceiptId: "cccccccc-cccc-4ccc-cccc-cccccccccccc",
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
  ]);
  const locationRepository = createEmptyLocationRepository();
  const requirementRepository = createEmptyRequirementRepository();
  const unitOfWork = createInMemoryAppUnitOfWork({
    accountRepository,
    assignmentItemLinkRepository,
    assignmentRepository,
    auditRepository,
    contactRepository,
    documentRepository,
    handReceiptRepository,
    itemRepository,
    locationRepository,
    requirementRepository,
  });

  return {
    assignmentItemLinkRepository,
    assignmentRepository,
    auditRepository,
    caller: appRouter.createCaller({
      session: { userId: account.userId, email: "owner@example.com" },
      account,
      accountRepository,
      assignmentItemLinkRepository,
      assignmentRepository,
      auditRepository,
      contactRepository,
      documentRepository,
      handReceiptRepository,
      itemRepository,
      locationRepository,
      requirementRepository,
      unitOfWork,
    }),
  };
}

describe("assignments2062Router", () => {
  it("creates a single-item 2062 through the typed procedure", async () => {
    const { caller, assignmentRepository, assignmentItemLinkRepository } =
      createCaller();

    const result = await caller.assignments2062.create({
      itemId: "dddddddd-dddd-4ddd-9ddd-dddddddddddd",
      contactId: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
      documentId: "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb",
    });

    expect(result.assignment).toMatchObject({ status: "active" });
    expect(assignmentRepository.assignments).toHaveLength(1);
    expect(assignmentItemLinkRepository.links).toHaveLength(1);
  });

  it("maps active coverage conflicts to CONFLICT", async () => {
    const { caller, assignmentItemLinkRepository } = createCaller();
    assignmentItemLinkRepository.links.push({
      id: "eeeeeeee-eeee-4eee-9eee-eeeeeeeeeeee",
      accountId: "account-1",
      assignmentId: "ffffffff-ffff-4fff-8fff-ffffffffffff",
      itemId: "dddddddd-dddd-4ddd-9ddd-dddddddddddd",
      status: "active",
      closedAt: null,
      createdAt: now,
      updatedAt: now,
    });

    await expect(
      caller.assignments2062.create({
        itemId: "dddddddd-dddd-4ddd-9ddd-dddddddddddd",
        contactId: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
        documentId: "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb",
      }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("maps read-only accounts to FORBIDDEN", async () => {
    const { caller } = createCaller(
      createAccount({ accessState: "paused_read_only" }),
    );

    await expect(
      caller.assignments2062.create({
        itemId: "dddddddd-dddd-4ddd-9ddd-dddddddddddd",
        contactId: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
        documentId: "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb",
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
