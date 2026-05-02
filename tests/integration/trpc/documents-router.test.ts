import { TRPCError } from "@trpc/server";
import { describe, expect, it } from "vitest";

import type { AccountRecord } from "@/modules/accounts/application/ensure-account";
import type { AcceptedDocumentMimeType } from "@/modules/documents";
import { appRouter } from "@/server/trpc/router";
import { createEmptyAccountRepository } from "../../support/account-repository";
import { InMemoryAuditRepository } from "../../support/audit-repository";
import { createInMemoryAppUnitOfWork } from "../../support/app-unit-of-work";
import { createEmptyContactRepository } from "../../support/contact-repository";
import { InMemoryDocumentRepository } from "../../support/document-repository";
import { InMemoryHandReceiptRepository } from "../../support/hand-receipt-repository";
import { createEmptyItemRepository } from "../../support/item-repository";
import { createEmptyLocationRepository } from "../../support/location-repository";
import { createEmptyRequirementRepository } from "../../support/requirement-repository";
import { MockStoragePort } from "../../support/storage-port";

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

function createHandReceipt(overrides = {}) {
  return {
    id: "8d899b9d-ee59-4f5a-a587-934a750fce48",
    accountId: "account-1",
    name: "Primary receipt",
    notes: null,
    handReceiptNumber: null,
    holderName: null,
    unitName: null,
    uic: null,
    effectiveDate: null,
    status: "active" as const,
    createdAt: new Date("2026-05-02T12:00:00.000Z"),
    updatedAt: new Date("2026-05-02T12:00:00.000Z"),
    ...overrides,
  };
}

function createCaller({
  account = createAccount(),
  documentRepository = new InMemoryDocumentRepository(),
  handReceiptRepository = new InMemoryHandReceiptRepository([
    createHandReceipt({ accountId: account.id }),
  ]),
  auditRepository = new InMemoryAuditRepository(),
  storagePort = new MockStoragePort(),
}: {
  account?: AccountRecord;
  documentRepository?: InMemoryDocumentRepository;
  handReceiptRepository?: InMemoryHandReceiptRepository;
  auditRepository?: InMemoryAuditRepository;
  storagePort?: MockStoragePort;
} = {}) {
  const contactRepository = createEmptyContactRepository();
  const itemRepository = createEmptyItemRepository();
  const locationRepository = createEmptyLocationRepository();
  const requirementRepository = createEmptyRequirementRepository();

  return appRouter.createCaller({
    session: {
      userId: account.userId,
      email: "owner@example.com",
    },
    account,
    accountRepository: createEmptyAccountRepository(),
    auditRepository,
    contactRepository,
    documentRepository,
    handReceiptRepository,
    itemRepository,
    locationRepository,
    requirementRepository,
    storagePort,
    unitOfWork: createInMemoryAppUnitOfWork({
      auditRepository,
      contactRepository,
      documentRepository,
      handReceiptRepository,
      itemRepository,
      locationRepository,
      requirementRepository,
    }),
  });
}

describe("documentsRouter", () => {
  it("initiates an upload without persisting metadata until completion", async () => {
    const documentRepository = new InMemoryDocumentRepository();
    const caller = createCaller({ documentRepository });

    const result = await caller.documents.initiateUpload({
      filename: "signed-2062.pdf",
      handReceiptId: "8d899b9d-ee59-4f5a-a587-934a750fce48",
      mimeType: "application/pdf",
      sizeBytes: 1024,
    });

    expect(result.pendingDocument).toMatchObject({
      filename: "signed-2062.pdf",
      handReceiptId: "8d899b9d-ee59-4f5a-a587-934a750fce48",
      storagePath: `account-1/${result.pendingDocument.id}`,
    });
    await expect(
      caller.documents.list({
        handReceiptId: "8d899b9d-ee59-4f5a-a587-934a750fce48",
      }),
    ).resolves.toEqual([]);

    const completed = await caller.documents.completeUpload({
      documentId: result.pendingDocument.id,
      filename: result.pendingDocument.filename,
      handReceiptId: result.pendingDocument.handReceiptId,
      mimeType: result.pendingDocument.mimeType as AcceptedDocumentMimeType,
      sizeBytes: result.pendingDocument.sizeBytes,
    });

    expect(completed.document).toMatchObject({
      accountId: "account-1",
      handReceiptId: "8d899b9d-ee59-4f5a-a587-934a750fce48",
      filename: "signed-2062.pdf",
      storagePath: `account-1/${result.pendingDocument.id}`,
    });
    await expect(caller.documents.list()).resolves.toMatchObject([
      { id: result.pendingDocument.id },
    ]);
    await expect(
      caller.documents.list({
        handReceiptId: "8d899b9d-ee59-4f5a-a587-934a750fce48",
      }),
    ).resolves.toMatchObject([{ id: result.pendingDocument.id }]);
  });

  it("returns FORBIDDEN for read-only accounts", async () => {
    await expect(
      createCaller({
        account: createAccount({ accessState: "paused_read_only" }),
      }).documents.initiateUpload({
        filename: "signed-2062.pdf",
        handReceiptId: "8d899b9d-ee59-4f5a-a587-934a750fce48",
        mimeType: "application/pdf",
        sizeBytes: 1024,
      }),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("rejects invalid MIME types before the procedure runs", async () => {
    await expect(
      createCaller().documents.initiateUpload({
        filename: "notes.txt",
        handReceiptId: "8d899b9d-ee59-4f5a-a587-934a750fce48",
        mimeType: "text/plain" as "application/pdf",
        sizeBytes: 1024,
      }),
    ).rejects.toBeInstanceOf(TRPCError);
  });

  it("gets a document with a signed download URL", async () => {
    const documentRepository = new InMemoryDocumentRepository([
      {
        id: "4d39229c-f714-4e3f-9ea1-77c9bfdca76c",
        accountId: "account-1",
        handReceiptId: "8d899b9d-ee59-4f5a-a587-934a750fce48",
        filename: "signed-2062.pdf",
        mimeType: "application/pdf",
        sizeBytes: 1024,
        storagePath: "account-1/4d39229c-f714-4e3f-9ea1-77c9bfdca76c",
        uploadedAt: new Date("2026-05-02T12:00:00.000Z"),
        createdAt: new Date("2026-05-02T12:00:00.000Z"),
        updatedAt: new Date("2026-05-02T12:00:00.000Z"),
      },
    ]);
    const caller = createCaller({ documentRepository });

    await expect(
      caller.documents.getById({
        id: "4d39229c-f714-4e3f-9ea1-77c9bfdca76c",
      }),
    ).resolves.toMatchObject({
      document: {
        filename: "signed-2062.pdf",
      },
      downloadUrl:
        "https://storage.test/download/account-1/4d39229c-f714-4e3f-9ea1-77c9bfdca76c",
    });
  });
});
