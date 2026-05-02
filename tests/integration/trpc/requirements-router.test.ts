import { TRPCError } from "@trpc/server";
import { describe, expect, it } from "vitest";

import type { AccountRecord } from "@/modules/accounts/application/ensure-account";
import type { RequirementRecord } from "@/modules/requirements";
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

function createHandReceiptRepository() {
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
      createdAt: new Date("2026-04-30T12:00:00.000Z"),
      updatedAt: new Date("2026-04-30T12:00:00.000Z"),
    },
  ]);
}

function createCaller({
  account = createAccount(),
  accountRepository = new InMemoryAccountRepository([account]),
  auditRepository = new InMemoryAuditRepository(),
  contactRepository = new InMemoryContactRepository(),
  handReceiptRepository = createHandReceiptRepository(),
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

class MutatingRequirementRepository extends InMemoryRequirementRepository {
  constructor(
    requirements: RequirementRecord[],
    private readonly mutateAfterRead: (
      repository: InMemoryRequirementRepository,
    ) => void,
  ) {
    super(requirements);
  }

  override async findById(accountId: string, requirementId: string) {
    const requirement = await super.findById(accountId, requirementId);

    if (requirement) {
      const snapshot = { ...requirement };
      this.mutateAfterRead(this);
      return snapshot;
    }

    return null;
  }
}

describe("requirementsRouter", () => {
  it("returns dashboard requirement work with account capability context", async () => {
    const requirementRepository = new InMemoryRequirementRepository(
      [
        {
          id: "dashboard-overdue",
          accountId: "account-1",
          itemId: itemOneId,
          name: "Overdue PMCS",
          notes: null,
          intervalType: "monthly",
          intervalValue: null,
          nextDueDate: "2026-04-01",
          status: "active",
          pausedAt: null,
          createdAt: new Date("2026-05-01T12:00:00.000Z"),
          updatedAt: new Date("2026-05-01T12:00:00.000Z"),
        },
        {
          id: "dashboard-paused",
          accountId: "account-1",
          itemId: itemTwoId,
          name: "Paused compass check",
          notes: null,
          intervalType: "weekly",
          intervalValue: null,
          nextDueDate: "2026-05-03",
          status: "active",
          pausedAt: new Date("2026-05-01T12:00:00.000Z"),
          createdAt: new Date("2026-05-01T12:00:00.000Z"),
          updatedAt: new Date("2026-05-01T12:00:00.000Z"),
        },
      ],
      [
        {
          requirementId: "dashboard-overdue",
          requirementName: "Overdue PMCS",
          nextDueDate: "2026-04-01",
          itemId: itemOneId,
          itemNomenclature: "M4 carbine",
          handReceiptId: "hand-receipt-1",
          handReceiptName: "Primary receipt",
        },
        {
          requirementId: "dashboard-paused",
          requirementName: "Paused compass check",
          nextDueDate: "2026-05-03",
          itemId: itemTwoId,
          itemNomenclature: "Compass",
          handReceiptId: "hand-receipt-1",
          handReceiptName: "Primary receipt",
        },
      ],
    );

    await expect(
      createCaller({ requirementRepository }).requirements.dashboardWork(),
    ).resolves.toMatchObject({
      isReadOnly: false,
      overdue: [
        {
          requirementName: "Overdue PMCS",
          itemNomenclature: "M4 carbine",
          handReceiptName: "Primary receipt",
          urgency: "overdue",
        },
      ],
      dueSoon: [],
      upcoming: [],
    });
  });

  it("does not present active dashboard reminders for read-only accounts", async () => {
    const account = createAccount({
      accessState: "paused_read_only",
      subscriptionTier: "pro",
    });
    const requirementRepository = new InMemoryRequirementRepository(
      [
        {
          id: "dashboard-overdue",
          accountId: "account-1",
          itemId: itemOneId,
          name: "Overdue PMCS",
          notes: null,
          intervalType: "monthly",
          intervalValue: null,
          nextDueDate: "2026-05-01",
          status: "active",
          pausedAt: null,
          createdAt: new Date("2026-05-01T12:00:00.000Z"),
          updatedAt: new Date("2026-05-01T12:00:00.000Z"),
        },
      ],
      [
        {
          requirementId: "dashboard-overdue",
          requirementName: "Overdue PMCS",
          nextDueDate: "2026-05-01",
          itemId: itemOneId,
          itemNomenclature: "M4 carbine",
          handReceiptId: "hand-receipt-1",
          handReceiptName: "Primary receipt",
        },
      ],
    );

    await expect(
      createCaller({
        account,
        requirementRepository,
      }).requirements.dashboardWork(),
    ).resolves.toEqual({
      isReadOnly: true,
      overdue: [],
      dueSoon: [],
      upcoming: [],
    });
  });

  it("creates and lists requirements for an item through the typed API", async () => {
    const requirementRepository = new InMemoryRequirementRepository();
    const caller = createCaller({ requirementRepository });

    const result = await caller.requirements.create({
      itemId: itemOneId,
      name: "Monthly function check",
      intervalType: "monthly",
    });

    expect(result).toMatchObject({
      requirement: {
        itemId: itemOneId,
        name: "Monthly function check",
        notes: null,
        intervalType: "monthly",
        nextDueDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
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
      }),
    ).rejects.toBeInstanceOf(TRPCError);

    await expect(
      createCaller().requirements.create({
        itemId: itemOneId,
        name: "Odd cadence",
        intervalType: "custom_days",
      }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "Custom requirement intervals need a positive whole number.",
    });
  });

  it("returns duplicate warnings before confirmed creation", async () => {
    const requirementRepository = new InMemoryRequirementRepository();
    const caller = createCaller({ requirementRepository });

    await caller.requirements.create({
      itemId: itemOneId,
      name: "Monthly function check",
      intervalType: "monthly",
    });
    const warning = await caller.requirements.create({
      itemId: itemOneId,
      name: "Monthly function check",
      intervalType: "monthly",
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
        confirmDuplicate: true,
      }),
    ).resolves.toMatchObject({
      requirement: {
        nextDueDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
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
        notes: null,
        intervalType: "monthly",
        intervalValue: null,
        nextDueDate: "2026-05-15",
        status: "active",
        pausedAt: null,
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
        notes: null,
        intervalType: "monthly",
        intervalValue: null,
        nextDueDate: "2026-05-15",
        status: "active",
        pausedAt: null,
        createdAt: new Date("2026-05-01T12:00:00.000Z"),
        updatedAt: new Date("2026-05-01T12:00:00.000Z"),
      },
      {
        id: "requirement-2",
        accountId: "account-1",
        itemId: itemTwoId,
        name: "Compass check",
        notes: null,
        intervalType: "weekly",
        intervalValue: null,
        nextDueDate: "2026-05-08",
        status: "active",
        pausedAt: null,
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
        notes: null,
        intervalType: "monthly",
        intervalValue: null,
        nextDueDate: "2026-05-15",
        status: "active",
        pausedAt: null,
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
        notes: null,
        intervalType: "monthly",
        intervalValue: null,
        nextDueDate: "2026-05-15",
        status: "active",
        pausedAt: null,
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

  it("updates requirement metadata through the typed API", async () => {
    const auditRepository = new InMemoryAuditRepository();
    const requirementCompletionRepository =
      new InMemoryRequirementCompletionRepository([
        {
          id: "completion-1",
          accountId: "account-1",
          requirementId: "8f545ead-2f8c-4391-91b4-60713df39b09",
          completedOn: "2026-05-01",
          notes: "Completed before edit.",
          createdAt: new Date("2026-05-01T12:00:00.000Z"),
        },
      ]);
    const requirementRepository = new InMemoryRequirementRepository([
      {
        id: "8f545ead-2f8c-4391-91b4-60713df39b09",
        accountId: "account-1",
        itemId: itemOneId,
        name: "Monthly function check",
        notes: "Old notes",
        intervalType: "monthly",
        intervalValue: null,
        nextDueDate: "2026-05-15",
        status: "active",
        pausedAt: null,
        createdAt: new Date("2026-04-30T12:00:00.000Z"),
        updatedAt: new Date("2026-04-30T12:00:00.000Z"),
      },
    ]);
    const caller = createCaller({
      auditRepository,
      requirementCompletionRepository,
      requirementRepository,
    });

    await expect(
      caller.requirements.update({
        requirementId: "8f545ead-2f8c-4391-91b4-60713df39b09",
        name: "Quarterly function check",
        notes: "Updated after layout change.",
        intervalType: "quarterly",
      }),
    ).resolves.toMatchObject({
      requirement: {
        name: "Quarterly function check",
        notes: "Updated after layout change.",
        nextDueDate: "2026-08-01",
      },
      duplicateWarning: false,
    });
    await expect(
      caller.requirements.listCompletionHistory({
        requirementId: "8f545ead-2f8c-4391-91b4-60713df39b09",
      }),
    ).resolves.toHaveLength(1);
    expect(auditRepository.events).toMatchObject([
      {
        action: "requirement.updated",
      },
    ]);
  });

  it("adjusts, pauses, and resumes a requirement through the typed API", async () => {
    const auditRepository = new InMemoryAuditRepository();
    const requirementRepository = new InMemoryRequirementRepository([
      {
        id: "3f38b7ea-ec76-4f93-b9ef-aa5309a83458",
        accountId: "account-1",
        itemId: itemOneId,
        name: "Monthly function check",
        notes: null,
        intervalType: "monthly",
        intervalValue: null,
        nextDueDate: "2026-05-15",
        status: "active",
        pausedAt: null,
        createdAt: new Date("2026-05-01T12:00:00.000Z"),
        updatedAt: new Date("2026-05-01T12:00:00.000Z"),
      },
    ]);
    const caller = createCaller({
      auditRepository,
      requirementRepository,
    });

    await expect(
      caller.requirements.adjustNextDue({
        requirementId: "3f38b7ea-ec76-4f93-b9ef-aa5309a83458",
        nextDueDate: "2026-06-20",
      }),
    ).resolves.toMatchObject({
      id: "3f38b7ea-ec76-4f93-b9ef-aa5309a83458",
      nextDueDate: "2026-06-20",
      intervalType: "monthly",
      intervalValue: null,
    });

    await expect(
      caller.requirements.pause({
        requirementId: "3f38b7ea-ec76-4f93-b9ef-aa5309a83458",
      }),
    ).resolves.toMatchObject({
      id: "3f38b7ea-ec76-4f93-b9ef-aa5309a83458",
      pausedAt: expect.any(Date),
    });

    await expect(
      caller.requirements.resume({
        requirementId: "3f38b7ea-ec76-4f93-b9ef-aa5309a83458",
      }),
    ).resolves.toMatchObject({
      id: "3f38b7ea-ec76-4f93-b9ef-aa5309a83458",
      pausedAt: null,
    });

    expect(auditRepository.events.map((event) => event.action)).toEqual([
      "requirement.next_due_adjusted",
      "requirement.paused",
      "requirement.resumed",
    ]);
  });

  it("maps requirement lifecycle conflicts and read-only blocking to typed errors", async () => {
    const pausedRequirement = {
      id: "1f9de16d-fec7-462f-95b4-9a53a93fc636",
      accountId: "account-1",
      itemId: itemOneId,
      name: "Monthly function check",
      notes: null,
      intervalType: "monthly" as const,
      intervalValue: null,
      nextDueDate: "2026-05-15",
      status: "active" as const,
      pausedAt: new Date("2026-05-01T12:00:00.000Z"),
      createdAt: new Date("2026-05-01T12:00:00.000Z"),
      updatedAt: new Date("2026-05-01T12:00:00.000Z"),
    };

    await expect(
      createCaller({
        account: createAccount({
          accessState: "paused_read_only",
          subscriptionTier: "pro",
        }),
        requirementRepository: new InMemoryRequirementRepository([
          pausedRequirement,
        ]),
      }).requirements.resume({
        requirementId: "1f9de16d-fec7-462f-95b4-9a53a93fc636",
      }),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "This account is read-only.",
    });

    await expect(
      createCaller({
        requirementRepository: new InMemoryRequirementRepository([
          pausedRequirement,
        ]),
      }).requirements.pause({
        requirementId: "1f9de16d-fec7-462f-95b4-9a53a93fc636",
      }),
    ).rejects.toMatchObject({
      code: "CONFLICT",
      message: "Requirement is already paused.",
    });

    await expect(
      createCaller({
        requirementRepository: new InMemoryRequirementRepository([
          {
            ...pausedRequirement,
            pausedAt: null,
          },
        ]),
      }).requirements.resume({
        requirementId: "1f9de16d-fec7-462f-95b4-9a53a93fc636",
      }),
    ).rejects.toMatchObject({
      code: "CONFLICT",
      message: "Requirement is not paused.",
    });
  });

  it("maps stale pause writes to a conflict response", async () => {
    const auditRepository = new InMemoryAuditRepository();
    const requirementRepository = new MutatingRequirementRepository(
      [
        {
          id: "1f9de16d-fec7-462f-95b4-9a53a93fc636",
          accountId: "account-1",
          itemId: itemOneId,
          name: "Monthly function check",
          notes: null,
          intervalType: "monthly",
          intervalValue: null,
          nextDueDate: "2026-05-15",
          status: "active",
          pausedAt: null,
          createdAt: new Date("2026-05-01T12:00:00.000Z"),
          updatedAt: new Date("2026-05-01T12:00:00.000Z"),
        },
      ],
      (repository) => {
        repository.requirements[0] = {
          ...repository.requirements[0]!,
          pausedAt: new Date("2026-05-01T12:30:00.000Z"),
        };
      },
    );

    await expect(
      createCaller({
        auditRepository,
        requirementRepository,
      }).requirements.pause({
        requirementId: "1f9de16d-fec7-462f-95b4-9a53a93fc636",
      }),
    ).rejects.toMatchObject({
      code: "CONFLICT",
      message: "Requirement state has changed.",
    });

    expect(auditRepository.events).toEqual([]);
  });
});
