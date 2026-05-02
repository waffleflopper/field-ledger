import { describe, expect, it } from "vitest";

import type { AccountRecord } from "@/modules/accounts/application/ensure-account";
import { updateRequirement } from "@/modules/requirements";
import { InMemoryAuditRepository } from "../../support/audit-repository";
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

function createRequirementRepository() {
  return new InMemoryRequirementRepository([
    {
      id: "requirement-1",
      accountId: "account-1",
      itemId: "item-1",
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
}

function createBaseInput() {
  const account = createAccount();

  return {
    account,
    actorId: account.userId,
    input: {
      requirementId: "requirement-1",
      name: "Quarterly function check",
      notes: "Updated after layout change.",
      intervalType: "quarterly",
      intervalValue: null,
    },
    requirementRepository: createRequirementRepository(),
    completionRepository: new InMemoryRequirementCompletionRepository([
      {
        id: "completion-1",
        accountId: "account-1",
        requirementId: "requirement-1",
        completedOn: "2026-05-01",
        notes: "Completed before edit.",
        createdAt: new Date("2026-05-01T12:00:00.000Z"),
      },
    ]),
    auditRepository: new InMemoryAuditRepository(),
    now: new Date("2026-05-10T20:00:00.000Z"),
  };
}

describe("updateRequirement", () => {
  it("updates requirement metadata, recalculates next due from latest completion, and records activity", async () => {
    const input = createBaseInput();

    const result = await updateRequirement(input);

    expect(result).toMatchObject({
      requirement: {
        id: "requirement-1",
        name: "Quarterly function check",
        notes: "Updated after layout change.",
        intervalType: "quarterly",
        intervalValue: null,
        nextDueDate: "2026-08-01",
      },
      duplicateWarning: false,
    });
    expect(input.completionRepository.completions).toHaveLength(1);
    expect(input.auditRepository.events).toMatchObject([
      {
        action: "requirement.updated",
        targetType: "requirement",
        targetId: "requirement-1",
        metadata: {
          itemId: "item-1",
          name: "Quarterly function check",
          requirementName: "Quarterly function check",
          changedFields: ["name", "notes", "intervalType", "nextDueDate"],
          previousInterval: {
            intervalType: "monthly",
            intervalValue: null,
          },
          newInterval: {
            intervalType: "quarterly",
            intervalValue: null,
          },
          nextDueDate: "2026-08-01",
        },
      },
    ]);
  });

  it("warns but allows duplicate names on the same item", async () => {
    const requirementRepository = createRequirementRepository();

    requirementRepository.requirements.push({
      id: "requirement-2",
      accountId: "account-1",
      itemId: "item-1",
      name: "Duplicate name",
      notes: null,
      intervalType: "annual",
      intervalValue: null,
      nextDueDate: "2027-01-01",
      status: "active",
      pausedAt: null,
      createdAt: new Date("2026-04-30T12:00:00.000Z"),
      updatedAt: new Date("2026-04-30T12:00:00.000Z"),
    });

    await expect(
      updateRequirement({
        ...createBaseInput(),
        input: {
          requirementId: "requirement-1",
          name: "duplicate NAME",
          notes: null,
          intervalType: "monthly",
          intervalValue: null,
        },
        requirementRepository,
      }),
    ).resolves.toMatchObject({
      requirement: {
        name: "duplicate NAME",
      },
      duplicateWarning: true,
    });
  });

  it("returns the existing requirement without audit noise when nothing changes", async () => {
    const input = createBaseInput();

    await expect(
      updateRequirement({
        ...input,
        input: {
          requirementId: "requirement-1",
          name: "Monthly function check",
          notes: "Old notes",
          intervalType: "monthly",
          intervalValue: null,
        },
      }),
    ).resolves.toMatchObject({
      requirement: {
        id: "requirement-1",
        name: "Monthly function check",
        notes: "Old notes",
        nextDueDate: "2026-05-15",
      },
      duplicateWarning: false,
    });
    expect(input.auditRepository.events).toHaveLength(0);
  });

  it("preserves duplicate warnings when unchanged input still conflicts with another requirement", async () => {
    const requirementRepository = createRequirementRepository();

    requirementRepository.requirements.push({
      id: "requirement-2",
      accountId: "account-1",
      itemId: "item-1",
      name: "Monthly function check",
      notes: null,
      intervalType: "annual",
      intervalValue: null,
      nextDueDate: "2027-01-01",
      status: "active",
      pausedAt: null,
      createdAt: new Date("2026-04-30T12:00:00.000Z"),
      updatedAt: new Date("2026-04-30T12:00:00.000Z"),
    });

    await expect(
      updateRequirement({
        ...createBaseInput(),
        input: {
          requirementId: "requirement-1",
          name: "Monthly function check",
          notes: "Old notes",
          intervalType: "monthly",
          intervalValue: null,
        },
        requirementRepository,
      }),
    ).resolves.toMatchObject({
      requirement: {
        id: "requirement-1",
      },
      duplicateWarning: true,
    });
  });

  it("validates custom intervals and blocks read-only account edits", async () => {
    await expect(
      updateRequirement({
        ...createBaseInput(),
        input: {
          requirementId: "requirement-1",
          name: "Odd cadence",
          notes: null,
          intervalType: "custom_days",
          intervalValue: null,
        },
      }),
    ).rejects.toThrow(
      "Custom requirement intervals need a positive whole number.",
    );

    await expect(
      updateRequirement({
        ...createBaseInput(),
        account: createAccount({
          accessState: "paused_read_only",
          subscriptionTier: "pro",
        }),
      }),
    ).rejects.toThrow("This account is read-only.");
  });
});
