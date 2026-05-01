import { describe, expect, it } from "vitest";

import type { AccountRecord } from "@/modules/accounts/application/ensure-account";
import { createHandReceipt } from "@/modules/hand-receipts";
import { InMemoryAuditRepository } from "../../support/audit-repository";
import { InMemoryHandReceiptRepository } from "../../support/hand-receipt-repository";

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

describe("createHandReceipt", () => {
  it("creates an active hand receipt and records an audit event", async () => {
    const account = createAccount();
    const handReceiptRepository = new InMemoryHandReceiptRepository();
    const auditRepository = new InMemoryAuditRepository();

    const handReceipt = await createHandReceipt({
      account,
      actorId: account.userId,
      input: {
        name: "HQ hand receipt",
        notes: "Sensitive items stay in the wall locker.",
      },
      handReceiptRepository,
      auditRepository,
      now: new Date("2026-04-30T12:00:00.000Z"),
      createHandReceiptId: () => "created-hand-receipt-1",
    });

    expect(handReceipt).toMatchObject({
      accountId: account.id,
      name: "HQ hand receipt",
      notes: "Sensitive items stay in the wall locker.",
      status: "active",
    });
    expect(auditRepository.events).toMatchObject([
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

  it("propagates audit recording failures to the caller", async () => {
    const handReceiptRepository = new InMemoryHandReceiptRepository();
    const auditRepository = new InMemoryAuditRepository();
    auditRepository.failRecording = true;

    await expect(
      createHandReceipt({
        account: createAccount(),
        actorId: "owner-1",
        input: {
          name: "Unaudited receipt",
        },
        handReceiptRepository,
        auditRepository,
      }),
    ).rejects.toThrow("Audit event was not recorded.");

    expect(auditRepository.events).toEqual([]);
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
        auditRepository: new InMemoryAuditRepository(),
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
        auditRepository: new InMemoryAuditRepository(),
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
        auditRepository: new InMemoryAuditRepository(),
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
        auditRepository: new InMemoryAuditRepository(),
      }),
    ).rejects.toThrow("Active hand receipt limit reached.");
  });

  it("allows trial and Pro accounts to create beyond the Base limit", async () => {
    const now = new Date("2026-04-30T12:00:00.000Z");
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
        auditRepository: new InMemoryAuditRepository(),
        now,
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
        auditRepository: new InMemoryAuditRepository(),
        now,
      }),
    ).resolves.toMatchObject({
      name: "Pro receipt",
    });
  });
});
