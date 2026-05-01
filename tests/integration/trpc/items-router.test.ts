import { TRPCError } from "@trpc/server";
import { describe, expect, it } from "vitest";

import type { AccountRecord } from "@/modules/accounts/application/ensure-account";
import { appRouter } from "@/server/trpc/router";
import { InMemoryAccountRepository } from "../../support/account-repository";
import { InMemoryAuditRepository } from "../../support/audit-repository";
import { createInMemoryAppUnitOfWork } from "../../support/app-unit-of-work";
import { InMemoryHandReceiptRepository } from "../../support/hand-receipt-repository";
import { InMemoryItemRepository } from "../../support/item-repository";

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
      id: "7db2eba2-c7d5-4ca6-a0d5-7c1e763c7082",
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
    {
      id: "14ad8e43-8ca5-484d-b10c-7cf436647040",
      accountId: "account-1",
      name: "Motor pool hand receipt",
      notes: null,
      handReceiptNumber: null,
      holderName: null,
      unitName: null,
      uic: null,
      effectiveDate: null,
      status: "active",
      createdAt: new Date("2026-04-30T13:00:00.000Z"),
      updatedAt: new Date("2026-04-30T13:00:00.000Z"),
    },
    {
      id: "ed871afb-990f-4370-8e7e-8b53c097091d",
      accountId: "account-2",
      name: "Other account hand receipt",
      notes: null,
      handReceiptNumber: null,
      holderName: null,
      unitName: null,
      uic: null,
      effectiveDate: null,
      status: "active",
      createdAt: new Date("2026-04-30T14:00:00.000Z"),
      updatedAt: new Date("2026-04-30T14:00:00.000Z"),
    },
  ]);
}

function createCaller({
  account = createAccount(),
  accountRepository = new InMemoryAccountRepository([account]),
  auditRepository = new InMemoryAuditRepository(),
  handReceiptRepository = createHandReceiptRepository(),
  itemRepository = new InMemoryItemRepository(),
}: {
  account?: AccountRecord;
  accountRepository?: InMemoryAccountRepository;
  auditRepository?: InMemoryAuditRepository;
  handReceiptRepository?: InMemoryHandReceiptRepository;
  itemRepository?: InMemoryItemRepository;
} = {}) {
  return appRouter.createCaller({
    session: {
      userId: account.userId,
      email: "owner@example.com",
    },
    account,
    accountRepository,
    auditRepository,
    handReceiptRepository,
    itemRepository,
    unitOfWork: createInMemoryAppUnitOfWork({
      accountRepository,
      auditRepository,
      handReceiptRepository,
      itemRepository,
    }),
  });
}

