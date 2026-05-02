import { describe, expect, it } from "vitest";

import type { AccountRecord } from "@/modules/accounts/application/ensure-account";
import {
  adjustRequirementNextDue,
  completeRequirement,
  pauseRequirement,
  resumeRequirement,
  type RequirementRecord,
} from "@/modules/requirements";
import { InMemoryAuditRepository } from "../../support/audit-repository";
import { InMemoryHandReceiptRepository } from "../../support/hand-receipt-repository";
import { InMemoryItemRepository } from "../../support/item-repository";
import { InMemoryRequirementCompletionRepository } from "../../support/requirement-completion-repository";
import { InMemoryRequirementRepository } from "../../support/requirement-repository";

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

function createRequirement(
  overrides: Partial<RequirementRecord> = {},
): RequirementRecord {
  return {
    id: "requirement-1",
    accountId: "account-1",
    itemId: "item-1",
    name: "Monthly function check",
    notes: null,
    intervalType: "monthly",
    intervalValue: null,
    nextDueDate: "2026-05-15",
    status: "active",
    pausedAt: null,
    createdAt: new Date("2026-04-30T12:00:00.000Z"),
    updatedAt: new Date("2026-04-30T12:00:00.000Z"),
    ...overrides,
  };
}

function createItemRepository(status: "active" | "archived" = "active") {
  return new InMemoryItemRepository([
    {
      id: "item-1",
      accountId: "account-1",
      handReceiptId: "hand-receipt-1",
      nomenclature: "M4 carbine",
      ecn: "ECN-001",
      serialNumber: null,
      generatedId: null,
      notes: null,
      status,
      signedToContactId: null,
      signedToContactName: null,
      locationId: null,
      locationName: null,
      createdAt: new Date("2026-04-30T12:00:00.000Z"),
      updatedAt: new Date("2026-04-30T12:00:00.000Z"),
    },
  ]);
}

function createHandReceiptRepository(status: "active" | "archived" = "active") {
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
      status,
      createdAt: new Date("2026-04-30T12:00:00.000Z"),
      updatedAt: new Date("2026-04-30T12:00:00.000Z"),
    },
  ]);
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

