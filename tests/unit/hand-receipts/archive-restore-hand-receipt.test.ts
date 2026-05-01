import { describe, expect, it } from "vitest";

import type { AccountRecord } from "@/modules/accounts/application/ensure-account";
import {
  archiveHandReceipt,
  restoreHandReceipt,
} from "@/modules/hand-receipts";
import { InMemoryHandReceiptRepository } from "../../support/hand-receipt-repository";

function createAccount(overrides: Partial<AccountRecord> = {}): AccountRecord {
  return {
    id: "account-1",
    userId: "owner-1",
    accessState: "active",
    subscriptionTier: "base",
    trialStartsAt: new Date("2026-04-01T12:00:00.000Z"),
    trialEndsAt: new Date("2026-05-01T12:00:00.000Z"),
    onboardingCompletedAt: null,
    ...overrides,
  };
}

function createRepository() {
  return new InMemoryHandReceiptRepository([
    {
      id: "active-receipt",
      accountId: "account-1",
      name: "Active receipt",
      notes: null,
      handReceiptNumber: null,
      holderName: null,
      unitName: null,
      uic: null,
      effectiveDate: null,
      status: "active",
      createdAt: new Date("2026-04-30T12:00:00.000Z"),
      updatedAt: new Date("2026-04-30T12:00:00.000Z"),
    },
    {
      id: "archived-receipt",
      accountId: "account-1",
      name: "Archived receipt",
      notes: null,
      handReceiptNumber: null,
      holderName: null,
      unitName: null,
      uic: null,
      effectiveDate: null,
      status: "archived",
      createdAt: new Date("2026-04-29T12:00:00.000Z"),
      updatedAt: new Date("2026-04-29T12:00:00.000Z"),
    },
  ]);
}

describe("archiveHandReceipt", () => {
  it("archives an active hand receipt and records audit history", async () => {
    const account = createAccount();
    const repository = createRepository();

    const archived = await archiveHandReceipt({
      account,
      actorId: account.userId,
      handReceiptId: "active-receipt",
      handReceiptRepository: repository,
      now: new Date("2026-04-30T13:00:00.000Z"),
    });

    expect(archived).toMatchObject({
      id: "active-receipt",
      status: "archived",
      updatedAt: new Date("2026-04-30T13:00:00.000Z"),
    });
    expect(repository.auditEvents).toMatchObject([
      {
        accountId: account.id,
        actorId: account.userId,
        action: "hand_receipt.archived",
        targetType: "hand_receipt",
        targetId: "active-receipt",
        metadata: {
          name: "Active receipt",
        },
      },
    ]);
  });

  it("blocks archiving for read-only accounts", async () => {
    await expect(
      archiveHandReceipt({
        account: createAccount({
          accessState: "paused_read_only",
          subscriptionTier: "pro",
        }),
        actorId: "owner-1",
        handReceiptId: "active-receipt",
        handReceiptRepository: createRepository(),
      }),
    ).rejects.toThrow("This account is read-only.");
  });

  it("does not archive an already archived hand receipt", async () => {
    const repository = createRepository();

    await expect(
      archiveHandReceipt({
        account: createAccount(),
        actorId: "owner-1",
        handReceiptId: "archived-receipt",
        handReceiptRepository: repository,
      }),
    ).rejects.toThrow("Hand receipt is already archived.");
    expect(repository.auditEvents).toEqual([]);
  });
});

describe("restoreHandReceipt", () => {
  it("restores an archived hand receipt and records audit history", async () => {
    const account = createAccount();
    const repository = createRepository();

    const restored = await restoreHandReceipt({
      account,
      actorId: account.userId,
      handReceiptId: "archived-receipt",
      handReceiptRepository: repository,
      now: new Date("2026-04-30T13:30:00.000Z"),
    });

    expect(restored).toMatchObject({
      id: "archived-receipt",
      status: "active",
      updatedAt: new Date("2026-04-30T13:30:00.000Z"),
    });
    expect(repository.auditEvents).toMatchObject([
      {
        accountId: account.id,
        actorId: account.userId,
        action: "hand_receipt.restored",
        targetType: "hand_receipt",
        targetId: "archived-receipt",
        metadata: {
          name: "Archived receipt",
        },
      },
    ]);
  });

  it("blocks restore when Base is already at the active limit", async () => {
    const repository = new InMemoryHandReceiptRepository([
      ...createRepository().handReceipts,
      {
        id: "active-2",
        accountId: "account-1",
        name: "Active 2",
        notes: null,
        handReceiptNumber: null,
        holderName: null,
        unitName: null,
        uic: null,
        effectiveDate: null,
        status: "active",
        createdAt: new Date("2026-04-28T12:00:00.000Z"),
        updatedAt: new Date("2026-04-28T12:00:00.000Z"),
      },
      {
        id: "active-3",
        accountId: "account-1",
        name: "Active 3",
        notes: null,
        handReceiptNumber: null,
        holderName: null,
        unitName: null,
        uic: null,
        effectiveDate: null,
        status: "active",
        createdAt: new Date("2026-04-27T12:00:00.000Z"),
        updatedAt: new Date("2026-04-27T12:00:00.000Z"),
      },
    ]);

    await expect(
      restoreHandReceipt({
        account: createAccount(),
        actorId: "owner-1",
        handReceiptId: "archived-receipt",
        handReceiptRepository: repository,
      }),
    ).rejects.toThrow("Active hand receipt limit reached.");
    expect(repository.auditEvents).toEqual([]);
  });

  it("does not restore an already active hand receipt", async () => {
    const repository = createRepository();

    await expect(
      restoreHandReceipt({
        account: createAccount(),
        actorId: "owner-1",
        handReceiptId: "active-receipt",
        handReceiptRepository: repository,
      }),
    ).rejects.toThrow("Hand receipt is already active.");
    expect(repository.auditEvents).toEqual([]);
  });
});
