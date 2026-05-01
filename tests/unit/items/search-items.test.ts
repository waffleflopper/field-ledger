import { describe, expect, it } from "vitest";

import { searchItems } from "@/modules/items";
import type { ItemRecord } from "@/modules/items";
import { InMemoryHandReceiptRepository } from "../../support/hand-receipt-repository";
import { InMemoryItemRepository } from "../../support/item-repository";

function createItem(overrides: Partial<ItemRecord> = {}): ItemRecord {
  return {
    id: "item-1",
    accountId: "account-1",
    handReceiptId: "receipt-1",
    nomenclature: "M4 carbine",
    ecn: "ECN-101",
    serialNumber: "SER-101",
    generatedId: "FL-000001",
    notes: null,
    status: "active",
    signedToContactId: null,
    signedToContactName: null,
    locationId: null,
    locationName: null,
    createdAt: new Date("2026-05-01T12:00:00.000Z"),
    updatedAt: new Date("2026-05-01T12:00:00.000Z"),
    ...overrides,
  };
}

function createHandReceiptRepository() {
  return new InMemoryHandReceiptRepository([
    {
      id: "receipt-1",
      accountId: "account-1",
      name: "HQ hand receipt",
      notes: null,
      handReceiptNumber: null,
      holderName: null,
      unitName: null,
      uic: null,
      effectiveDate: null,
      status: "active",
      createdAt: new Date("2026-05-01T11:00:00.000Z"),
      updatedAt: new Date("2026-05-01T11:00:00.000Z"),
    },
    {
      id: "receipt-2",
      accountId: "account-1",
      name: "Archived hand receipt",
      notes: null,
      handReceiptNumber: null,
      holderName: null,
      unitName: null,
      uic: null,
      effectiveDate: null,
      status: "archived",
      createdAt: new Date("2026-05-01T11:00:00.000Z"),
      updatedAt: new Date("2026-05-01T11:00:00.000Z"),
    },
  ]);
}

describe("searchItems", () => {
  it("returns matching active items with hand receipt context and matched fields", async () => {
    const itemRepository = new InMemoryItemRepository(
      [
        createItem({
          id: "item-by-ecn",
          ecn: "ECN-SEARCH",
          nomenclature: "Radio set",
        }),
        createItem({
          id: "item-by-contact",
          ecn: null,
          serialNumber: "SER-200",
          generatedId: "FL-000200",
          nomenclature: "Compass",
          signedToContactId: "contact-1",
          signedToContactName: "SSG Search",
        }),
        createItem({
          id: "item-by-location",
          ecn: null,
          serialNumber: "SER-300",
          generatedId: "FL-000300",
          nomenclature: "Tool kit",
          locationId: "location-1",
          locationName: "Search cage",
        }),
        createItem({
          id: "other-account",
          accountId: "account-2",
          ecn: "ECN-SEARCH",
        }),
      ],
      createHandReceiptRepository(),
    );

    await expect(
      searchItems({
        accountId: "account-1",
        query: "search",
        repository: itemRepository,
      }),
    ).resolves.toMatchObject([
      {
        item: {
          id: "item-by-location",
        },
        handReceipt: {
          id: "receipt-1",
          name: "HQ hand receipt",
        },
        location: {
          id: "location-1",
          name: "Search cage",
        },
        matchedFields: ["location"],
      },
      {
        item: {
          id: "item-by-contact",
        },
        contact: {
          id: "contact-1",
          displayName: "SSG Search",
        },
        matchedFields: ["contact"],
      },
      {
        item: {
          id: "item-by-ecn",
        },
        matchedFields: ["ecn"],
      },
    ]);

    await expect(
      searchItems({
        accountId: "account-1",
        query: "SER-200",
        repository: itemRepository,
      }),
    ).resolves.toMatchObject([
      {
        item: {
          id: "item-by-contact",
        },
        matchedFields: ["serialNumber"],
      },
    ]);

    await expect(
      searchItems({
        accountId: "account-1",
        query: "FL-000300",
        repository: itemRepository,
      }),
    ).resolves.toMatchObject([
      {
        item: {
          id: "item-by-location",
        },
        matchedFields: ["generatedId"],
      },
    ]);

    await expect(
      searchItems({
        accountId: "account-1",
        query: "compass",
        repository: itemRepository,
      }),
    ).resolves.toMatchObject([
      {
        item: {
          id: "item-by-contact",
        },
        matchedFields: ["nomenclature"],
      },
    ]);

    await expect(
      searchItems({
        accountId: "account-1",
        query: "HQ hand",
        repository: itemRepository,
      }),
    ).resolves.toHaveLength(3);
  });

  it("filters archived items and archived hand receipts by default", async () => {
    const itemRepository = new InMemoryItemRepository(
      [
        createItem({
          id: "active-match",
          nomenclature: "Search radio",
        }),
        createItem({
          id: "archived-item-match",
          nomenclature: "Search archived item",
          status: "archived",
        }),
        createItem({
          id: "archived-receipt-match",
          handReceiptId: "receipt-2",
          nomenclature: "Search archived receipt",
        }),
      ],
      createHandReceiptRepository(),
    );

    await expect(
      searchItems({
        accountId: "account-1",
        query: "search",
        repository: itemRepository,
      }),
    ).resolves.toMatchObject([
      {
        item: {
          id: "active-match",
        },
      },
    ]);

    await expect(
      searchItems({
        accountId: "account-1",
        includeArchived: true,
        query: "search",
        repository: itemRepository,
      }),
    ).resolves.toMatchObject([
      {
        item: {
          id: "archived-item-match",
        },
      },
      {
        item: {
          id: "active-match",
        },
      },
    ]);
  });

  it("returns no results for blank queries", async () => {
    const itemRepository = new InMemoryItemRepository([
      createItem({
        nomenclature: "Radio set",
      }),
    ]);

    await expect(
      searchItems({
        accountId: "account-1",
        query: "   ",
        repository: itemRepository,
      }),
    ).resolves.toEqual([]);
  });
});
