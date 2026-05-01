import { describe, expect, it } from "vitest";

import type { AccountRecord } from "@/modules/accounts/application/ensure-account";
import { createHandReceipt } from "@/modules/hand-receipts";
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

describe("createHandReceipt", () => {
  it("creates an active hand receipt and records an audit event", async () => {
    const account = createAccount();
    const handReceiptRepository = new InMemoryHandReceiptRepository();

    const handReceipt = await createHandReceipt({
      account,
      actorId: account.userId,
      input: {
        name: "HQ hand receipt",
        notes: "Sensitive items stay in the wall locker.",
      },
      handReceiptRepository,
      now: new Date("2026-04-30T12:00:00.000Z"),
      createHandReceiptId: () => "created-hand-receipt-1",
    });

    expect(handReceipt).toMatchObject({
      accountId: account.id,
      name: "HQ hand receipt",
      notes: "Sensitive items stay in the wall locker.",
      status: "active",
    });
    expect(handReceiptRepository.auditEvents).toMatchObject([
      {
        accountId: account.id,
        actorId: account.userId,
        action: "hand_receipt.created",
        targetType: "hand_receipt",
        targetId: handReceipt.id,
        metadata: {
          name: "HQ hand receipt",
        },
      },
    ]);
  });

  it("does not create a hand receipt when the audit event cannot be recorded", async () => {
    const handReceiptRepository = new InMemoryHandReceiptRepository();
    handReceiptRepository.failAuditRecording = true;

    await expect(
      createHandReceipt({
        account: createAccount(),
        actorId: "owner-1",
        input: {
          name: "Unaudited receipt",
        },
        handReceiptRepository,
      }),
    ).rejects.toThrow("Audit event was not recorded.");

    expect(handReceiptRepository.handReceipts).toEqual([]);
    expect(handReceiptRepository.auditEvents).toEqual([]);
  });

  it("requires a non-empty name", async () => {
    await expect(
      createHandReceipt({
        account: createAccount(),
        actorId: "owner-1",
        input: {
          name: "   ",
        },
        handReceiptRepository: new InMemoryHandReceiptRepository(),
      }),
    ).rejects.toThrow("Hand receipt name is required.");
  });

  it("blocks paused or read-only accounts", async () => {
    await expect(
      createHandReceipt({
        account: createAccount({
          accessState: "paused_read_only",
          subscriptionTier: "pro",
        }),
        actorId: "owner-1",
        input: {
          name: "Read-only receipt",
        },
        handReceiptRepository: new InMemoryHandReceiptRepository(),
      }),
    ).rejects.toThrow("This account is read-only.");
  });

  it("enforces the Base active hand receipt limit without counting archived records", async () => {
    const account = createAccount();
    const handReceiptRepository = new InMemoryHandReceiptRepository([
      {
        id: "active-1",
        accountId: account.id,
        name: "Alpha",
        notes: null,
        handReceiptNumber: null,
        holderName: null,
        unitName: null,
        uic: null,
        effectiveDate: null,
        status: "active",
        createdAt: new Date("2026-04-01T12:00:00.000Z"),
        updatedAt: new Date("2026-04-01T12:00:00.000Z"),
      },
      {
        id: "active-2",
        accountId: account.id,
        name: "Bravo",
        notes: null,
        handReceiptNumber: null,
        holderName: null,
        unitName: null,
        uic: null,
        effectiveDate: null,
        status: "active",
        createdAt: new Date("2026-04-02T12:00:00.000Z"),
        updatedAt: new Date("2026-04-02T12:00:00.000Z"),
      },
      {
        id: "archived-1",
        accountId: account.id,
        name: "Archived",
        notes: null,
        handReceiptNumber: null,
        holderName: null,
        unitName: null,
        uic: null,
        effectiveDate: null,
        status: "archived",
        createdAt: new Date("2026-04-03T12:00:00.000Z"),
        updatedAt: new Date("2026-04-03T12:00:00.000Z"),
      },
    ]);

    await expect(
      createHandReceipt({
        account,
        actorId: account.userId,
        input: {
          name: "Charlie",
        },
        handReceiptRepository,
      }),
    ).resolves.toMatchObject({
      name: "Charlie",
    });

    await expect(
      createHandReceipt({
        account,
        actorId: account.userId,
        input: {
          name: "Delta",
        },
        handReceiptRepository,
      }),
    ).rejects.toThrow("Active hand receipt limit reached.");
  });

  it("allows trial and Pro accounts to create beyond the Base limit", async () => {
    const seededReceipts = Array.from({ length: 4 }, (_, index) => ({
      id: `active-${index}`,
      accountId: "account-1",
      name: `Receipt ${index}`,
      notes: null,
      handReceiptNumber: null,
      holderName: null,
      unitName: null,
      uic: null,
      effectiveDate: null,
      status: "active" as const,
      createdAt: new Date(`2026-04-0${index + 1}T12:00:00.000Z`),
      updatedAt: new Date(`2026-04-0${index + 1}T12:00:00.000Z`),
    }));

    await expect(
      createHandReceipt({
        account: createAccount({
          accessState: "trialing",
          subscriptionTier: null,
        }),
        actorId: "owner-1",
        input: {
          name: "Trial receipt",
        },
        handReceiptRepository: new InMemoryHandReceiptRepository(
          seededReceipts,
        ),
      }),
    ).resolves.toMatchObject({
      name: "Trial receipt",
    });

    await expect(
      createHandReceipt({
        account: createAccount({
          subscriptionTier: "pro",
        }),
        actorId: "owner-1",
        input: {
          name: "Pro receipt",
        },
        handReceiptRepository: new InMemoryHandReceiptRepository(
          seededReceipts,
        ),
      }),
    ).resolves.toMatchObject({
      name: "Pro receipt",
    });
  });
});
