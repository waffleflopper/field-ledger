import { describe, expect, it } from "vitest";

import type { AccountRecord } from "@/modules/accounts/application/ensure-account";
import { moveItem } from "@/modules/items";
import { InMemoryAuditRepository } from "../../support/audit-repository";
import { InMemoryHandReceiptRepository } from "../../support/hand-receipt-repository";
import { InMemoryItemRepository } from "../../support/item-repository";

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

function createHandReceiptRepository() {
  return new InMemoryHandReceiptRepository([
    {
      id: "source-receipt",
      accountId: "account-1",
      name: "Source receipt",
      notes: null,
      handReceiptNumber: null,
      holderName: null,
      unitName: null,
      uic: null,
      effectiveDate: null,
      status: "active",
      createdAt: new Date("2026-04-29T12:00:00.000Z"),
      updatedAt: new Date("2026-04-29T12:00:00.000Z"),
    },
    {
      id: "target-receipt",
      accountId: "account-1",
      name: "Target receipt",
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
      createdAt: new Date("2026-04-28T12:00:00.000Z"),
      updatedAt: new Date("2026-04-28T12:00:00.000Z"),
    },
    {
      id: "archived-source-receipt",
      accountId: "account-1",
      name: "Archived source receipt",
      notes: null,
      handReceiptNumber: null,
      holderName: null,
      unitName: null,
      uic: null,
      effectiveDate: null,
      status: "archived",
      createdAt: new Date("2026-04-27T12:00:00.000Z"),
      updatedAt: new Date("2026-04-27T12:00:00.000Z"),
    },
  ]);
}

function createItemRepository() {
  return new InMemoryItemRepository([
    {
      id: "active-item",
      accountId: "account-1",
      handReceiptId: "source-receipt",
      nomenclature: "M4 carbine",
      ecn: "ECN-001",
      serialNumber: "SER-001",
      generatedId: "FL-000001",
      notes: "Rack 3",
      status: "active",
      createdAt: new Date("2026-04-30T12:00:00.000Z"),
      updatedAt: new Date("2026-04-30T12:00:00.000Z"),
    },
    {
      id: "archived-item",
      accountId: "account-1",
      handReceiptId: "source-receipt",
      nomenclature: "Archived radio",
      ecn: "ECN-002",
      serialNumber: null,
      generatedId: null,
      notes: null,
      status: "archived",
      createdAt: new Date("2026-04-29T12:00:00.000Z"),
      updatedAt: new Date("2026-04-29T12:00:00.000Z"),
    },
    {
      id: "item-in-archived-source",
      accountId: "account-1",
      handReceiptId: "archived-source-receipt",
      nomenclature: "Source archived radio",
      ecn: "ECN-003",
      serialNumber: null,
      generatedId: null,
      notes: null,
      status: "active",
      createdAt: new Date("2026-04-29T12:00:00.000Z"),
      updatedAt: new Date("2026-04-29T12:00:00.000Z"),
    },
  ]);
}