describe("itemsRouter", () => {
  it("creates an item inside a hand receipt and returns it from that receipt list", async () => {
    const itemRepository = new InMemoryItemRepository();
    const caller = createCaller({ itemRepository });

    const result = await caller.items.create({
      handReceiptId: "7db2eba2-c7d5-4ca6-a0d5-7c1e763c7082",
      nomenclature: "M4 carbine",
      ecn: "ECN-001",
      serialNumber: "SER-001",
    });

    expect(result.item).toMatchObject({
      handReceiptId: "7db2eba2-c7d5-4ca6-a0d5-7c1e763c7082",
      nomenclature: "M4 carbine",
      ecn: "ECN-001",
      serialNumber: "SER-001",
      status: "active",
    });
    await expect(
      caller.items.listByHandReceipt({
        handReceiptId: "7db2eba2-c7d5-4ca6-a0d5-7c1e763c7082",
      }),
    ).resolves.toMatchObject([
      {
        nomenclature: "M4 carbine",
      },
    ]);
  });

  it("returns duplicate warnings before confirmed creation", async () => {
    const itemRepository = new InMemoryItemRepository([
      {
        id: "existing-item",
        accountId: "account-1",
        handReceiptId: "7db2eba2-c7d5-4ca6-a0d5-7c1e763c7082",
        nomenclature: "Existing radio",
        ecn: null,
        serialNumber: "SER-DUP",
        generatedId: null,
        notes: null,
        status: "active",
        createdAt: new Date("2026-04-29T12:00:00.000Z"),
        updatedAt: new Date("2026-04-29T12:00:00.000Z"),
      },
    ]);
    const caller = createCaller({ itemRepository });

    const warning = await caller.items.create({
      handReceiptId: "7db2eba2-c7d5-4ca6-a0d5-7c1e763c7082",
      nomenclature: "Second radio",
      serialNumber: "SER-DUP",
    });

    expect(warning.duplicateWarning).toMatchObject({
      hasDuplicate: true,
      existingItems: [
        {
          id: "existing-item",
          nomenclature: "Existing radio",
        },
      ],
    });
    expect(itemRepository.items).toHaveLength(1);

    await expect(
      caller.items.create({
        handReceiptId: "7db2eba2-c7d5-4ca6-a0d5-7c1e763c7082",
        nomenclature: "Second radio",
        serialNumber: "SER-DUP",
        confirmDuplicate: true,
      }),
    ).resolves.toMatchObject({
      item: {
        serialNumber: "SER-DUP",
      },
    });
  });

  it("maps read-only item creation to FORBIDDEN", async () => {
    await expect(
      createCaller({
        account: createAccount({
          accessState: "paused_read_only",
          subscriptionTier: "pro",
        }),
      }).items.create({
        handReceiptId: "7db2eba2-c7d5-4ca6-a0d5-7c1e763c7082",
        nomenclature: "Blocked item",
        ecn: "ECN-001",
      }),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "This account is read-only.",
    });
  });

  it("validates identifier input through the typed procedure", async () => {
    await expect(
      createCaller().items.create({
        handReceiptId: "7db2eba2-c7d5-4ca6-a0d5-7c1e763c7082",
        nomenclature: "Compass",
      }),
    ).rejects.toBeInstanceOf(TRPCError);
  });

  it("gets and updates item details with audit history", async () => {
    const auditRepository = new InMemoryAuditRepository();
    const itemRepository = new InMemoryItemRepository([
      {
        id: "6f5f7e36-bb0a-47ec-8d2a-13f29d7ef94c",
        accountId: "account-1",
        handReceiptId: "7db2eba2-c7d5-4ca6-a0d5-7c1e763c7082",
        nomenclature: "Original radio",
        ecn: "ECN-001",
        serialNumber: null,
        generatedId: "FL-000001",
        notes: null,
        status: "active",
        createdAt: new Date("2026-04-29T12:00:00.000Z"),
        updatedAt: new Date("2026-04-29T12:00:00.000Z"),
      },
    ]);
    const caller = createCaller({ auditRepository, itemRepository });

    await expect(
      caller.items.getById({ id: "6f5f7e36-bb0a-47ec-8d2a-13f29d7ef94c" }),
    ).resolves.toMatchObject({
      nomenclature: "Original radio",
      generatedId: "FL-000001",
    });

    await expect(
      caller.items.update({
        id: "6f5f7e36-bb0a-47ec-8d2a-13f29d7ef94c",
        nomenclature: "Updated radio",
        ecn: "ECN-002",
        serialNumber: null,
        notes: "Shelf B",
      }),
    ).resolves.toMatchObject({
      item: {
        nomenclature: "Updated radio",
        ecn: "ECN-002",
        notes: "Shelf B",
      },
    });
    expect(auditRepository.events).toMatchObject([
      {
        action: "item.updated",
        targetType: "item",
        targetId: "6f5f7e36-bb0a-47ec-8d2a-13f29d7ef94c",
        metadata: {
          changedFields: ["nomenclature", "ecn", "notes"],
        },
      },
    ]);
  });

  it("archives, filters, and restores items through the typed router", async () => {
    const auditRepository = new InMemoryAuditRepository();
    const itemRepository = new InMemoryItemRepository([
      {
        id: "6f5f7e36-bb0a-47ec-8d2a-13f29d7ef94c",
        accountId: "account-1",
        handReceiptId: "7db2eba2-c7d5-4ca6-a0d5-7c1e763c7082",
        nomenclature: "Lifecycle radio",
        ecn: "ECN-301",
        serialNumber: null,
        generatedId: null,
        notes: null,
        status: "active",
        createdAt: new Date("2026-04-29T12:00:00.000Z"),
        updatedAt: new Date("2026-04-29T12:00:00.000Z"),
      },
    ]);
    const caller = createCaller({ auditRepository, itemRepository });

    await expect(
      caller.items.archive({ id: "6f5f7e36-bb0a-47ec-8d2a-13f29d7ef94c" }),
    ).resolves.toMatchObject({
      id: "6f5f7e36-bb0a-47ec-8d2a-13f29d7ef94c",
      status: "archived",
    });
    await expect(
      caller.items.listByHandReceipt({
        handReceiptId: "7db2eba2-c7d5-4ca6-a0d5-7c1e763c7082",
      }),
    ).resolves.toEqual([]);
    await expect(
      caller.items.listByHandReceipt({
        handReceiptId: "7db2eba2-c7d5-4ca6-a0d5-7c1e763c7082",
        status: "archived",
      }),
    ).resolves.toMatchObject([
      {
        nomenclature: "Lifecycle radio",
        status: "archived",
      },
    ]);

    await expect(
      caller.items.restore({ id: "6f5f7e36-bb0a-47ec-8d2a-13f29d7ef94c" }),
    ).resolves.toMatchObject({
      id: "6f5f7e36-bb0a-47ec-8d2a-13f29d7ef94c",
      status: "active",
    });
    await expect(
      caller.items.listByHandReceipt({
        handReceiptId: "7db2eba2-c7d5-4ca6-a0d5-7c1e763c7082",
      }),
    ).resolves.toMatchObject([
      {
        nomenclature: "Lifecycle radio",
        status: "active",
      },
    ]);
    expect(auditRepository.events).toMatchObject([
      {
        action: "item.archived",
        targetType: "item",
        targetId: "6f5f7e36-bb0a-47ec-8d2a-13f29d7ef94c",
      },
      {
        action: "item.restored",
        targetType: "item",
        targetId: "6f5f7e36-bb0a-47ec-8d2a-13f29d7ef94c",
      },
    ]);
  });

  it("moves an item between active hand receipts and records item activity", async () => {
    const auditRepository = new InMemoryAuditRepository();
    const itemRepository = new InMemoryItemRepository([
      {
        id: "6f5f7e36-bb0a-47ec-8d2a-13f29d7ef94c",
        accountId: "account-1",
        handReceiptId: "7db2eba2-c7d5-4ca6-a0d5-7c1e763c7082",
        nomenclature: "Move-ready radio",
        ecn: "ECN-501",
        serialNumber: "SER-501",
        generatedId: "FL-000501",
        notes: "Preserve these notes",
        status: "active",
        createdAt: new Date("2026-04-29T12:00:00.000Z"),
        updatedAt: new Date("2026-04-29T12:00:00.000Z"),
      },
    ]);
    const caller = createCaller({ auditRepository, itemRepository });

    await expect(
      caller.items.move({
        id: "6f5f7e36-bb0a-47ec-8d2a-13f29d7ef94c",
        targetHandReceiptId: "14ad8e43-8ca5-484d-b10c-7cf436647040",
      }),
    ).resolves.toMatchObject({
      id: "6f5f7e36-bb0a-47ec-8d2a-13f29d7ef94c",
      handReceiptId: "14ad8e43-8ca5-484d-b10c-7cf436647040",
      nomenclature: "Move-ready radio",
      ecn: "ECN-501",
      serialNumber: "SER-501",
      generatedId: "FL-000501",
      notes: "Preserve these notes",
    });
    await expect(
      caller.items.listByHandReceipt({
        handReceiptId: "7db2eba2-c7d5-4ca6-a0d5-7c1e763c7082",
      }),
    ).resolves.toEqual([]);
    await expect(
      caller.items.listByHandReceipt({
        handReceiptId: "14ad8e43-8ca5-484d-b10c-7cf436647040",
      }),
    ).resolves.toMatchObject([
      {
        id: "6f5f7e36-bb0a-47ec-8d2a-13f29d7ef94c",
        nomenclature: "Move-ready radio",
      },
    ]);
    expect(auditRepository.events).toMatchObject([
      {
        action: "item.moved",
        targetType: "item",
        targetId: "6f5f7e36-bb0a-47ec-8d2a-13f29d7ef94c",
        metadata: {
          fromHandReceiptId: "7db2eba2-c7d5-4ca6-a0d5-7c1e763c7082",
          toHandReceiptId: "14ad8e43-8ca5-484d-b10c-7cf436647040",
        },
      },
    ]);
  });

  it("rejects cross-account item moves as not found", async () => {
    const itemRepository = new InMemoryItemRepository([
      {
        id: "6f5f7e36-bb0a-47ec-8d2a-13f29d7ef94c",
        accountId: "account-1",
        handReceiptId: "7db2eba2-c7d5-4ca6-a0d5-7c1e763c7082",
        nomenclature: "Scoped radio",
        ecn: "ECN-601",
        serialNumber: null,
        generatedId: null,
        notes: null,
        status: "active",
        createdAt: new Date("2026-04-29T12:00:00.000Z"),
        updatedAt: new Date("2026-04-29T12:00:00.000Z"),
      },
    ]);

    await expect(
      createCaller({ itemRepository }).items.move({
        id: "6f5f7e36-bb0a-47ec-8d2a-13f29d7ef94c",
        targetHandReceiptId: "ed871afb-990f-4370-8e7e-8b53c097091d",
      }),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Item or target hand receipt was not found.",
    });
  });

  it("maps read-only archive, restore, and move attempts to FORBIDDEN", async () => {
    const itemRepository = new InMemoryItemRepository([
      {
        id: "6f5f7e36-bb0a-47ec-8d2a-13f29d7ef94c",
        accountId: "account-1",
        handReceiptId: "7db2eba2-c7d5-4ca6-a0d5-7c1e763c7082",
        nomenclature: "Blocked lifecycle radio",
        ecn: "ECN-401",
        serialNumber: null,
        generatedId: null,
        notes: null,
        status: "active",
        createdAt: new Date("2026-04-29T12:00:00.000Z"),
        updatedAt: new Date("2026-04-29T12:00:00.000Z"),
      },
      {
        id: "209de9cc-73cc-4f2c-99d8-0af00d94574c",
        accountId: "account-1",
        handReceiptId: "7db2eba2-c7d5-4ca6-a0d5-7c1e763c7082",
        nomenclature: "Blocked restore radio",
        ecn: "ECN-402",
        serialNumber: null,
        generatedId: null,
        notes: null,
        status: "archived",
        createdAt: new Date("2026-04-29T12:00:00.000Z"),
        updatedAt: new Date("2026-04-29T12:00:00.000Z"),
      },
    ]);
    const caller = createCaller({
      account: createAccount({
        accessState: "paused_read_only",
        subscriptionTier: "pro",
      }),
      itemRepository,
    });

    await expect(
      caller.items.archive({ id: "6f5f7e36-bb0a-47ec-8d2a-13f29d7ef94c" }),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "This account is read-only.",
    });
    await expect(
      caller.items.restore({ id: "209de9cc-73cc-4f2c-99d8-0af00d94574c" }),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "This account is read-only.",
    });
    await expect(
      caller.items.move({
        id: "6f5f7e36-bb0a-47ec-8d2a-13f29d7ef94c",
        targetHandReceiptId: "14ad8e43-8ca5-484d-b10c-7cf436647040",
      }),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "This account is read-only.",
    });
  });

  it("checks duplicate identifiers and maps read-only updates to FORBIDDEN", async () => {
    const itemRepository = new InMemoryItemRepository([
      {
        id: "6f5f7e36-bb0a-47ec-8d2a-13f29d7ef94c",
        accountId: "account-1",
        handReceiptId: "7db2eba2-c7d5-4ca6-a0d5-7c1e763c7082",
        nomenclature: "Original radio",
        ecn: "ECN-001",
        serialNumber: null,
        generatedId: "FL-000001",
        notes: null,
        status: "active",
        createdAt: new Date("2026-04-29T12:00:00.000Z"),
        updatedAt: new Date("2026-04-29T12:00:00.000Z"),
      },
      {
        id: "209de9cc-73cc-4f2c-99d8-0af00d94574c",
        accountId: "account-1",
        handReceiptId: "7db2eba2-c7d5-4ca6-a0d5-7c1e763c7082",
        nomenclature: "Existing duplicate",
        ecn: "ECN-DUP",
        serialNumber: null,
        generatedId: null,
        notes: null,
        status: "active",
        createdAt: new Date("2026-04-29T12:00:00.000Z"),
        updatedAt: new Date("2026-04-29T12:00:00.000Z"),
      },
    ]);

    await expect(
      createCaller({ itemRepository }).items.checkDuplicateIdentifier({
        itemId: "6f5f7e36-bb0a-47ec-8d2a-13f29d7ef94c",
        ecn: "ECN-DUP",
      }),
    ).resolves.toMatchObject({
      hasDuplicate: true,
      existingItems: [
        {
          id: "209de9cc-73cc-4f2c-99d8-0af00d94574c",
        },
      ],
    });

    await expect(
      createCaller({
        account: createAccount({
          accessState: "paused_read_only",
          subscriptionTier: "pro",
        }),
        itemRepository,
      }).items.update({
        id: "6f5f7e36-bb0a-47ec-8d2a-13f29d7ef94c",
        nomenclature: "Blocked update",
        ecn: "ECN-001",
        serialNumber: null,
        notes: null,
      }),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "This account is read-only.",
    });
  });
});
