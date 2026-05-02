import { describe, expect, it } from "vitest";

import type { AccountRecord } from "@/modules/accounts/application/ensure-account";
import { completeRequirement } from "@/modules/requirements";
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
      notes: null,
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
      completedOn: "2026-05-01",
      notes: "Completed during layout.",
    },
    requirementRepository: createRequirementRepository(),
    completionRepository: new InMemoryRequirementCompletionRepository(),
    auditRepository: new InMemoryAuditRepository(),
    now: new Date("2026-05-10T20:00:00.000Z"),
    createCompletionId: () => "completion-1",
  };
}

describe("completeRequirement", () => {
  it("creates permanent completion history, updates next due date, and records activity", async () => {
    const input = createBaseInput();

    const result = await completeRequirement(input);

    expect(result).toMatchObject({
      completion: {
        id: "completion-1",
        accountId: "account-1",
        requirementId: "requirement-1",
        completedOn: "2026-05-01",
        notes: "Completed during layout.",
      },
      requirement: {
        id: "requirement-1",
        nextDueDate: "2026-06-01",
      },
    });
    expect(input.completionRepository.completions).toHaveLength(1);
    expect(input.auditRepository.events).toMatchObject([
      {
        action: "requirement.completed",
        targetType: "requirement",
        targetId: "requirement-1",
        metadata: {
          name: "Monthly function check",
          requirementName: "Monthly function check",
          completedOn: "2026-05-01",
          nextDueDate: "2026-06-01",
        },
      },
    ]);
  });

  it("defaults completion to today's date and accepts past date-only completions", async () => {
    await expect(
      completeRequirement({
        ...createBaseInput(),
        input: {
          requirementId: "requirement-1",
        },
        now: new Date("2026-05-10T23:55:00.000Z"),
      }),
    ).resolves.toMatchObject({
      completion: {
        completedOn: "2026-05-10",
      },
      requirement: {
        nextDueDate: "2026-06-10",
      },
    });

    await expect(
      completeRequirement({
        ...createBaseInput(),
        input: {
          requirementId: "requirement-1",
          completedOn: "2026-04-15",
        },
      }),
    ).resolves.toMatchObject({
      completion: {
        completedOn: "2026-04-15",
      },
      requirement: {
        nextDueDate: "2026-05-15",
      },
    });
  });

  it("blocks future dates and read-only account completions", async () => {
    await expect(
      completeRequirement({
        ...createBaseInput(),
        input: {
          requirementId: "requirement-1",
          completedOn: "2026-05-11",
        },
      }),
    ).rejects.toThrow("Completion date cannot be in the future.");

    await expect(
      completeRequirement({
        ...createBaseInput(),
        account: createAccount({
          accessState: "paused_read_only",
          subscriptionTier: "pro",
        }),
      }),
    ).rejects.toThrow("This account is read-only.");
  });

  it("returns null when the requirement is outside the account", async () => {
    await expect(
      completeRequirement({
        ...createBaseInput(),
        input: {
          requirementId: "missing-requirement",
          completedOn: "2026-05-01",
        },
      }),
    ).resolves.toBeNull();
  });
});