describe("moveItem", () => {
  it("moves an active item to another active hand receipt and records audit history", async () => {
    const account = createAccount();
    const itemRepository = createItemRepository();
    const auditRepository = new InMemoryAuditRepository();

    const moved = await moveItem({
      account,
      actorId: account.userId,
      itemId: "active-item",
      targetHandReceiptId: "target-receipt",
      itemRepository,
      handReceiptRepository: createHandReceiptRepository(),
      auditRepository,
      now: new Date("2026-04-30T13:00:00.000Z"),
    });

    expect(moved).toMatchObject({
      id: "active-item",
      handReceiptId: "target-receipt",
      nomenclature: "M4 carbine",
      ecn: "ECN-001",
      serialNumber: "SER-001",
      generatedId: "FL-000001",
      notes: "Rack 3",
      status: "active",
      updatedAt: new Date("2026-04-30T13:00:00.000Z"),
    });
    expect(auditRepository.events).toMatchObject([
      {
        accountId: account.id,
        actorId: account.userId,
        action: "item.moved",
        targetType: "item",
        targetId: "active-item",
        metadata: {
          name: "M4 carbine",
          fromHandReceiptId: "source-receipt",
          toHandReceiptId: "target-receipt",
        },
      },
    ]);
  });

  it("returns the existing item without audit when target matches source", async () => {
    const auditRepository = new InMemoryAuditRepository();

    const moved = await moveItem({
      account: createAccount(),
      actorId: "owner-1",
      itemId: "active-item",
      targetHandReceiptId: "source-receipt",
      itemRepository: createItemRepository(),
      handReceiptRepository: createHandReceiptRepository(),
      auditRepository,
    });

    expect(moved).toMatchObject({
      id: "active-item",
      handReceiptId: "source-receipt",
    });
    expect(auditRepository.events).toEqual([]);
  });

  it("blocks move for read-only accounts", async () => {
    const auditRepository = new InMemoryAuditRepository();

    await expect(
      moveItem({
        account: createAccount({
          accessState: "paused_read_only",
          subscriptionTier: "pro",
        }),
        actorId: "owner-1",
        itemId: "active-item",
        targetHandReceiptId: "target-receipt",
        itemRepository: createItemRepository(),
        handReceiptRepository: createHandReceiptRepository(),
        auditRepository,
      }),
    ).rejects.toThrow("This account is read-only.");
    expect(auditRepository.events).toEqual([]);
  });

  it("rejects archived items and archived target receipts", async () => {
    await expect(
      moveItem({
        account: createAccount(),
        actorId: "owner-1",
        itemId: "archived-item",
        targetHandReceiptId: "target-receipt",
        itemRepository: createItemRepository(),
        handReceiptRepository: createHandReceiptRepository(),
        auditRepository: new InMemoryAuditRepository(),
      }),
    ).rejects.toThrow("Cannot move an archived item.");

    await expect(
      moveItem({
        account: createAccount(),
        actorId: "owner-1",
        itemId: "active-item",
        targetHandReceiptId: "archived-receipt",
        itemRepository: createItemRepository(),
        handReceiptRepository: createHandReceiptRepository(),
        auditRepository: new InMemoryAuditRepository(),
      }),
    ).rejects.toThrow("Cannot move item to an archived hand receipt.");
  });

  it("rejects moves from archived source hand receipts", async () => {
    await expect(
      moveItem({
        account: createAccount(),
        actorId: "owner-1",
        itemId: "item-in-archived-source",
        targetHandReceiptId: "target-receipt",
        itemRepository: createItemRepository(),
        handReceiptRepository: createHandReceiptRepository(),
        auditRepository: new InMemoryAuditRepository(),
      }),
    ).rejects.toThrow("Cannot move item from an archived hand receipt.");
  });

  it("blocks movement through the future active 2062 coverage hook", async () => {
    await expect(
      moveItem({
        account: createAccount(),
        actorId: "owner-1",
        itemId: "active-item",
        targetHandReceiptId: "target-receipt",
        itemRepository: createItemRepository(),
        handReceiptRepository: createHandReceiptRepository(),
        auditRepository: new InMemoryAuditRepository(),
        hasActive2062Coverage: ({ accountId, itemId }) =>
          accountId === "account-1" && itemId === "active-item",
      }),
    ).rejects.toThrow("Cannot move item with active 2062 coverage.");
  });

  it("returns null when the item or target hand receipt is outside the account", async () => {
    await expect(
      moveItem({
        account: createAccount(),
        actorId: "owner-1",
        itemId: "missing-item",
        targetHandReceiptId: "target-receipt",
        itemRepository: createItemRepository(),
        handReceiptRepository: createHandReceiptRepository(),
        auditRepository: new InMemoryAuditRepository(),
      }),
    ).resolves.toBeNull();

    await expect(
      moveItem({
        account: createAccount(),
        actorId: "owner-1",
        itemId: "active-item",
        targetHandReceiptId: "missing-receipt",
        itemRepository: createItemRepository(),
        handReceiptRepository: createHandReceiptRepository(),
        auditRepository: new InMemoryAuditRepository(),
      }),
    ).resolves.toBeNull();
  });
});
