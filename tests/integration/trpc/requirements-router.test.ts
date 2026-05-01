import { TRPCError } from "@trpc/server";
import { describe, expect, it } from "vitest";

import type { AccountRecord } from "@/modules/accounts/application/ensure-account";
import { appRouter } from "@/server/trpc/router";
import { InMemoryAccountRepository } from "../../support/account-repository";
import { InMemoryAuditRepository } from "../../support/audit-repository";
import { createInMemoryAppUnitOfWork } from "../../support/app-unit-of-work";
import { InMemoryContactRepository } from "../../support/contact-repository";
import { InMemoryHandReceiptRepository } from "../../support/hand-receipt-repository";
import { InMemoryItemRepository } from "../../support/item-repository";
import { InMemoryLocationRepository } from "../../support/location-repository";
import { InMemoryRequirementCompletionRepository } from "../../support/requirement-completion-repository";
import { InMemoryRequirementRepository } from "../../support/requirement-repository";

const itemOneId = "95e3d383-6453-466b-b425-c8a630bf866d";
const itemTwoId = "d354beaf-0275-4728-a835-f2d0066279ec";

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

function createItemRepository() {
  return new InMemoryItemRepository([
    {
      id: itemOneId,
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
      createdAt: new Date("2026-04-30T12:00:00.000Z"),
      updatedAt: new Date("2026-04-30T12:00:00.000Z"),
    },
    {
      id: itemTwoId,
      accountId: "account-1",
      handReceiptId: "hand-receipt-1",
      nomenclature: "Compass",
      ecn: "ECN-002",
      serialNumber: null,
      generatedId: null,
      notes: null,
      status: "active",
      signedToContactId: null,
      signedToContactName: null,
      locationId: null,
      locationName: null,
      createdAt: new Date("2026-04-30T13:00:00.000Z"),
      updatedAt: new Date("2026-04-30T13:00:00.000Z"),
    },
  ]);
}

function createCaller({
  account = createAccount(),
  accountRepository = new InMemoryAccountRepository([account]),
  auditRepository = new InMemoryAuditRepository(),
  contactRepository = new InMemoryContactRepository(),
  handReceiptRepository = new InMemoryHandReceiptRepository(),
  itemRepository = createItemRepository(),
  locationRepository = new InMemoryLocationRepository(),
  requirementCompletionRepository = new InMemoryRequirementCompletionRepository(),
  requirementRepository = new InMemoryRequirementRepository(),
} = {}) {
  return appRouter.createCaller({
    session: {
      userId: account.userId,
      email: "owner@example.com",
    },
    account,
    accountRepository,
    auditRepository,
    contactRepository,
    handReceiptRepository,
    itemRepository,
    locationRepository,
    requirementCompletionRepository,
    requirementRepository,
    unitOfWork: createInMemoryAppUnitOfWork({
      accountRepository,
      auditRepository,
      contactRepository,
      handReceiptRepository,
      itemRepository,
      locationRepository,
      requirementCompletionRepository,
      requirementRepository,
    }),
  });
}

