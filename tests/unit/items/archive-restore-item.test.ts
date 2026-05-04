import { describe, expect, it } from "vitest";

import type { AccountRecord } from "@/modules/accounts/application/ensure-account";
import { archiveItem, restoreItem } from "@/modules/items";
import { InMemoryAuditRepository } from "../../support/audit-repository";
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

function createRepository() {
  return new InMemoryItemRepository([
    {
      id: "active-item",
      accountId: "account-1",
      handReceiptId: "hand-receipt-1",
      nomenclature: "Active radio",
      ecn: "ECN-001",
      serialNumber: null,
      generatedId: null,
      notes: null,
      status: "active",
      createdAt: new Date("2026-04-30T12:00:00.000Z"),
      updatedAt: new Date("2026-04-30T12:00:00.000Z"),
    },
    {
      id: "archived-item",
      accountId: "account-1",
      handReceiptId: "hand-receipt-1",
      nomenclature: "Archived radio",
      ecn: "ECN-002",
      serialNumber: null,
      generatedId: null,
      notes: null,
      status: "archived",
      createdAt: new Date("2026-04-29T12:00:00.000Z"),
      updatedAt: new Date("2026-04-29T12:00:00.000Z"),
    },
  ]);
}

describe("archiveItem", () => {
  it("archives an active item and records audit history", async () => {
    const account = createAccount();
    const itemRepository = createRepository();
    const auditRepository = new InMemoryAuditRepository();

    const archived = await archiveItem({
      account,
      actorId: account.userId,
      itemId: "active-item",
      itemRepository,
      auditRepository,
      now: new Date("2026-04-30T13:00:00.000Z"),
    });

    expect(archived).toMatchObject({
      id: "active-item",
      status: "archived",
      updatedAt: new Date("2026-04-30T13:00:00.000Z"),
    });
    expect(auditRepository.events).toMatchObject([
      {
        accountId: account.id,
        actorId: account.userId,
        action: "item.archived",
        targetType: "item",
        targetId: "active-item",
        metadata: {
          name: "Active radio",
          handReceiptId: "hand-receipt-1",
        },
      },
    ]);
  });

  it("blocks archive for read-only accounts", async () => {
    const auditRepository = new InMemoryAuditRepository();

    await expect(
      archiveItem({
        account: createAccount({
          accessState: "paused_read_only",
          subscriptionTier: "pro",
        }),
        actorId: "owner-1",
        itemId: "active-item",
        itemRepository: createRepository(),
        auditRepository,
      }),
    ).rejects.toThrow("This account is read-only.");
    expect(auditRepository.events).toEqual([]);
  });

  it("does not archive an already archived item", async () => {
    const auditRepository = new InMemoryAuditRepository();

    await expect(
      archiveItem({
        account: createAccount(),
        actorId: "owner-1",
        itemId: "archived-item",
        itemRepository: createRepository(),
        auditRepository,
      }),
    ).rejects.toThrow("Item is already archived.");
    expect(auditRepository.events).toEqual([]);
  });

  it("archives an item with active 2062 coverage and closes that item link", async () => {
    const auditRepository = new InMemoryAuditRepository();
    const itemRepository = createRepository();
    const closedLinks: string[] = [];

    const archived = await archiveItem({
      account: createAccount(),
      actorId: "owner-1",
      itemId: "active-item",
      itemRepository,
      auditRepository,
      getActive2062CoverageInfo: ({ accountId, itemId }) =>
        accountId === "account-1" && itemId === "active-item"
          ? {
              hasActiveCoverage: true,
              itemLinkId: "link-1",
              assignmentId: "assignment-1",
              isLastActiveLink: true,
            }
          : null,
      closeActive2062ItemLink: async ({ itemLinkId }) => {
        closedLinks.push(itemLinkId);
        await itemRepository.update("account-1", "active-item", {
          signedToContactId: null,
        });
      },
    });

    expect(archived).toMatchObject({
      id: "active-item",
      status: "archived",
      signedToContactId: null,
    });
    expect(closedLinks).toEqual(["link-1"]);
    expect(auditRepository.events).toMatchObject([
      {
        action: "item.archived",
        targetType: "item",
        targetId: "active-item",
      },
    ]);
  });
});

describe("restoreItem", () => {
  it("restores an archived item and records audit history", async () => {
    const account = createAccount();
    const itemRepository = createRepository();
    const auditRepository = new InMemoryAuditRepository();

    const restored = await restoreItem({
      account,
      actorId: account.userId,
      itemId: "archived-item",
      itemRepository,
      auditRepository,
      now: new Date("2026-04-30T14:00:00.000Z"),
    });

    expect(restored).toMatchObject({
      id: "archived-item",
      status: "active",
      updatedAt: new Date("2026-04-30T14:00:00.000Z"),
    });
    expect(auditRepository.events).toMatchObject([
      {
        accountId: account.id,
        actorId: account.userId,
        action: "item.restored",
        targetType: "item",
        targetId: "archived-item",
        metadata: {
          name: "Archived radio",
          handReceiptId: "hand-receipt-1",
        },
      },
    ]);
  });

  it("blocks restore for read-only accounts", async () => {
    const auditRepository = new InMemoryAuditRepository();

    await expect(
      restoreItem({
        account: createAccount({
          accessState: "paused_read_only",
          subscriptionTier: "pro",
        }),
        actorId: "owner-1",
        itemId: "archived-item",
        itemRepository: createRepository(),
        auditRepository,
      }),
    ).rejects.toThrow("This account is read-only.");
    expect(auditRepository.events).toEqual([]);
  });

  it("does not restore an already active item", async () => {
    const auditRepository = new InMemoryAuditRepository();

    await expect(
      restoreItem({
        account: createAccount(),
        actorId: "owner-1",
        itemId: "active-item",
        itemRepository: createRepository(),
        auditRepository,
      }),
    ).rejects.toThrow("Item is already active.");
    expect(auditRepository.events).toEqual([]);
  });

  it("returns null when the item is not in the account", async () => {
    await expect(
      restoreItem({
        account: createAccount(),
        actorId: "owner-1",
        itemId: "missing-item",
        itemRepository: createRepository(),
        auditRepository: new InMemoryAuditRepository(),
      }),
    ).resolves.toBeNull();
  });
});
