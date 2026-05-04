import { TRPCError } from "@trpc/server";
import { describe, expect, it } from "vitest";

import type { AccountRecord } from "@/modules/accounts/application/ensure-account";
import { appRouter } from "@/server/trpc/router";
import { createEmptyAccountRepository } from "../../support/account-repository";
import { InMemoryAuditRepository } from "../../support/audit-repository";
import { createInMemoryAppUnitOfWork } from "../../support/app-unit-of-work";
import { createEmptyContactRepository } from "../../support/contact-repository";
import { InMemoryHandReceiptRepository } from "../../support/hand-receipt-repository";
import { createEmptyItemRepository } from "../../support/item-repository";
import { createEmptyLocationRepository } from "../../support/location-repository";
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

function createCaller({
  account = createAccount(),
  handReceiptRepository = new InMemoryHandReceiptRepository(),
  auditRepository = new InMemoryAuditRepository(),
}: {
  account?: AccountRecord;
  handReceiptRepository?: InMemoryHandReceiptRepository;
  auditRepository?: InMemoryAuditRepository;
} = {}) {
  const itemRepository = createEmptyItemRepository();
  const contactRepository = createEmptyContactRepository();
  const locationRepository = createEmptyLocationRepository();
  const requirementRepository = createEmptyRequirementRepository();
  return appRouter.createCaller({
    session: {
      userId: account.userId,
      email: "owner@example.com",
    },
    account,
    accountRepository: createEmptyAccountRepository(),
    auditRepository,
    contactRepository,
    handReceiptRepository,
    itemRepository,
    locationRepository,
    requirementRepository,
    unitOfWork: createInMemoryAppUnitOfWork({
      auditRepository,
      contactRepository,
      handReceiptRepository,
      itemRepository,
      locationRepository,
      requirementRepository,
    }),
  });
}

