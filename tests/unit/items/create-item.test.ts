import { describe, expect, it } from "vitest";

import type { AccountRecord } from "@/modules/accounts/application/ensure-account";
import { createItem, formatGeneratedId } from "@/modules/items";
import { InMemoryAccountRepository } from "../../support/account-repository";
import { InMemoryAuditRepository } from "../../support/audit-repository";
import { InMemoryHandReceiptRepository } from "../../support/hand-receipt-repository";
import { InMemoryItemRepository } from "../../support/item-repository";
import { InMemoryLocationRepository } from "../../support/location-repository";

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

function createHandReceiptRepository() {
  return new InMemoryHandReceiptRepository([
    {
      id: "hand-receipt-1",
      accountId: "account-1",
      name: "HQ hand receipt",
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
}

describe("createItem", () => {
  it("creates an active item in a hand receipt and records audit history", async () => {
    const account = createAccount();
    const itemRepository = new InMemoryItemRepository();
    const auditRepository = new InMemoryAuditRepository();

    const result = await createItem({
      account,
      actorId: account.userId,
      input: {
        handReceiptId: "hand-receipt-1",
        nomenclature: "M4 carbine",
        ecn: "ECN-001",
        serialNumber: "SER-001",
        notes: "Rack A",
      },
      itemRepository,
      handReceiptRepository: createHandReceiptRepository(),
      locationRepository: new InMemoryLocationRepository(),
      accountRepository: new InMemoryAccountRepository([account]),
      auditRepository,
      now: new Date("2026-04-30T14:00:00.000Z"),
      createItemId: () => "item-1",
    });

    expect(result).toMatchObject({
      item: {
        id: "item-1",
        accountId: account.id,
        handReceiptId: "hand-receipt-1",
        nomenclature: "M4 carbine",
        ecn: "ECN-001",
        serialNumber: "SER-001",
        generatedId: null,
        notes: "Rack A",
        status: "active",
      },
    });
    expect(auditRepository.events).toMatchObject([
      {
        action: "item.created",
        targetType: "item",
        targetId: "item-1",
        metadata: {
          handReceiptId: "hand-receipt-1",
          nomenclature: "M4 carbine",
          identifiers: {
            ecn: "ECN-001",
            serialNumber: "SER-001",
            generatedId: null,
          },
        },
      },
    ]);
  });

  it("requires nomenclature and at least one stable identifier", async () => {
    const account = createAccount();
    const baseInput = {
      account,
      actorId: account.userId,
      itemRepository: new InMemoryItemRepository(),
      handReceiptRepository: createHandReceiptRepository(),
      locationRepository: new InMemoryLocationRepository(),
      accountRepository: new InMemoryAccountRepository([account]),
      auditRepository: new InMemoryAuditRepository(),
    };

    await expect(
      createItem({
        ...baseInput,
        input: {
          handReceiptId: "hand-receipt-1",
          nomenclature: "   ",
          ecn: "ECN-001",
        },
      }),
    ).rejects.toThrow("Item nomenclature is required.");

    await expect(
      createItem({
        ...baseInput,
        input: {
          handReceiptId: "hand-receipt-1",
          nomenclature: "Compass",
        },
      }),
    ).rejects.toThrow("Provide an ECN, serial number, or generated ID.");
  });

  it("allocates permanent account-sequential generated IDs", async () => {
    const account = createAccount();
    const accountRepository = new InMemoryAccountRepository([account]);
    const itemRepository = new InMemoryItemRepository();

    const first = await createItem({
      account,
      actorId: account.userId,
      input: {
        handReceiptId: "hand-receipt-1",
        nomenclature: "Tripod",
        generateFieldLedgerId: true,
      },
      itemRepository,
      handReceiptRepository: createHandReceiptRepository(),
      locationRepository: new InMemoryLocationRepository(),
      accountRepository,
      auditRepository: new InMemoryAuditRepository(),
      createItemId: () => "item-1",
    });
    const second = await createItem({
      account,
      actorId: account.userId,
      input: {
        handReceiptId: "hand-receipt-1",
        nomenclature: "Tool kit",
        generateFieldLedgerId: true,
      },
      itemRepository,
      handReceiptRepository: createHandReceiptRepository(),
      locationRepository: new InMemoryLocationRepository(),
      accountRepository,
      auditRepository: new InMemoryAuditRepository(),
      createItemId: () => "item-2",
    });

    expect(first.item?.generatedId).toBe("FL-000001");
    expect(second.item?.generatedId).toBe("FL-000002");
  });

  it("returns a duplicate warning until ECN or serial duplicates are confirmed", async () => {
    const account = createAccount();
    const itemRepository = new InMemoryItemRepository([
      {
        id: "existing-item",
        accountId: account.id,
        handReceiptId: "hand-receipt-1",
        nomenclature: "Existing compass",
        ecn: "ECN-DUP",
        serialNumber: null,
        generatedId: null,
        notes: null,
        status: "active",
        createdAt: new Date("2026-04-29T12:00:00.000Z"),
        updatedAt: new Date("2026-04-29T12:00:00.000Z"),
      },
    ]);

    const warning = await createItem({
      account,
      actorId: account.userId,
      input: {
        handReceiptId: "hand-receipt-1",
        nomenclature: "Another compass",
        ecn: "ECN-DUP",
      },
      itemRepository,
      handReceiptRepository: createHandReceiptRepository(),
      locationRepository: new InMemoryLocationRepository(),
      accountRepository: new InMemoryAccountRepository([account]),
      auditRepository: new InMemoryAuditRepository(),
      createItemId: () => "item-2",
    });

    expect(warning).toMatchObject({
      duplicateWarning: {
        hasDuplicate: true,
        existingItems: [
          {
            id: "existing-item",
            nomenclature: "Existing compass",
          },
        ],
      },
    });
    expect(itemRepository.items).toHaveLength(1);

    const confirmed = await createItem({
      account,
      actorId: account.userId,
      input: {
        handReceiptId: "hand-receipt-1",
        nomenclature: "Another compass",
        ecn: "ECN-DUP",
        confirmDuplicate: true,
      },
      itemRepository,
      handReceiptRepository: createHandReceiptRepository(),
      locationRepository: new InMemoryLocationRepository(),
      accountRepository: new InMemoryAccountRepository([account]),
      auditRepository: new InMemoryAuditRepository(),
      createItemId: () => "item-2",
    });

    expect(confirmed.item).toMatchObject({
      id: "item-2",
      ecn: "ECN-DUP",
    });
  });

  it("blocks paused or read-only accounts", async () => {
    const account = createAccount({
      accessState: "paused_read_only",
      subscriptionTier: "pro",
    });

    await expect(
      createItem({
        account,
        actorId: account.userId,
        input: {
          handReceiptId: "hand-receipt-1",
          nomenclature: "Read-only item",
          ecn: "ECN-001",
        },
        itemRepository: new InMemoryItemRepository(),
        handReceiptRepository: createHandReceiptRepository(),
        locationRepository: new InMemoryLocationRepository(),
        accountRepository: new InMemoryAccountRepository([account]),
        auditRepository: new InMemoryAuditRepository(),
      }),
    ).rejects.toThrow("This account is read-only.");
  });

  it("formats generated IDs for human use", () => {
    expect(formatGeneratedId(42)).toBe("FL-000042");
  });
});
