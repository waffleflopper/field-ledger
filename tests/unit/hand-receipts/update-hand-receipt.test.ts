import { describe, expect, it } from "vitest";

import type { AccountRecord } from "@/modules/accounts/application/ensure-account";
import { updateHandReceipt } from "@/modules/hand-receipts";
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

function createRepository() {
  return new InMemoryHandReceiptRepository([
    {
      id: "receipt-1",
      accountId: "account-1",
      name: "Original receipt",
      notes: "Before update.",
      handReceiptNumber: null,
      holderName: null,
      unitName: null,
      uic: null,
      effectiveDate: null,
      status: "active",
      createdAt: new Date("2026-04-30T12:00:00.000Z"),
      updatedAt: new Date("2026-04-30T12:00:00.000Z"),
    },
  ]);
}

describe("updateHandReceipt", () => {
  it("updates editable fields and records the changed fields in audit history", async () => {
    const account = createAccount();
    const repository = createRepository();
    const auditRepository = new InMemoryAuditRepository();

    const updated = await updateHandReceipt({
      account,
      actorId: account.userId,
      handReceiptId: "receipt-1",
      input: {
        name: "HQ hand receipt",
        notes: "After update.",
        handReceiptNumber: "HR-001",
        holderName: "SSG Rivera",
        unitName: "A Co",
        uic: "W123AA",
        effectiveDate: "2026-04-30",
      },
      handReceiptRepository: repository,
      auditRepository,
      now: new Date("2026-04-30T13:00:00.000Z"),
    });

    expect(updated).toMatchObject({
      id: "receipt-1",
      name: "HQ hand receipt",
      notes: "After update.",
      handReceiptNumber: "HR-001",
      holderName: "SSG Rivera",
      unitName: "A Co",
      uic: "W123AA",
      effectiveDate: "2026-04-30",
    });
    expect(auditRepository.events).toMatchObject([
      {
        accountId: account.id,
        actorId: account.userId,
        action: "hand_receipt.updated",
        targetType: "hand_receipt",
        targetId: "receipt-1",
        metadata: {
          name: "HQ hand receipt",
          changedFields: [
            "name",
            "notes",
            "handReceiptNumber",
            "holderName",
            "unitName",
            "uic",
            "effectiveDate",
          ],
        },
      },
    ]);
  });

  it("returns the existing hand receipt without audit history when nothing changed", async () => {
    const account = createAccount();
    const repository = createRepository();
    const auditRepository = new InMemoryAuditRepository();

    const unchanged = await updateHandReceipt({
      account,
      actorId: account.userId,
      handReceiptId: "receipt-1",
      input: {
        name: "Original receipt",
        notes: "Before update.",
      },
      handReceiptRepository: repository,
      auditRepository,
      now: new Date("2026-04-30T13:00:00.000Z"),
    });

    expect(unchanged).toMatchObject({
      id: "receipt-1",
      name: "Original receipt",
      updatedAt: new Date("2026-04-30T12:00:00.000Z"),
    });
    expect(auditRepository.events).toEqual([]);
  });

  it("requires a non-empty name", async () => {
    const auditRepository = new InMemoryAuditRepository();

    await expect(
      updateHandReceipt({
        account: createAccount(),
        actorId: "owner-1",
        handReceiptId: "receipt-1",
        input: {
          name: "   ",
        },
        handReceiptRepository: createRepository(),
        auditRepository,
      }),
    ).rejects.toThrow("Hand receipt name is required.");
    expect(auditRepository.events).toEqual([]);
  });

  it("blocks paused or read-only accounts", async () => {
    const auditRepository = new InMemoryAuditRepository();

    await expect(
      updateHandReceipt({
        account: createAccount({
          accessState: "paused_read_only",
          subscriptionTier: "pro",
        }),
        actorId: "owner-1",
        handReceiptId: "receipt-1",
        input: {
          name: "Blocked update",
        },
        handReceiptRepository: createRepository(),
        auditRepository,
      }),
    ).rejects.toThrow("This account is read-only.");
    expect(auditRepository.events).toEqual([]);
  });

  it("returns null without recording audit history when the record is not owned by the account", async () => {
    const repository = createRepository();
    const auditRepository = new InMemoryAuditRepository();

    await expect(
      updateHandReceipt({
        account: createAccount({ id: "account-2" }),
        actorId: "owner-2",
        handReceiptId: "receipt-1",
        input: {
          name: "Other account update",
        },
        handReceiptRepository: repository,
        auditRepository,
      }),
    ).resolves.toBeNull();
    expect(auditRepository.events).toEqual([]);
  });
});
