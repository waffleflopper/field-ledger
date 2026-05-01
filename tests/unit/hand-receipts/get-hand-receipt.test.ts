import { describe, expect, it } from "vitest";

import { getHandReceipt } from "@/modules/hand-receipts";
import { InMemoryHandReceiptRepository } from "../../support/hand-receipt-repository";

describe("getHandReceipt", () => {
  it("returns the requested hand receipt for the owning account", async () => {
    const repository = new InMemoryHandReceiptRepository([
      {
        id: "receipt-1",
        accountId: "account-1",
        name: "Main arms room",
        notes: "Primary property bucket.",
        handReceiptNumber: "HR-001",
        holderName: "SSG Rivera",
        unitName: "A Co",
        uic: "W123AA",
        effectiveDate: "2026-04-30",
        status: "active",
        createdAt: new Date("2026-04-30T12:00:00.000Z"),
        updatedAt: new Date("2026-04-30T12:00:00.000Z"),
      },
    ]);

    await expect(
      getHandReceipt({
        accountId: "account-1",
        handReceiptId: "receipt-1",
        repository,
      }),
    ).resolves.toMatchObject({
      id: "receipt-1",
      name: "Main arms room",
      handReceiptNumber: "HR-001",
    });
  });

  it("returns null when the hand receipt is missing or belongs to another account", async () => {
    const repository = new InMemoryHandReceiptRepository([
      {
        id: "receipt-1",
        accountId: "account-2",
        name: "Other account",
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
    ]);

    await expect(
      getHandReceipt({
        accountId: "account-1",
        handReceiptId: "receipt-1",
        repository,
      }),
    ).resolves.toBeNull();
    await expect(
      getHandReceipt({
        accountId: "account-1",
        handReceiptId: "missing",
        repository,
      }),
    ).resolves.toBeNull();
  });
});
