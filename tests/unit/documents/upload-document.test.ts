import { describe, expect, it } from "vitest";

import type { AccountRecord } from "@/modules/accounts/application/ensure-account";
import {
  completeDocumentUpload,
  initiateDocumentUpload,
} from "@/modules/documents";
import { InMemoryAuditRepository } from "../../support/audit-repository";
import { InMemoryDocumentRepository } from "../../support/document-repository";
import { InMemoryHandReceiptRepository } from "../../support/hand-receipt-repository";
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
    id: "hand-receipt-1",
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

describe("initiateDocumentUpload", () => {
  it("creates a signed upload URL without persisting metadata or activity", async () => {
    const account = createAccount();
    const documentRepository = new InMemoryDocumentRepository();
    const auditRepository = new InMemoryAuditRepository();
    const handReceiptRepository = new InMemoryHandReceiptRepository([
      createHandReceipt(),
    ]);
    const storagePort = new MockStoragePort();

    const result = await initiateDocumentUpload({
      account,
      input: {
        filename: "signed-2062.pdf",
        mimeType: "application/pdf",
        sizeBytes: 1234,
        handReceiptId: "hand-receipt-1",
      },
      handReceiptRepository,
      storagePort,
      now: new Date("2026-05-02T12:00:00.000Z"),
      createDocumentId: () => "document-1",
    });

    expect(result.pendingDocument).toMatchObject({
      id: "document-1",
      filename: "signed-2062.pdf",
      mimeType: "application/pdf",
      sizeBytes: 1234,
      handReceiptId: "hand-receipt-1",
      storagePath: "account-1/document-1",
    });
    expect(result.signedUploadUrl).toBe(
      "https://storage.test/upload/account-1/document-1",
    );
    expect(storagePort.uploadCalls).toMatchObject([
      { path: "account-1/document-1" },
    ]);
    expect(documentRepository.documents).toEqual([]);
    expect(auditRepository.events).toEqual([]);
  });
});

describe("completeDocumentUpload", () => {
  it("persists receipt-scoped metadata and records activity after upload success", async () => {
    const account = createAccount();
    const documentRepository = new InMemoryDocumentRepository();
    const auditRepository = new InMemoryAuditRepository();
    const handReceiptRepository = new InMemoryHandReceiptRepository([
      createHandReceipt(),
    ]);

    const result = await completeDocumentUpload({
      account,
      actorId: account.userId,
      input: {
        documentId: "document-1",
        filename: "signed-2062.pdf",
        mimeType: "application/pdf",
        sizeBytes: 1234,
        handReceiptId: "hand-receipt-1",
      },
      documentRepository,
      handReceiptRepository,
      auditRepository,
      storagePort: new MockStoragePort({
        existingPaths: ["account-1/document-1"],
      }),
      now: new Date("2026-05-02T12:00:00.000Z"),
    });

    expect(result.document).toMatchObject({
      id: "document-1",
      accountId: account.id,
      handReceiptId: "hand-receipt-1",
      filename: "signed-2062.pdf",
      mimeType: "application/pdf",
      sizeBytes: 1234,
      storagePath: "account-1/document-1",
    });
    expect(auditRepository.events).toMatchObject([
      {
        accountId: account.id,
        actorId: account.userId,
        action: "document.uploaded",
        targetType: "document",
        targetId: "document-1",
      },
    ]);
  });

  it("rejects completion when the uploaded object cannot be verified", async () => {
    const account = createAccount();
    const documentRepository = new InMemoryDocumentRepository();
    const auditRepository = new InMemoryAuditRepository();
    const handReceiptRepository = new InMemoryHandReceiptRepository([
      createHandReceipt(),
    ]);

    await expect(
      completeDocumentUpload({
        account,
        actorId: account.userId,
        input: {
          documentId: "document-1",
          filename: "signed-2062.pdf",
          mimeType: "application/pdf",
          sizeBytes: 1234,
          handReceiptId: "hand-receipt-1",
        },
        documentRepository,
        handReceiptRepository,
        auditRepository,
        storagePort: new MockStoragePort(),
        now: new Date("2026-05-02T12:00:00.000Z"),
      }),
    ).rejects.toThrow("Uploaded document file was not found.");

    expect(documentRepository.documents).toEqual([]);
    expect(auditRepository.events).toEqual([]);
  });

  it("rejects unsupported MIME types", async () => {
    await expect(
      initiateDocumentUpload({
        account: createAccount(),
        input: {
          filename: "notes.txt",
          mimeType: "text/plain",
          sizeBytes: 12,
          handReceiptId: "hand-receipt-1",
        },
        handReceiptRepository: new InMemoryHandReceiptRepository([
          createHandReceipt(),
        ]),
        storagePort: new MockStoragePort(),
      }),
    ).rejects.toThrow("Unsupported document type: text/plain.");
  });

  it("blocks paused read-only accounts before storage is touched", async () => {
    const storagePort = new MockStoragePort();

    await expect(
      initiateDocumentUpload({
        account: createAccount({ accessState: "paused_read_only" }),
        input: {
          filename: "signed-2062.pdf",
          mimeType: "application/pdf",
          sizeBytes: 12,
          handReceiptId: "hand-receipt-1",
        },
        handReceiptRepository: new InMemoryHandReceiptRepository([
          createHandReceipt(),
        ]),
        storagePort,
      }),
    ).rejects.toThrow("This account is read-only.");
    expect(storagePort.uploadCalls).toEqual([]);
  });

  it("rejects files over the application upload limit before storage is touched", async () => {
    const storagePort = new MockStoragePort();

    await expect(
      initiateDocumentUpload({
        account: createAccount(),
        input: {
          filename: "too-large.pdf",
          mimeType: "application/pdf",
          sizeBytes: 20 * 1024 * 1024 + 1,
          handReceiptId: "hand-receipt-1",
        },
        handReceiptRepository: new InMemoryHandReceiptRepository([
          createHandReceipt(),
        ]),
        storagePort,
      }),
    ).rejects.toThrow("Document file size must be 20 MiB or smaller.");
    expect(storagePort.uploadCalls).toEqual([]);
  });
});
