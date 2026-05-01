import { describe, expect, it } from "vitest";

import type { AccountRecord } from "@/modules/accounts/application/ensure-account";
import { updateItem, validateItemIdentifiers } from "@/modules/items";
import { InMemoryAuditRepository } from "../../support/audit-repository";
import { InMemoryItemRepository } from "../../support/item-repository";
import { InMemoryLocationRepository } from "../../support/location-repository";

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
      id: "item-1",
      accountId: "account-1",
      handReceiptId: "hand-receipt-1",
      nomenclature: "Original radio",
      ecn: "ECN-001",
      serialNumber: null,
      generatedId: "FL-000001",
      notes: "Shelf A",
      status: "active",
      createdAt: new Date("2026-04-30T12:00:00.000Z"),
      updatedAt: new Date("2026-04-30T12:00:00.000Z"),
    },
  ]);
}

describe("validateItemIdentifiers", () => {
  it("requires at least one ECN, serial number, or generated ID", () => {
    expect(
      validateItemIdentifiers({
        ecn: null,
        serialNumber: null,
        generatedId: null,
      }),
    ).toEqual({
      ok: false,
      reason: "missing_identifier",
      message: "Provide an ECN, serial number, or generated ID.",
    });

    expect(
      validateItemIdentifiers({
        ecn: "  ",
        serialNumber: null,
        generatedId: "FL-000001",
      }),
    ).toEqual({ ok: true });
  });
});