describe("requirementsRouter", () => {
  it("creates and lists requirements for an item through the typed API", async () => {
    const requirementRepository = new InMemoryRequirementRepository();
    const caller = createCaller({ requirementRepository });

    const result = await caller.requirements.create({
      itemId: itemOneId,
      name: "Monthly function check",
      intervalType: "monthly",
      nextDueDate: "2026-05-15",
    });

    expect(result).toMatchObject({
      requirement: {
        itemId: itemOneId,
        name: "Monthly function check",
        intervalType: "monthly",
        nextDueDate: "2026-05-15",
      },
    });
    await expect(
      caller.requirements.list({ itemId: itemOneId }),
    ).resolves.toMatchObject([
      {
        name: "Monthly function check",
      },
    ]);
  });

  it("validates requirement input through the typed procedure", async () => {
    await expect(
      createCaller().requirements.create({
        itemId: itemOneId,
        name: "",
        intervalType: "monthly",
        nextDueDate: "2026-05-15",
      }),
    ).rejects.toBeInstanceOf(TRPCError);

    await expect(
      createCaller().requirements.create({
        itemId: itemOneId,
        name: "Odd cadence",
        intervalType: "custom_days",
        nextDueDate: "2026-05-15",
      }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "Custom requirement intervals need a positive whole number.",
    });

    await expect(
      createCaller().requirements.create({
        itemId: itemOneId,
        name: "Impossible date",
        intervalType: "annual",
        nextDueDate: "2026-02-31",
      }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "Next due date must use YYYY-MM-DD format.",
    });
  });

  it("returns duplicate warnings before confirmed creation", async () => {
    const requirementRepository = new InMemoryRequirementRepository();
    const caller = createCaller({ requirementRepository });

    await caller.requirements.create({
      itemId: itemOneId,
      name: "Monthly function check",
      intervalType: "monthly",
      nextDueDate: "2026-05-15",
    });
    const warning = await caller.requirements.create({
      itemId: itemOneId,
      name: "Monthly function check",
      intervalType: "monthly",
      nextDueDate: "2026-06-15",
    });

    expect(warning).toMatchObject({
      duplicateWarning: {
        hasDuplicate: true,
        existingRequirement: {
          name: "Monthly function check",
        },
      },
    });
    expect(requirementRepository.requirements).toHaveLength(1);

    await expect(
      caller.requirements.create({
        itemId: itemOneId,
        name: "Monthly function check",
        intervalType: "monthly",
        nextDueDate: "2026-06-15",
        confirmDuplicate: true,
      }),
    ).resolves.toMatchObject({
      requirement: {
        nextDueDate: "2026-06-15",
      },
    });
  });

  it("blocks writes for read-only accounts while preserving list access", async () => {
    const requirementRepository = new InMemoryRequirementRepository([
      {
        id: "requirement-1",
        accountId: "account-1",
        itemId: itemOneId,
        name: "Monthly function check",
        intervalType: "monthly",
        intervalValue: null,
        nextDueDate: "2026-05-15",
        status: "active",
        createdAt: new Date("2026-05-01T12:00:00.000Z"),
        updatedAt: new Date("2026-05-01T12:00:00.000Z"),
      },
    ]);
    const caller = createCaller({
      account: createAccount({
        accessState: "paused_read_only",
        subscriptionTier: "pro",
      }),
      requirementRepository,
    });

    await expect(
      caller.requirements.list({ itemId: itemOneId }),
    ).resolves.toHaveLength(1);
    await expect(
      caller.requirements.create({
        itemId: itemOneId,
        name: "Blocked requirement",
        intervalType: "annual",
        nextDueDate: "2027-01-01",
      }),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "This account is read-only.",
    });
  });

  it("keeps requirement lists scoped to the selected item", async () => {
    const requirementRepository = new InMemoryRequirementRepository([
      {
        id: "requirement-1",
        accountId: "account-1",
        itemId: itemOneId,
        name: "Monthly function check",
        intervalType: "monthly",
        intervalValue: null,
        nextDueDate: "2026-05-15",
        status: "active",
        createdAt: new Date("2026-05-01T12:00:00.000Z"),
        updatedAt: new Date("2026-05-01T12:00:00.000Z"),
      },
      {
        id: "requirement-2",
        accountId: "account-1",
        itemId: itemTwoId,
        name: "Compass check",
        intervalType: "weekly",
        intervalValue: null,
        nextDueDate: "2026-05-08",
        status: "active",
        createdAt: new Date("2026-05-01T12:00:00.000Z"),
        updatedAt: new Date("2026-05-01T12:00:00.000Z"),
      },
    ]);

    await expect(
      createCaller({ requirementRepository }).requirements.list({
        itemId: itemOneId,
      }),
    ).resolves.toMatchObject([{ id: "requirement-1" }]);
  });

  it("completes a requirement through the typed API and lists permanent history", async () => {
    const auditRepository = new InMemoryAuditRepository();
    const requirementCompletionRepository =
      new InMemoryRequirementCompletionRepository();
    const requirementRepository = new InMemoryRequirementRepository([
      {
        id: "4fa10114-b1d8-472f-8a60-e7a102108f56",
        accountId: "account-1",
        itemId: itemOneId,
        name: "Monthly function check",
        intervalType: "monthly",
        intervalValue: null,
        nextDueDate: "2026-05-15",
        status: "active",
        createdAt: new Date("2026-05-01T12:00:00.000Z"),
        updatedAt: new Date("2026-05-01T12:00:00.000Z"),
      },
    ]);
    const caller = createCaller({
      auditRepository,
      requirementCompletionRepository,
      requirementRepository,
    });

    await expect(
      caller.requirements.complete({
        requirementId: "4fa10114-b1d8-472f-8a60-e7a102108f56",
        completedOn: "2026-05-01",
        notes: "Completed during layout.",
      }),
    ).resolves.toMatchObject({
      completion: {
        requirementId: "4fa10114-b1d8-472f-8a60-e7a102108f56",
        completedOn: "2026-05-01",
        notes: "Completed during layout.",
      },
      requirement: {
        nextDueDate: "2026-06-01",
      },
    });
    await expect(
      caller.requirements.listCompletionHistory({
        requirementId: "4fa10114-b1d8-472f-8a60-e7a102108f56",
      }),
    ).resolves.toMatchObject([
      {
        completedOn: "2026-05-01",
        notes: "Completed during layout.",
      },
    ]);
    expect(auditRepository.events).toMatchObject([
      {
        action: "requirement.completed",
      },
    ]);
  });

  it("maps invalid completion attempts to typed errors", async () => {
    const requirementRepository = new InMemoryRequirementRepository([
      {
        id: "2a8f563a-ea60-4286-89a6-67c26b79608f",
        accountId: "account-1",
        itemId: itemOneId,
        name: "Monthly function check",
        intervalType: "monthly",
        intervalValue: null,
        nextDueDate: "2026-05-15",
        status: "active",
        createdAt: new Date("2026-05-01T12:00:00.000Z"),
        updatedAt: new Date("2026-05-01T12:00:00.000Z"),
      },
    ]);

    await expect(
      createCaller({ requirementRepository }).requirements.complete({
        requirementId: "2a8f563a-ea60-4286-89a6-67c26b79608f",
        completedOn: "2999-01-01",
      }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "Completion date cannot be in the future.",
    });

    await expect(
      createCaller({
        account: createAccount({
          accessState: "paused_read_only",
          subscriptionTier: "pro",
        }),
        requirementRepository,
      }).requirements.complete({
        requirementId: "2a8f563a-ea60-4286-89a6-67c26b79608f",
        completedOn: "2026-05-01",
      }),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "This account is read-only.",
    });
  });
});