describe("requirement lifecycle controls", () => {
  it("manually adjusts next due without changing the interval and records activity", async () => {
    const auditRepository = new InMemoryAuditRepository();
    const requirementRepository = new InMemoryRequirementRepository([
      createRequirement({
        intervalType: "custom_days",
        intervalValue: 45,
      }),
    ]);

    const result = await adjustRequirementNextDue({
      account: createAccount(),
      actorId: "owner-1",
      input: {
        requirementId: "requirement-1",
        nextDueDate: "2026-06-20",
      },
      auditRepository,
      requirementRepository,
      now: new Date("2026-05-10T20:00:00.000Z"),
    });

    expect(result).toMatchObject({
      nextDueDate: "2026-06-20",
      intervalType: "custom_days",
      intervalValue: 45,
    });
    expect(auditRepository.events).toMatchObject([
      {
        action: "requirement.next_due_adjusted",
        metadata: {
          previousNextDueDate: "2026-05-15",
          nextDueDate: "2026-06-20",
        },
      },
    ]);
  });

  it("keeps completion recalculation anchored to the actual completion after adjustment", async () => {
    const requirementRepository = new InMemoryRequirementRepository([
      createRequirement({
        nextDueDate: "2026-07-01",
      }),
    ]);

    await expect(
      completeRequirement({
        account: createAccount(),
        actorId: "owner-1",
        input: {
          requirementId: "requirement-1",
          completedOn: "2026-05-22",
        },
        auditRepository: new InMemoryAuditRepository(),
        completionRepository: new InMemoryRequirementCompletionRepository(),
        requirementRepository,
        now: new Date("2026-05-22T20:00:00.000Z"),
        createCompletionId: () => "completion-1",
      }),
    ).resolves.toMatchObject({
      requirement: {
        nextDueDate: "2026-06-22",
      },
    });
  });

  it("pauses and resumes without deleting the requirement or history", async () => {
    const auditRepository = new InMemoryAuditRepository();
    const requirementRepository = new InMemoryRequirementRepository([
      createRequirement(),
    ]);
    const pauseTime = new Date("2026-05-10T20:00:00.000Z");

    const paused = await pauseRequirement({
      account: createAccount(),
      actorId: "owner-1",
      input: { requirementId: "requirement-1" },
      auditRepository,
      requirementRepository,
      now: pauseTime,
    });

    expect(paused.pausedAt).toEqual(pauseTime);

    const resumed = await resumeRequirement({
      account: createAccount(),
      actorId: "owner-1",
      input: { requirementId: "requirement-1" },
      auditRepository,
      handReceiptRepository: createHandReceiptRepository(),
      itemRepository: createItemRepository(),
      requirementRepository,
      now: new Date("2026-05-11T20:00:00.000Z"),
    });

    expect(resumed.pausedAt).toBeNull();
    expect(auditRepository.events.map((event) => event.action)).toEqual([
      "requirement.paused",
      "requirement.resumed",
    ]);
  });

  it("fails a stale pause when the requirement is paused between read and write", async () => {
    const auditRepository = new InMemoryAuditRepository();
    const concurrentPausedAt = new Date("2026-05-10T19:59:00.000Z");
    const requirementRepository = new MutatingRequirementRepository(
      [createRequirement()],
      (repository) => {
        repository.requirements[0] = {
          ...repository.requirements[0]!,
          pausedAt: concurrentPausedAt,
        };
      },
    );

    await expect(
      pauseRequirement({
        account: createAccount(),
        actorId: "owner-1",
        input: { requirementId: "requirement-1" },
        auditRepository,
        requirementRepository,
        now: new Date("2026-05-10T20:00:00.000Z"),
      }),
    ).rejects.toThrow("Requirement state has changed.");

    expect(auditRepository.events).toEqual([]);
    expect(requirementRepository.requirements[0]!.pausedAt).toEqual(
      concurrentPausedAt,
    );
  });

  it("fails a stale resume when the requirement is resumed between read and write", async () => {
    const auditRepository = new InMemoryAuditRepository();
    const requirementRepository = new MutatingRequirementRepository(
      [
        createRequirement({
          pausedAt: new Date("2026-05-10T19:00:00.000Z"),
        }),
      ],
      (repository) => {
        repository.requirements[0] = {
          ...repository.requirements[0]!,
          pausedAt: null,
        };
      },
    );

    await expect(
      resumeRequirement({
        account: createAccount(),
        actorId: "owner-1",
        input: { requirementId: "requirement-1" },
        auditRepository,
        handReceiptRepository: createHandReceiptRepository(),
        itemRepository: createItemRepository(),
        requirementRepository,
        now: new Date("2026-05-10T20:00:00.000Z"),
      }),
    ).rejects.toThrow("Requirement state has changed.");

    expect(auditRepository.events).toEqual([]);
    expect(requirementRepository.requirements[0]!.pausedAt).toBeNull();
  });

  it("fails a stale resume when the requirement is resumed and paused again between read and write", async () => {
    const auditRepository = new InMemoryAuditRepository();
    const concurrentPausedAt = new Date("2026-05-10T19:30:00.000Z");
    const requirementRepository = new MutatingRequirementRepository(
      [
        createRequirement({
          pausedAt: new Date("2026-05-10T19:00:00.000Z"),
        }),
      ],
      (repository) => {
        repository.requirements[0] = {
          ...repository.requirements[0]!,
          pausedAt: concurrentPausedAt,
        };
      },
    );

    await expect(
      resumeRequirement({
        account: createAccount(),
        actorId: "owner-1",
        input: { requirementId: "requirement-1" },
        auditRepository,
        handReceiptRepository: createHandReceiptRepository(),
        itemRepository: createItemRepository(),
        requirementRepository,
        now: new Date("2026-05-10T20:00:00.000Z"),
      }),
    ).rejects.toThrow("Requirement state has changed.");

    expect(auditRepository.events).toEqual([]);
    expect(requirementRepository.requirements[0]!.pausedAt).toEqual(
      concurrentPausedAt,
    );
  });

  it("blocks lifecycle changes for read-only accounts and invalid paused transitions", async () => {
    await expect(
      adjustRequirementNextDue({
        account: createAccount({
          accessState: "paused_read_only",
          subscriptionTier: "pro",
        }),
        actorId: "owner-1",
        input: {
          requirementId: "requirement-1",
          nextDueDate: "2026-06-20",
        },
        auditRepository: new InMemoryAuditRepository(),
        requirementRepository: new InMemoryRequirementRepository([
          createRequirement(),
        ]),
      }),
    ).rejects.toThrow("This account is read-only.");

    await expect(
      pauseRequirement({
        account: createAccount(),
        actorId: "owner-1",
        input: { requirementId: "requirement-1" },
        auditRepository: new InMemoryAuditRepository(),
        requirementRepository: new InMemoryRequirementRepository([
          createRequirement({
            pausedAt: new Date("2026-05-10T20:00:00.000Z"),
          }),
        ]),
      }),
    ).rejects.toThrow("Requirement is already paused.");

    await expect(
      resumeRequirement({
        account: createAccount(),
        actorId: "owner-1",
        input: { requirementId: "requirement-1" },
        auditRepository: new InMemoryAuditRepository(),
        handReceiptRepository: createHandReceiptRepository(),
        itemRepository: createItemRepository(),
        requirementRepository: new InMemoryRequirementRepository([
          createRequirement(),
        ]),
      }),
    ).rejects.toThrow("Requirement is not paused.");
  });

  it("blocks paused completion and resume from archived item or hand receipt", async () => {
    const pausedRequirement = createRequirement({
      pausedAt: new Date("2026-05-10T20:00:00.000Z"),
    });

    await expect(
      completeRequirement({
        account: createAccount(),
        actorId: "owner-1",
        input: {
          requirementId: "requirement-1",
          completedOn: "2026-05-10",
        },
        auditRepository: new InMemoryAuditRepository(),
        completionRepository: new InMemoryRequirementCompletionRepository(),
        requirementRepository: new InMemoryRequirementRepository([
          pausedRequirement,
        ]),
        now: new Date("2026-05-10T20:00:00.000Z"),
      }),
    ).rejects.toThrow("Requirement is paused.");

    await expect(
      resumeRequirement({
        account: createAccount(),
        actorId: "owner-1",
        input: { requirementId: "requirement-1" },
        auditRepository: new InMemoryAuditRepository(),
        handReceiptRepository: createHandReceiptRepository(),
        itemRepository: createItemRepository("archived"),
        requirementRepository: new InMemoryRequirementRepository([
          pausedRequirement,
        ]),
      }),
    ).rejects.toThrow("Cannot resume requirement on archived item.");

    await expect(
      resumeRequirement({
        account: createAccount(),
        actorId: "owner-1",
        input: { requirementId: "requirement-1" },
        auditRepository: new InMemoryAuditRepository(),
        handReceiptRepository: createHandReceiptRepository("archived"),
        itemRepository: createItemRepository(),
        requirementRepository: new InMemoryRequirementRepository([
          pausedRequirement,
        ]),
      }),
    ).rejects.toThrow("Cannot resume requirement on archived hand receipt.");
  });
});