describe("updateItem", () => {
  it("updates editable fields and records changed fields in audit history", async () => {
    const account = createAccount();
    const itemRepository = createRepository();
    const auditRepository = new InMemoryAuditRepository();

    const result = await updateItem({
      account,
      actorId: account.userId,
      itemId: "item-1",
      input: {
        nomenclature: "Updated radio",
        ecn: "ECN-002",
        serialNumber: "SER-002",
        notes: "Shelf B",
      },
      itemRepository,
      locationRepository: new InMemoryLocationRepository(),
      auditRepository,
      now: new Date("2026-04-30T13:00:00.000Z"),
    });

    expect(result).toMatchObject({
      item: {
        id: "item-1",
        nomenclature: "Updated radio",
        ecn: "ECN-002",
        serialNumber: "SER-002",
        generatedId: "FL-000001",
        notes: "Shelf B",
      },
    });
    expect(auditRepository.events).toMatchObject([
      {
        action: "item.updated",
        targetType: "item",
        targetId: "item-1",
        metadata: {
          changedFields: ["nomenclature", "ecn", "serialNumber", "notes"],
        },
      },
    ]);
  });

  it("changes and clears item location with audit history", async () => {
    const account = createAccount();
    const itemRepository = new InMemoryItemRepository([
      {
        ...createRepository().items[0]!,
        locationId: "location-1",
        locationName: "Arms room",
      },
    ]);
    const locationRepository = new InMemoryLocationRepository([
      {
        id: "location-2",
        accountId: "account-1",
        name: "Motor pool",
        createdAt: new Date("2026-05-01T12:00:00.000Z"),
        updatedAt: new Date("2026-05-01T12:00:00.000Z"),
      },
      {
        id: "location-3",
        accountId: "account-2",
        name: "Other account location",
        createdAt: new Date("2026-05-01T12:00:00.000Z"),
        updatedAt: new Date("2026-05-01T12:00:00.000Z"),
      },
    ]);
    const auditRepository = new InMemoryAuditRepository();

    const changed = await updateItem({
      account,
      actorId: account.userId,
      itemId: "item-1",
      input: {
        nomenclature: "Original radio",
        ecn: "ECN-001",
        serialNumber: null,
        notes: "Shelf A",
        locationId: "location-2",
      },
      itemRepository,
      locationRepository,
      auditRepository,
      now: new Date("2026-05-01T13:00:00.000Z"),
    });

    expect(changed).toMatchObject({
      item: {
        id: "item-1",
        locationId: "location-2",
      },
    });
    expect(auditRepository.events).toMatchObject([
      {
        action: "item.updated",
        metadata: {
          changedFields: ["locationId"],
        },
      },
      {
        action: "item.location_changed",
        metadata: {
          previousLocationId: "location-1",
          previousLocationName: "Arms room",
          newLocationId: "location-2",
        },
      },
    ]);

    const cleared = await updateItem({
      account,
      actorId: account.userId,
      itemId: "item-1",
      input: {
        nomenclature: "Original radio",
        ecn: "ECN-001",
        serialNumber: null,
        notes: "Shelf A",
        locationId: null,
      },
      itemRepository,
      locationRepository,
      auditRepository,
    });

    expect(cleared.item).toMatchObject({
      id: "item-1",
      locationId: null,
    });

    await expect(
      updateItem({
        account,
        actorId: account.userId,
        itemId: "item-1",
        input: {
          locationId: "location-3",
        },
        itemRepository,
        locationRepository,
        auditRepository,
      }),
    ).rejects.toThrow("Location was not found.");
  });

  it("treats a blank location update as clearing the item location", async () => {
    const account = createAccount();
    const itemRepository = new InMemoryItemRepository([
      {
        ...createRepository().items[0]!,
        locationId: "location-1",
        locationName: "Arms room",
      },
    ]);

    await expect(
      updateItem({
        account,
        actorId: account.userId,
        itemId: "item-1",
        input: {
          locationId: "   ",
        },
        itemRepository,
        locationRepository: new InMemoryLocationRepository(),
        auditRepository: new InMemoryAuditRepository(),
      }),
    ).resolves.toMatchObject({
      item: {
        id: "item-1",
        locationId: null,
      },
    });
  });

  it("returns the existing item without audit history when nothing changed", async () => {
    const account = createAccount();
    const itemRepository = createRepository();
    const auditRepository = new InMemoryAuditRepository();

    const result = await updateItem({
      account,
      actorId: account.userId,
      itemId: "item-1",
      input: {
        nomenclature: "Original radio",
        ecn: "ECN-001",
        serialNumber: null,
        notes: "Shelf A",
      },
      itemRepository,
      locationRepository: new InMemoryLocationRepository(),
      auditRepository,
      now: new Date("2026-04-30T13:00:00.000Z"),
    });

    expect(result.item).toMatchObject({
      id: "item-1",
      updatedAt: new Date("2026-04-30T12:00:00.000Z"),
    });
    expect(auditRepository.events).toEqual([]);
  });

  it("rejects empty nomenclature or missing identifiers", async () => {
    const account = createAccount();
    const baseInput = {
      account,
      actorId: account.userId,
      itemId: "item-1",
      itemRepository: createRepository(),
      locationRepository: new InMemoryLocationRepository(),
      auditRepository: new InMemoryAuditRepository(),
    };

    await expect(
      updateItem({
        ...baseInput,
        input: {
          nomenclature: "   ",
        },
      }),
    ).rejects.toThrow("Item nomenclature is required.");

    await expect(
      updateItem({
        ...baseInput,
        itemRepository: new InMemoryItemRepository([
          {
            ...createRepository().items[0]!,
            generatedId: null,
          },
        ]),
        input: {
          nomenclature: "Compass",
          ecn: null,
          serialNumber: null,
        },
      }),
    ).rejects.toThrow("Provide an ECN, serial number, or generated ID.");
  });

  it("returns a duplicate warning before confirmed identifier updates", async () => {
    const account = createAccount();
    const itemRepository = new InMemoryItemRepository([
      ...createRepository().items,
      {
        id: "item-2",
        accountId: "account-1",
        handReceiptId: "hand-receipt-1",
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
    const auditRepository = new InMemoryAuditRepository();

    const warning = await updateItem({
      account,
      actorId: account.userId,
      itemId: "item-1",
      input: {
        nomenclature: "Original radio",
        ecn: "ECN-DUP",
        serialNumber: null,
        notes: "Shelf A",
      },
      itemRepository,
      locationRepository: new InMemoryLocationRepository(),
      auditRepository,
    });

    expect(warning).toMatchObject({
      duplicateWarning: {
        hasDuplicate: true,
        existingItems: [
          {
            id: "item-2",
            nomenclature: "Existing duplicate",
          },
        ],
      },
    });
    expect(auditRepository.events).toEqual([]);

    await expect(
      updateItem({
        account,
        actorId: account.userId,
        itemId: "item-1",
        input: {
          nomenclature: "Original radio",
          ecn: "ECN-DUP",
          serialNumber: null,
          notes: "Shelf A",
          confirmDuplicate: true,
        },
        itemRepository,
        locationRepository: new InMemoryLocationRepository(),
        auditRepository,
      }),
    ).resolves.toMatchObject({
      item: {
        id: "item-1",
        ecn: "ECN-DUP",
      },
    });
  });

  it("normalizes identifiers before duplicate checks", async () => {
    const account = createAccount();
    const itemRepository = new InMemoryItemRepository([
      ...createRepository().items,
      {
        id: "item-2",
        accountId: "account-1",
        handReceiptId: "hand-receipt-1",
        nomenclature: "Existing duplicate",
        ecn: null,
        serialNumber: "SER-DUP",
        generatedId: null,
        notes: null,
        status: "active",
        createdAt: new Date("2026-04-29T12:00:00.000Z"),
        updatedAt: new Date("2026-04-29T12:00:00.000Z"),
      },
    ]);

    await expect(
      updateItem({
        account,
        actorId: account.userId,
        itemId: "item-1",
        input: {
          serialNumber: " SER-DUP ",
        },
        itemRepository,
        locationRepository: new InMemoryLocationRepository(),
        auditRepository: new InMemoryAuditRepository(),
      }),
    ).resolves.toMatchObject({
      duplicateWarning: {
        hasDuplicate: true,
        existingItems: [
          {
            id: "item-2",
          },
        ],
      },
    });
  });

  it("blocks paused or read-only accounts", async () => {
    await expect(
      updateItem({
        account: createAccount({
          accessState: "paused_read_only",
          subscriptionTier: "pro",
        }),
        actorId: "owner-1",
        itemId: "item-1",
        input: {
          nomenclature: "Blocked update",
        },
        itemRepository: createRepository(),
        locationRepository: new InMemoryLocationRepository(),
        auditRepository: new InMemoryAuditRepository(),
      }),
    ).rejects.toThrow("This account is read-only.");
  });
});
