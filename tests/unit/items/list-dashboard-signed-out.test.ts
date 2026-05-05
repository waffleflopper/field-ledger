import { describe, expect, it } from "vitest";

import { listDashboardSignedOut } from "@/modules/items";
import type { ItemRecord } from "@/modules/items";
import { InMemoryHandReceiptRepository } from "../../support/hand-receipt-repository";
import { InMemoryItemRepository } from "../../support/item-repository";

function item(overrides: Partial<ItemRecord> = {}): ItemRecord {
  return {
    id: "item-1",
    accountId: "account-1",
    handReceiptId: "hand-receipt-1",
    nomenclature: "M4 carbine",
    ecn: "ECN-001",
    serialNumber: null,
    generatedId: null,
    notes: null,
    status: "active",
    signedToContactId: null,
    signedToContactName: null,
    locationId: null,
    locationName: null,
    active2062Coverage: null,
    createdAt: new Date("2026-05-01T12:00:00.000Z"),
    updatedAt: new Date("2026-05-01T12:00:00.000Z"),
    ...overrides,
  };
}

function handReceiptRepository() {
  return new InMemoryHandReceiptRepository([
    {
      id: "hand-receipt-1",
      accountId: "account-1",
      name: "Primary receipt",
      notes: null,
      handReceiptNumber: null,
      holderName: null,
      unitName: null,
      uic: null,
      effectiveDate: null,
      status: "active",
      createdAt: new Date("2026-05-01T12:00:00.000Z"),
      updatedAt: new Date("2026-05-01T12:00:00.000Z"),
    },
  ]);
}

describe("listDashboardSignedOut", () => {
  it("categorizes manual and formal signed-out items for the dashboard", async () => {
    const itemRepository = new InMemoryItemRepository([
      item({
        id: "manual-item",
        nomenclature: "Manual radio",
        signedToContactId: "contact-1",
        signedToContactName: "SSG Miller",
      }),
      item({
        id: "covered-item",
        nomenclature: "2062 laptop",
        ecn: null,
        serialNumber: "SER-2062",
        active2062Coverage: {
          assignmentId: "assignment-1",
          contactId: "contact-2",
          contactName: "CPL Nguyen",
          documentId: "document-1",
          documentFilename: "da-2062.pdf",
        },
      }),
      item({
        id: "available-item",
        nomenclature: "Available optic",
      }),
    ]);

    await expect(
      listDashboardSignedOut({
        accountId: "account-1",
        handReceiptRepository: handReceiptRepository(),
        itemRepository,
      }),
    ).resolves.toEqual({
      manualItems: [
        expect.objectContaining({
          itemId: "manual-item",
          coverageType: "manual",
          handReceiptName: "Primary receipt",
          signedToName: "SSG Miller",
        }),
      ],
      coveredItems: [
        expect.objectContaining({
          itemId: "covered-item",
          coverageType: "da2062",
          documentFilename: "da-2062.pdf",
          identifier: "SER-2062",
          signedToName: "CPL Nguyen",
        }),
      ],
    });
  });

  it("treats formal 2062 coverage as primary when both assignment states exist", async () => {
    const itemRepository = new InMemoryItemRepository([
      item({
        id: "covered-over-manual",
        signedToContactId: "contact-1",
        signedToContactName: "Manual contact",
        active2062Coverage: {
          assignmentId: "assignment-1",
          contactId: "contact-2",
          contactName: "Formal contact",
          documentId: "document-1",
          documentFilename: "formal.pdf",
        },
      }),
    ]);

    await expect(
      listDashboardSignedOut({
        accountId: "account-1",
        handReceiptRepository: handReceiptRepository(),
        itemRepository,
      }),
    ).resolves.toMatchObject({
      manualItems: [],
      coveredItems: [
        {
          itemId: "covered-over-manual",
          coverageType: "da2062",
          signedToName: "Formal contact",
        },
      ],
    });
  });

  it("returns empty groups when no active items are signed out", async () => {
    await expect(
      listDashboardSignedOut({
        accountId: "account-1",
        handReceiptRepository: handReceiptRepository(),
        itemRepository: new InMemoryItemRepository([
          item(),
          item({
            id: "archived-manual",
            status: "archived",
            signedToContactId: "contact-1",
            signedToContactName: "SSG Miller",
          }),
        ]),
      }),
    ).resolves.toEqual({
      manualItems: [],
      coveredItems: [],
    });
  });
});
