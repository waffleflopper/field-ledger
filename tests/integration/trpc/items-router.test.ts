import { TRPCError } from "@trpc/server";
import { describe, expect, it, vi } from "vitest";

import type { AccountRecord } from "@/modules/accounts/application/ensure-account";
import type { AppUnitOfWork } from "@/modules/provider-boundaries/database/app-unit-of-work";
import { appRouter } from "@/server/trpc/router";
import { InMemoryAccountRepository } from "../../support/account-repository";
import { InMemoryAssignmentItemLinkRepository } from "../../support/assignment-item-link-repository";
import { InMemoryAssignmentRepository } from "../../support/assignment-repository";
import { InMemoryAuditRepository } from "../../support/audit-repository";
import { createInMemoryAppUnitOfWork } from "../../support/app-unit-of-work";
import { InMemoryContactRepository } from "../../support/contact-repository";
import { InMemoryHandReceiptRepository } from "../../support/hand-receipt-repository";
import { InMemoryItemRepository } from "../../support/item-repository";
import { InMemoryLocationRepository } from "../../support/location-repository";
import { createEmptyRequirementRepository } from "../../support/requirement-repository";

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
  assignmentItemLinkRepository = new InMemoryAssignmentItemLinkRepository(),
  assignmentRepository = new InMemoryAssignmentRepository(),
  auditRepository = new InMemoryAuditRepository(),
  contactRepository = new InMemoryContactRepository(),
  handReceiptRepository = createHandReceiptRepository(),
  itemRepository = new InMemoryItemRepository(),
  locationRepository = new InMemoryLocationRepository(),
  requirementRepository = createEmptyRequirementRepository(),
  unitOfWork,
}: {
  account?: AccountRecord;
  accountRepository?: InMemoryAccountRepository;
  assignmentItemLinkRepository?: InMemoryAssignmentItemLinkRepository;
  assignmentRepository?: InMemoryAssignmentRepository;
  auditRepository?: InMemoryAuditRepository;
  contactRepository?: InMemoryContactRepository;
  handReceiptRepository?: InMemoryHandReceiptRepository;
  itemRepository?: InMemoryItemRepository;
  locationRepository?: InMemoryLocationRepository;
  requirementRepository?: ReturnType<typeof createEmptyRequirementRepository>;
  unitOfWork?: AppUnitOfWork;
} = {}) {
  return appRouter.createCaller({
    session: {
      userId: account.userId,
      email: "owner@example.com",
    },
    account,
    accountRepository,
    assignmentItemLinkRepository,
    assignmentRepository,
    auditRepository,
    contactRepository,
    handReceiptRepository,
    itemRepository,
    locationRepository,
    requirementRepository,
    unitOfWork:
      unitOfWork ??
      createInMemoryAppUnitOfWork({
        accountRepository,
        assignmentItemLinkRepository,
        assignmentRepository,
        auditRepository,
        contactRepository,
        handReceiptRepository,
        itemRepository,
        locationRepository,
        requirementRepository,
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

  it("logs unexpected item creation failures without exposing backend messages", async () => {
    const backendError = new Error("raw postgres failure with credentials");
    const errorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const caller = createCaller({
      unitOfWork: {
        async run() {
          throw backendError;
        },
      },
    });

    try {
      await expect(
        caller.items.create({
          handReceiptId: "7db2eba2-c7d5-4ca6-a0d5-7c1e763c7082",
          nomenclature: "Blocked item",
          ecn: "ECN-001",
        }),
      ).rejects.toMatchObject({
        code: "INTERNAL_SERVER_ERROR",
        message: "Unable to update item.",
      });
      expect(errorSpy).toHaveBeenCalledWith(
        "Unexpected items tRPC error.",
        expect.objectContaining({
          accountId: "account-1",
          operation: "items.create",
          userId: "owner-1",
          error: backendError,
        }),
      );
    } finally {
      errorSpy.mockRestore();
    }
  });

  it("validates identifier input through the typed procedure", async () => {
    await expect(
      createCaller().items.create({
        handReceiptId: "7db2eba2-c7d5-4ca6-a0d5-7c1e763c7082",
        nomenclature: "Compass",
      }),
    ).rejects.toBeInstanceOf(TRPCError);
  });

  it("searches active items globally with context through the typed procedure", async () => {
    const handReceiptRepository = createHandReceiptRepository();
    const itemRepository = new InMemoryItemRepository(
      [
        {
          id: "6f5f7e36-bb0a-47ec-8d2a-13f29d7ef94c",
          accountId: "account-1",
          handReceiptId: "7db2eba2-c7d5-4ca6-a0d5-7c1e763c7082",
          nomenclature: "Night vision device",
          ecn: "ECN-NVG",
          serialNumber: "SER-NVG",
          generatedId: "FL-000111",
          notes: null,
          status: "active",
          signedToContactId: null,
          signedToContactName: null,
          locationId: "5e61a92a-ae42-4f8f-a6ef-ae50858a404a",
          locationName: "Arms room",
          createdAt: new Date("2026-05-01T11:00:00.000Z"),
          updatedAt: new Date("2026-05-01T11:00:00.000Z"),
        },
        {
          id: "f22b8a9f-2a61-474f-a970-11fa0e2d6204",
          accountId: "account-1",
          handReceiptId: "14ad8e43-8ca5-484d-b10c-7cf436647040",
          nomenclature: "Archived arms room radio",
          ecn: "ECN-OLD",
          serialNumber: null,
          generatedId: "FL-000112",
          notes: null,
          status: "archived",
          signedToContactId: null,
          signedToContactName: null,
          locationId: "5e61a92a-ae42-4f8f-a6ef-ae50858a404a",
          locationName: "Arms room",
          createdAt: new Date("2026-05-01T10:00:00.000Z"),
          updatedAt: new Date("2026-05-01T10:00:00.000Z"),
        },
      ],
      handReceiptRepository,
    );
    const caller = createCaller({ handReceiptRepository, itemRepository });

    await expect(
      caller.items.search({
        query: "arms",
      }),
    ).resolves.toMatchObject([
      {
        item: {
          id: "6f5f7e36-bb0a-47ec-8d2a-13f29d7ef94c",
        },
        handReceipt: {
          name: "HQ hand receipt",
        },
        location: {
          name: "Arms room",
        },
        matchedFields: ["location"],
      },
    ]);

    await expect(
      caller.items.search({
        query: "arms",
        includeArchived: true,
      }),
    ).resolves.toHaveLength(2);
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

  it("creates, changes, and clears item location through the typed router", async () => {
    const auditRepository = new InMemoryAuditRepository();
    const locationRepository = new InMemoryLocationRepository([
      {
        id: "5e61a92a-ae42-4f8f-a6ef-ae50858a404a",
        accountId: "account-1",
        name: "Arms room",
        createdAt: new Date("2026-05-01T12:00:00.000Z"),
        updatedAt: new Date("2026-05-01T12:00:00.000Z"),
      },
      {
        id: "95b41e31-bacc-48db-985f-ac03b7f8760f",
        accountId: "account-1",
        name: "Motor pool",
        createdAt: new Date("2026-05-01T12:00:00.000Z"),
        updatedAt: new Date("2026-05-01T12:00:00.000Z"),
      },
      {
        id: "7aa24bb9-5b46-4be3-a96c-62b927ad68cc",
        accountId: "account-2",
        name: "Other account location",
        createdAt: new Date("2026-05-01T12:00:00.000Z"),
        updatedAt: new Date("2026-05-01T12:00:00.000Z"),
      },
    ]);
    const itemRepository = new InMemoryItemRepository();
    const caller = createCaller({
      auditRepository,
      itemRepository,
      locationRepository,
    });

    const created = await caller.items.create({
      handReceiptId: "7db2eba2-c7d5-4ca6-a0d5-7c1e763c7082",
      nomenclature: "Location radio",
      ecn: "ECN-LOC",
      locationId: "5e61a92a-ae42-4f8f-a6ef-ae50858a404a",
    });

    expect(created.item).toMatchObject({
      locationId: "5e61a92a-ae42-4f8f-a6ef-ae50858a404a",
    });

    if (!created.item) {
      throw new Error("Expected item to be created.");
    }

    const itemId = created.item.id;
    await expect(
      caller.items.update({
        id: itemId,
        nomenclature: "Location radio",
        ecn: "ECN-LOC",
        serialNumber: null,
        notes: null,
        locationId: "95b41e31-bacc-48db-985f-ac03b7f8760f",
      }),
    ).resolves.toMatchObject({
      item: {
        locationId: "95b41e31-bacc-48db-985f-ac03b7f8760f",
      },
    });
    await expect(
      caller.items.update({
        id: itemId,
        nomenclature: "Location radio",
        ecn: "ECN-LOC",
        serialNumber: null,
        notes: null,
        locationId: null,
      }),
    ).resolves.toMatchObject({
      item: {
        locationId: null,
      },
    });
    await expect(
      caller.items.update({
        id: itemId,
        nomenclature: "Location radio",
        ecn: "ECN-LOC",
        serialNumber: null,
        notes: null,
        locationId: "7aa24bb9-5b46-4be3-a96c-62b927ad68cc",
      }),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Location was not found.",
    });
    expect(auditRepository.events.map((event) => event.action)).toEqual([
      "item.created",
      "item.updated",
      "item.location_changed",
      "item.updated",
      "item.location_changed",
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

  it("assigns signed-to state through existing and inline-created contacts", async () => {
    const auditRepository = new InMemoryAuditRepository();
    const contactRepository = new InMemoryContactRepository([
      {
        id: "2e6e25b2-7ffd-4fb5-82ac-d61a52b7f6a3",
        accountId: "account-1",
        displayName: "SSG Rivera",
        createdAt: new Date("2026-05-01T12:00:00.000Z"),
        updatedAt: new Date("2026-05-01T12:00:00.000Z"),
      },
    ]);
    const itemRepository = new InMemoryItemRepository([
      {
        id: "6f5f7e36-bb0a-47ec-8d2a-13f29d7ef94c",
        accountId: "account-1",
        handReceiptId: "7db2eba2-c7d5-4ca6-a0d5-7c1e763c7082",
        nomenclature: "Signed radio",
        ecn: "ECN-701",
        serialNumber: null,
        generatedId: null,
        notes: null,
        status: "active",
        createdAt: new Date("2026-04-29T12:00:00.000Z"),
        updatedAt: new Date("2026-04-29T12:00:00.000Z"),
      },
    ]);
    const caller = createCaller({
      auditRepository,
      contactRepository,
      itemRepository,
    });

    await expect(
      caller.items.assignSignedTo({
        id: "6f5f7e36-bb0a-47ec-8d2a-13f29d7ef94c",
        contactId: "2e6e25b2-7ffd-4fb5-82ac-d61a52b7f6a3",
      }),
    ).resolves.toMatchObject({
      signedToContactId: "2e6e25b2-7ffd-4fb5-82ac-d61a52b7f6a3",
      signedToContactName: "SSG Rivera",
    });
    await expect(
      caller.items.assignSignedToWithNewContact({
        id: "6f5f7e36-bb0a-47ec-8d2a-13f29d7ef94c",
        contactDisplayName: "CPL Nguyen",
      }),
    ).resolves.toMatchObject({
      signedToContactName: "CPL Nguyen",
    });
    await expect(
      caller.items.clearSignedTo({
        id: "6f5f7e36-bb0a-47ec-8d2a-13f29d7ef94c",
      }),
    ).resolves.toMatchObject({
      signedToContactId: null,
      signedToContactName: null,
    });
    expect(auditRepository.events.map((event) => event.action)).toEqual([
      "item.signed_to_assigned",
      "contact.created",
      "item.signed_to_assigned",
      "item.signed_to_cleared",
    ]);
  });

  it("blocks manual signed-to changes when active 2062 coverage exists", async () => {
    const auditRepository = new InMemoryAuditRepository();
    const assignmentItemLinkRepository =
      new InMemoryAssignmentItemLinkRepository([
        {
          id: "3dbd4b63-4d13-4e91-b27c-3f2211cd8494",
          accountId: "account-1",
          assignmentId: "26975a26-42c7-4307-b883-d676482f1545",
          itemId: "6f5f7e36-bb0a-47ec-8d2a-13f29d7ef94c",
          status: "active",
          closedAt: null,
          createdAt: new Date("2026-05-01T12:00:00.000Z"),
          updatedAt: new Date("2026-05-01T12:00:00.000Z"),
        },
      ]);
    const contactRepository = new InMemoryContactRepository([
      {
        id: "2e6e25b2-7ffd-4fb5-82ac-d61a52b7f6a3",
        accountId: "account-1",
        displayName: "SSG Rivera",
        createdAt: new Date("2026-05-01T12:00:00.000Z"),
        updatedAt: new Date("2026-05-01T12:00:00.000Z"),
      },
    ]);
    const itemRepository = new InMemoryItemRepository([
      {
        id: "6f5f7e36-bb0a-47ec-8d2a-13f29d7ef94c",
        accountId: "account-1",
        handReceiptId: "7db2eba2-c7d5-4ca6-a0d5-7c1e763c7082",
        nomenclature: "Covered radio",
        ecn: "ECN-702",
        serialNumber: null,
        generatedId: null,
        notes: null,
        status: "active",
        createdAt: new Date("2026-04-29T12:00:00.000Z"),
        updatedAt: new Date("2026-04-29T12:00:00.000Z"),
      },
    ]);
    const caller = createCaller({
      assignmentItemLinkRepository,
      auditRepository,
      contactRepository,
      itemRepository,
    });

    await expect(
      caller.items.assignSignedTo({
        id: "6f5f7e36-bb0a-47ec-8d2a-13f29d7ef94c",
        contactId: "2e6e25b2-7ffd-4fb5-82ac-d61a52b7f6a3",
      }),
    ).rejects.toMatchObject({
      code: "CONFLICT",
      message:
        "Cannot change manual signed-to state while active 2062 coverage exists.",
    });
    await expect(
      caller.items.assignSignedToWithNewContact({
        id: "6f5f7e36-bb0a-47ec-8d2a-13f29d7ef94c",
        contactDisplayName: "CPL Nguyen",
      }),
    ).rejects.toMatchObject({
      code: "CONFLICT",
      message:
        "Cannot change manual signed-to state while active 2062 coverage exists.",
    });
    expect(contactRepository.contacts).toHaveLength(1);
    expect(auditRepository.events).toEqual([]);
  });

  it("maps read-only manual signed-to changes to FORBIDDEN", async () => {
    const auditRepository = new InMemoryAuditRepository();
    const contactRepository = new InMemoryContactRepository([
      {
        id: "2e6e25b2-7ffd-4fb5-82ac-d61a52b7f6a3",
        accountId: "account-1",
        displayName: "SSG Rivera",
        createdAt: new Date("2026-05-01T12:00:00.000Z"),
        updatedAt: new Date("2026-05-01T12:00:00.000Z"),
      },
    ]);
    const itemRepository = new InMemoryItemRepository([
      {
        id: "6f5f7e36-bb0a-47ec-8d2a-13f29d7ef94c",
        accountId: "account-1",
        handReceiptId: "7db2eba2-c7d5-4ca6-a0d5-7c1e763c7082",
        nomenclature: "Read-only signed radio",
        ecn: "ECN-703",
        serialNumber: null,
        generatedId: null,
        notes: null,
        status: "active",
        signedToContactId: null,
        createdAt: new Date("2026-04-29T12:00:00.000Z"),
        updatedAt: new Date("2026-04-29T12:00:00.000Z"),
      },
    ]);
    const caller = createCaller({
      account: createAccount({
        accessState: "paused_read_only",
        subscriptionTier: "pro",
      }),
      auditRepository,
      contactRepository,
      itemRepository,
    });

    await expect(
      caller.items.assignSignedTo({
        id: "6f5f7e36-bb0a-47ec-8d2a-13f29d7ef94c",
        contactId: "2e6e25b2-7ffd-4fb5-82ac-d61a52b7f6a3",
      }),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "This account is read-only.",
    });
    await expect(
      caller.items.assignSignedToWithNewContact({
        id: "6f5f7e36-bb0a-47ec-8d2a-13f29d7ef94c",
        contactDisplayName: "CPL Nguyen",
      }),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "This account is read-only.",
    });
    await expect(
      caller.items.clearSignedTo({
        id: "6f5f7e36-bb0a-47ec-8d2a-13f29d7ef94c",
      }),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "This account is read-only.",
    });
    expect(contactRepository.contacts).toHaveLength(1);
    expect(itemRepository.items[0]).toMatchObject({
      signedToContactId: null,
    });
    expect(auditRepository.events).toEqual([]);
  });

  it("blocks moves with active 2062 coverage and exposes move preflight state", async () => {
    const assignmentItemLinkRepository =
      new InMemoryAssignmentItemLinkRepository([
        {
          id: "3dbd4b63-4d13-4e91-b27c-3f2211cd8494",
          accountId: "account-1",
          assignmentId: "26975a26-42c7-4307-b883-d676482f1545",
          itemId: "6f5f7e36-bb0a-47ec-8d2a-13f29d7ef94c",
          status: "active",
          closedAt: null,
          createdAt: new Date("2026-05-01T12:00:00.000Z"),
          updatedAt: new Date("2026-05-01T12:00:00.000Z"),
        },
      ]);
    const auditRepository = new InMemoryAuditRepository();
    const itemRepository = new InMemoryItemRepository([
      {
        id: "6f5f7e36-bb0a-47ec-8d2a-13f29d7ef94c",
        accountId: "account-1",
        handReceiptId: "7db2eba2-c7d5-4ca6-a0d5-7c1e763c7082",
        nomenclature: "Covered move radio",
        ecn: "ECN-703",
        serialNumber: null,
        generatedId: null,
        notes: null,
        status: "active",
        createdAt: new Date("2026-04-29T12:00:00.000Z"),
        updatedAt: new Date("2026-04-29T12:00:00.000Z"),
      },
    ]);
    const caller = createCaller({
      assignmentItemLinkRepository,
      auditRepository,
      itemRepository,
    });

    await expect(
      caller.items.hasActive2062Coverage({
        id: "6f5f7e36-bb0a-47ec-8d2a-13f29d7ef94c",
      }),
    ).resolves.toEqual({ hasActiveCoverage: true });
    await expect(
      caller.items.move({
        id: "6f5f7e36-bb0a-47ec-8d2a-13f29d7ef94c",
        targetHandReceiptId: "14ad8e43-8ca5-484d-b10c-7cf436647040",
      }),
    ).rejects.toMatchObject({
      code: "CONFLICT",
      message: "Cannot move item with active 2062 coverage.",
    });
    expect(itemRepository.items[0]?.handReceiptId).toBe(
      "7db2eba2-c7d5-4ca6-a0d5-7c1e763c7082",
    );
    expect(auditRepository.events).toEqual([]);
  });

  it("archives covered items by closing only that active 2062 link", async () => {
    const auditRepository = new InMemoryAuditRepository();
    const assignmentRepository = new InMemoryAssignmentRepository([
      {
        id: "26975a26-42c7-4307-b883-d676482f1545",
        accountId: "account-1",
        handReceiptId: "7db2eba2-c7d5-4ca6-a0d5-7c1e763c7082",
        contactId: "2e6e25b2-7ffd-4fb5-82ac-d61a52b7f6a3",
        contactName: "SSG Rivera",
        documentId: "86f8e191-bb5c-48ca-9868-4f2b8e0480ea",
        documentFilename: "signed-2062.pdf",
        status: "active",
        createdAt: new Date("2026-05-01T12:00:00.000Z"),
        updatedAt: new Date("2026-05-01T12:00:00.000Z"),
      },
    ]);
    const assignmentItemLinkRepository =
      new InMemoryAssignmentItemLinkRepository([
        {
          id: "3dbd4b63-4d13-4e91-b27c-3f2211cd8494",
          accountId: "account-1",
          assignmentId: "26975a26-42c7-4307-b883-d676482f1545",
          itemId: "6f5f7e36-bb0a-47ec-8d2a-13f29d7ef94c",
          status: "active",
          closedAt: null,
          createdAt: new Date("2026-05-01T12:00:00.000Z"),
          updatedAt: new Date("2026-05-01T12:00:00.000Z"),
        },
        {
          id: "941cbef0-b703-4327-8440-2ad719dcb098",
          accountId: "account-1",
          assignmentId: "26975a26-42c7-4307-b883-d676482f1545",
          itemId: "53cc548f-1493-406b-ae47-7037dd1ca610",
          status: "active",
          closedAt: null,
          createdAt: new Date("2026-05-01T12:00:00.000Z"),
          updatedAt: new Date("2026-05-01T12:00:00.000Z"),
        },
      ]);
    const itemRepository = new InMemoryItemRepository([
      {
        id: "6f5f7e36-bb0a-47ec-8d2a-13f29d7ef94c",
        accountId: "account-1",
        handReceiptId: "7db2eba2-c7d5-4ca6-a0d5-7c1e763c7082",
        nomenclature: "Covered radio",
        ecn: "ECN-704",
        serialNumber: null,
        generatedId: null,
        notes: null,
        status: "active",
        signedToContactId: "2e6e25b2-7ffd-4fb5-82ac-d61a52b7f6a3",
        createdAt: new Date("2026-04-29T12:00:00.000Z"),
        updatedAt: new Date("2026-04-29T12:00:00.000Z"),
      },
      {
        id: "53cc548f-1493-406b-ae47-7037dd1ca610",
        accountId: "account-1",
        handReceiptId: "7db2eba2-c7d5-4ca6-a0d5-7c1e763c7082",
        nomenclature: "Still covered radio",
        ecn: "ECN-705",
        serialNumber: null,
        generatedId: null,
        notes: null,
        status: "active",
        signedToContactId: "2e6e25b2-7ffd-4fb5-82ac-d61a52b7f6a3",
        createdAt: new Date("2026-04-29T12:00:00.000Z"),
        updatedAt: new Date("2026-04-29T12:00:00.000Z"),
      },
    ]);
    const caller = createCaller({
      assignmentItemLinkRepository,
      assignmentRepository,
      auditRepository,
      itemRepository,
    });

    await expect(
      caller.items.getActive2062CoverageInfo({
        id: "6f5f7e36-bb0a-47ec-8d2a-13f29d7ef94c",
      }),
    ).resolves.toEqual({
      hasActiveCoverage: true,
      assignmentId: "26975a26-42c7-4307-b883-d676482f1545",
      isLastActiveLink: false,
    });
    await expect(
      caller.items.archive({ id: "6f5f7e36-bb0a-47ec-8d2a-13f29d7ef94c" }),
    ).resolves.toMatchObject({
      id: "6f5f7e36-bb0a-47ec-8d2a-13f29d7ef94c",
      status: "archived",
      signedToContactId: null,
    });

    expect(assignmentRepository.assignments[0]).toMatchObject({
      status: "active",
      documentId: "86f8e191-bb5c-48ca-9868-4f2b8e0480ea",
    });
    expect(assignmentItemLinkRepository.links).toMatchObject([
      {
        id: "3dbd4b63-4d13-4e91-b27c-3f2211cd8494",
        status: "closed",
      },
      {
        id: "941cbef0-b703-4327-8440-2ad719dcb098",
        status: "active",
      },
    ]);
    expect(itemRepository.items[1]).toMatchObject({
      id: "53cc548f-1493-406b-ae47-7037dd1ca610",
      status: "active",
      signedToContactId: "2e6e25b2-7ffd-4fb5-82ac-d61a52b7f6a3",
    });
    expect(auditRepository.events.map((event) => event.action)).toEqual([
      "item.archived",
      "assignment_item_link.removed",
    ]);
    expect(auditRepository.events[1]?.metadata).toMatchObject({
      reason: "item_archived",
      documentId: "86f8e191-bb5c-48ca-9868-4f2b8e0480ea",
      documentFilename: "signed-2062.pdf",
    });
  });

  it("closes the 2062 assignment when archived item was the final active link", async () => {
    const auditRepository = new InMemoryAuditRepository();
    const assignmentRepository = new InMemoryAssignmentRepository([
      {
        id: "26975a26-42c7-4307-b883-d676482f1545",
        accountId: "account-1",
        handReceiptId: "7db2eba2-c7d5-4ca6-a0d5-7c1e763c7082",
        contactId: "2e6e25b2-7ffd-4fb5-82ac-d61a52b7f6a3",
        contactName: "SSG Rivera",
        documentId: "86f8e191-bb5c-48ca-9868-4f2b8e0480ea",
        documentFilename: "signed-2062.pdf",
        status: "active",
        createdAt: new Date("2026-05-01T12:00:00.000Z"),
        updatedAt: new Date("2026-05-01T12:00:00.000Z"),
      },
    ]);
    const assignmentItemLinkRepository =
      new InMemoryAssignmentItemLinkRepository([
        {
          id: "3dbd4b63-4d13-4e91-b27c-3f2211cd8494",
          accountId: "account-1",
          assignmentId: "26975a26-42c7-4307-b883-d676482f1545",
          itemId: "6f5f7e36-bb0a-47ec-8d2a-13f29d7ef94c",
          status: "active",
          closedAt: null,
          createdAt: new Date("2026-05-01T12:00:00.000Z"),
          updatedAt: new Date("2026-05-01T12:00:00.000Z"),
        },
      ]);
    const itemRepository = new InMemoryItemRepository([
      {
        id: "6f5f7e36-bb0a-47ec-8d2a-13f29d7ef94c",
        accountId: "account-1",
        handReceiptId: "7db2eba2-c7d5-4ca6-a0d5-7c1e763c7082",
        nomenclature: "Final covered radio",
        ecn: "ECN-706",
        serialNumber: null,
        generatedId: null,
        notes: null,
        status: "active",
        signedToContactId: "2e6e25b2-7ffd-4fb5-82ac-d61a52b7f6a3",
        createdAt: new Date("2026-04-29T12:00:00.000Z"),
        updatedAt: new Date("2026-04-29T12:00:00.000Z"),
      },
    ]);
    const caller = createCaller({
      assignmentItemLinkRepository,
      assignmentRepository,
      auditRepository,
      itemRepository,
    });

    await expect(
      caller.items.getActive2062CoverageInfo({
        id: "6f5f7e36-bb0a-47ec-8d2a-13f29d7ef94c",
      }),
    ).resolves.toEqual({
      hasActiveCoverage: true,
      assignmentId: "26975a26-42c7-4307-b883-d676482f1545",
      isLastActiveLink: true,
    });
    await expect(
      caller.items.archive({ id: "6f5f7e36-bb0a-47ec-8d2a-13f29d7ef94c" }),
    ).resolves.toMatchObject({
      status: "archived",
      signedToContactId: null,
    });

    expect(assignmentRepository.assignments[0]?.status).toBe("closed");
    expect(auditRepository.events.map((event) => event.action)).toEqual([
      "item.archived",
      "assignment_item_link.removed",
      "assignment.closed",
    ]);
    expect(auditRepository.events[2]?.metadata).toMatchObject({
      reason: "last_item_archived",
      documentId: "86f8e191-bb5c-48ca-9868-4f2b8e0480ea",
    });
  });

  it("maps covered item archive link closure races to conflict", async () => {
    const auditRepository = new InMemoryAuditRepository();
    const assignmentRepository = new InMemoryAssignmentRepository([
      {
        id: "26975a26-42c7-4307-b883-d676482f1545",
        accountId: "account-1",
        handReceiptId: "7db2eba2-c7d5-4ca6-a0d5-7c1e763c7082",
        contactId: "2e6e25b2-7ffd-4fb5-82ac-d61a52b7f6a3",
        contactName: "SSG Rivera",
        documentId: "86f8e191-bb5c-48ca-9868-4f2b8e0480ea",
        documentFilename: "signed-2062.pdf",
        status: "active",
        createdAt: new Date("2026-05-01T12:00:00.000Z"),
        updatedAt: new Date("2026-05-01T12:00:00.000Z"),
      },
    ]);
    const assignmentItemLinkRepository =
      new InMemoryAssignmentItemLinkRepository([
        {
          id: "3dbd4b63-4d13-4e91-b27c-3f2211cd8494",
          accountId: "account-1",
          assignmentId: "26975a26-42c7-4307-b883-d676482f1545",
          itemId: "6f5f7e36-bb0a-47ec-8d2a-13f29d7ef94c",
          status: "active",
          closedAt: null,
          createdAt: new Date("2026-05-01T12:00:00.000Z"),
          updatedAt: new Date("2026-05-01T12:00:00.000Z"),
        },
      ]);
    const itemRepository = new InMemoryItemRepository([
      {
        id: "6f5f7e36-bb0a-47ec-8d2a-13f29d7ef94c",
        accountId: "account-1",
        handReceiptId: "7db2eba2-c7d5-4ca6-a0d5-7c1e763c7082",
        nomenclature: "Race covered radio",
        ecn: "ECN-707",
        serialNumber: null,
        generatedId: null,
        notes: null,
        status: "active",
        signedToContactId: "2e6e25b2-7ffd-4fb5-82ac-d61a52b7f6a3",
        createdAt: new Date("2026-04-29T12:00:00.000Z"),
        updatedAt: new Date("2026-04-29T12:00:00.000Z"),
      },
    ]);
    const originalFindById = assignmentItemLinkRepository.findById.bind(
      assignmentItemLinkRepository,
    );
    assignmentItemLinkRepository.findById = async (...args) => {
      const link = await originalFindById(...args);

      if (!link) {
        return null;
      }

      return {
        ...link,
        status: "closed",
        closedAt: new Date("2026-05-02T12:00:00.000Z"),
      };
    };
    const caller = createCaller({
      assignmentItemLinkRepository,
      assignmentRepository,
      auditRepository,
      itemRepository,
    });

    await expect(
      caller.items.archive({ id: "6f5f7e36-bb0a-47ec-8d2a-13f29d7ef94c" }),
    ).rejects.toMatchObject({
      code: "CONFLICT",
      message: "Item link is already closed.",
    });
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