describe("handReceiptsRouter", () => {
  it("creates a hand receipt and returns it from the active list", async () => {
    const repository = new InMemoryHandReceiptRepository();
    const caller = createCaller({ handReceiptRepository: repository });

    const created = await caller.handReceipts.create({
      name: "HQ hand receipt",
      notes: "Primary field set.",
    });

    expect(created).toMatchObject({
      accountId: "account-1",
      name: "HQ hand receipt",
      notes: "Primary field set.",
      status: "active",
    });
    await expect(caller.handReceipts.list()).resolves.toMatchObject([
      {
        id: created.id,
        name: "HQ hand receipt",
      },
    ]);
  });

  it("returns an empty list when there are no active hand receipts", async () => {
    await expect(createCaller().handReceipts.list()).resolves.toEqual([]);
  });

  it("keeps archived hand receipts out of the default list and exposes a deliberate archived view", async () => {
    const repository = new InMemoryHandReceiptRepository([
      {
        id: "6dc73e86-07f4-4a84-9031-eed996710fe7",
        accountId: "account-1",
        name: "Active receipt",
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
        id: "144823dd-a4a8-4854-8c4b-e271ba8723c3",
        accountId: "account-1",
        name: "Archived receipt",
        notes: null,
        handReceiptNumber: null,
        holderName: null,
        unitName: null,
        uic: null,
        effectiveDate: null,
        status: "archived",
        createdAt: new Date("2026-04-29T12:00:00.000Z"),
        updatedAt: new Date("2026-04-29T12:00:00.000Z"),
      },
    ]);
    const caller = createCaller({ handReceiptRepository: repository });

    await expect(caller.handReceipts.list()).resolves.toMatchObject([
      {
        id: "6dc73e86-07f4-4a84-9031-eed996710fe7",
      },
    ]);
    await expect(
      caller.handReceipts.list({ status: "archived" }),
    ).resolves.toMatchObject([
      {
        id: "144823dd-a4a8-4854-8c4b-e271ba8723c3",
      },
    ]);
    await expect(caller.handReceipts.listArchived()).resolves.toMatchObject([
      {
        id: "144823dd-a4a8-4854-8c4b-e271ba8723c3",
      },
    ]);
  });

  it("validates required names through the typed procedure", async () => {
    await expect(
      createCaller().handReceipts.create({
        name: "",
      }),
    ).rejects.toBeInstanceOf(TRPCError);
  });

  it("rolls back hand receipt creation when audit recording fails in the unit of work", async () => {
    const repository = new InMemoryHandReceiptRepository();
    const auditRepository = new InMemoryAuditRepository();
    auditRepository.failRecording = true;

    await expect(
      createCaller({
        auditRepository,
        handReceiptRepository: repository,
      }).handReceipts.create({
        name: "Unaudited receipt",
      }),
    ).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
      message: "Audit event was not recorded.",
    });
    expect(repository.handReceipts).toEqual([]);
    expect(auditRepository.events).toEqual([]);
  });

  it("enforces capability limits through the typed procedure", async () => {
    const repository = new InMemoryHandReceiptRepository([
      {
        id: "active-1",
        accountId: "account-1",
        name: "Alpha",
        notes: null,
        handReceiptNumber: null,
        holderName: null,
        unitName: null,
        uic: null,
        effectiveDate: null,
        status: "active",
        createdAt: new Date("2026-04-01T12:00:00.000Z"),
        updatedAt: new Date("2026-04-01T12:00:00.000Z"),
      },
      {
        id: "active-2",
        accountId: "account-1",
        name: "Bravo",
        notes: null,
        handReceiptNumber: null,
        holderName: null,
        unitName: null,
        uic: null,
        effectiveDate: null,
        status: "active",
        createdAt: new Date("2026-04-02T12:00:00.000Z"),
        updatedAt: new Date("2026-04-02T12:00:00.000Z"),
      },
      {
        id: "active-3",
        accountId: "account-1",
        name: "Charlie",
        notes: null,
        handReceiptNumber: null,
        holderName: null,
        unitName: null,
        uic: null,
        effectiveDate: null,
        status: "active",
        createdAt: new Date("2026-04-03T12:00:00.000Z"),
        updatedAt: new Date("2026-04-03T12:00:00.000Z"),
      },
    ]);

    await expect(
      createCaller({ handReceiptRepository: repository }).handReceipts.create({
        name: "Delta",
      }),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "Active hand receipt limit reached.",
    });
  });

  it("maps read-only hand receipt creation to FORBIDDEN while keeping reads available", async () => {
    const repository = new InMemoryHandReceiptRepository([
      {
        id: "78d65dcc-c47b-475c-9c5b-6cb1fbfd0f42",
        accountId: "account-1",
        name: "Readable receipt",
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
    const caller = createCaller({
      account: createAccount({
        accessState: "paused_read_only",
        subscriptionTier: "pro",
      }),
      handReceiptRepository: repository,
    });

    await expect(caller.handReceipts.list()).resolves.toMatchObject([
      {
        id: "78d65dcc-c47b-475c-9c5b-6cb1fbfd0f42",
        name: "Readable receipt",
      },
    ]);
    await expect(
      caller.handReceipts.create({
        name: "Blocked receipt",
      }),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "This account is read-only.",
    });
    expect(repository.handReceipts).toHaveLength(1);
  });

  it("returns a single hand receipt through the typed detail procedure", async () => {
    const handReceiptId = "2c4d5d97-1610-493d-baa5-8bc80b2dce01";
    const repository = new InMemoryHandReceiptRepository([
      {
        id: handReceiptId,
        accountId: "account-1",
        name: "Detail receipt",
        notes: "Visible on detail.",
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
      createCaller({ handReceiptRepository: repository }).handReceipts.getById({
        id: handReceiptId,
      }),
    ).resolves.toMatchObject({
      id: handReceiptId,
      name: "Detail receipt",
      holderName: "SSG Rivera",
    });
  });

  it("returns NOT_FOUND when a detail read crosses account boundaries", async () => {
    const handReceiptId = "0c27378f-6ca6-42d2-ae06-6c6c3ab96faa";
    const repository = new InMemoryHandReceiptRepository([
      {
        id: handReceiptId,
        accountId: "account-2",
        name: "Other owner",
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
      createCaller({ handReceiptRepository: repository }).handReceipts.getById({
        id: handReceiptId,
      }),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Hand receipt was not found.",
    });
  });

  it("updates hand receipt details and records update audit history", async () => {
    const handReceiptId = "895c4267-19a7-4629-a873-3e7224d00528";
    const auditRepository = new InMemoryAuditRepository();
    const repository = new InMemoryHandReceiptRepository([
      {
        id: handReceiptId,
        accountId: "account-1",
        name: "Original receipt",
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

    const updated = await createCaller({
      handReceiptRepository: repository,
      auditRepository,
    }).handReceipts.update({
      id: handReceiptId,
      name: "Updated receipt",
      notes: "Edited in detail.",
      holderName: "SSG Rivera",
    });

    expect(updated).toMatchObject({
      id: handReceiptId,
      name: "Updated receipt",
      notes: "Edited in detail.",
      holderName: "SSG Rivera",
    });
    expect(auditRepository.events).toMatchObject([
      {
        accountId: "account-1",
        actorId: "owner-1",
        action: "hand_receipt.updated",
        targetType: "hand_receipt",
        targetId: handReceiptId,
        metadata: {
          changedFields: ["name", "notes", "holderName"],
        },
      },
    ]);
  });

  it("blocks updates for paused or read-only accounts", async () => {
    const handReceiptId = "1e2801fc-6f50-40a7-9ba0-45b456d8300c";
    const repository = new InMemoryHandReceiptRepository([
      {
        id: handReceiptId,
        accountId: "account-1",
        name: "Read-only receipt",
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
      createCaller({
        account: createAccount({
          accessState: "paused_read_only",
          subscriptionTier: "pro",
        }),
        handReceiptRepository: repository,
      }).handReceipts.update({
        id: handReceiptId,
        name: "Blocked",
      }),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "This account is read-only.",
    });
  });

  it("archives and restores through the typed procedures with audit history", async () => {
    const handReceiptId = "ce34705f-369b-45f0-91fd-c5f03f18b952";
    const auditRepository = new InMemoryAuditRepository();
    const repository = new InMemoryHandReceiptRepository([
      {
        id: handReceiptId,
        accountId: "account-1",
        name: "Lifecycle receipt",
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
    const caller = createCaller({
      auditRepository,
      handReceiptRepository: repository,
    });

    await expect(
      caller.handReceipts.archive({ id: handReceiptId }),
    ).resolves.toMatchObject({
      id: handReceiptId,
      status: "archived",
    });
    await expect(caller.handReceipts.list()).resolves.toEqual([]);
    await expect(caller.handReceipts.listArchived()).resolves.toMatchObject([
      {
        id: handReceiptId,
        status: "archived",
      },
    ]);

    await expect(
      caller.handReceipts.restore({ id: handReceiptId }),
    ).resolves.toMatchObject({
      id: handReceiptId,
      status: "active",
    });
    expect(auditRepository.events).toMatchObject([
      {
        action: "hand_receipt.archived",
        targetId: handReceiptId,
        metadata: {
          name: "Lifecycle receipt",
        },
      },
      {
        action: "hand_receipt.restored",
        targetId: handReceiptId,
        metadata: {
          name: "Lifecycle receipt",
        },
      },
    ]);
  });

  it("blocks archive and restore mutations for read-only accounts without audit history", async () => {
    const activeId = "b09c3dc7-02fe-4205-80ec-712dd7567347";
    const archivedId = "b12b070b-4f35-48db-b3d2-ddc36f5ee5cd";
    const auditRepository = new InMemoryAuditRepository();
    const repository = new InMemoryHandReceiptRepository([
      {
        id: activeId,
        accountId: "account-1",
        name: "Active receipt",
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
        id: archivedId,
        accountId: "account-1",
        name: "Archived receipt",
        notes: null,
        handReceiptNumber: null,
        holderName: null,
        unitName: null,
        uic: null,
        effectiveDate: null,
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
      auditRepository,
      handReceiptRepository: repository,
    });

    await expect(
      caller.handReceipts.archive({ id: activeId }),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "This account is read-only.",
    });
    await expect(
      caller.handReceipts.restore({ id: archivedId }),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "This account is read-only.",
    });
    expect(auditRepository.events).toEqual([]);
  });
});
