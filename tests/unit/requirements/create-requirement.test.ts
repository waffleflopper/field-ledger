import { describe, expect, it } from "vitest";

import type { AccountRecord } from "@/modules/accounts/application/ensure-account";
import { createRequirement } from "@/modules/requirements";
import { InMemoryAuditRepository } from "../../support/audit-repository";
import { InMemoryItemRepository } from "../../support/item-repository";
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

function createItemRepository() {
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
      status: "active",
      signedToContactId: null,
      signedToContactName: null,
      locationId: null,
      locationName: null,
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
      itemId: "item-1",
      name: "Monthly function check",
      intervalType: "monthly",
      nextDueDate: "2026-05-15",
    },
    itemRepository: createItemRepository(),
    requirementRepository: new InMemoryRequirementRepository(),
    auditRepository: new InMemoryAuditRepository(),
    now: new Date("2026-05-01T12:00:00.000Z"),
    createRequirementId: () => "requirement-1",
  };
}

describe("createRequirement", () => {
  it("creates an active preset-interval item requirement and records activity", async () => {
    const baseInput = createBaseInput();

    const result = await createRequirement(baseInput);

    expect(result).toMatchObject({
      requirement: {
        id: "requirement-1",
        accountId: "account-1",
        itemId: "item-1",
        name: "Monthly function check",
        notes: null,
        intervalType: "monthly",
        intervalValue: null,
        nextDueDate: "2026-05-15",
        status: "active",
      },
    });
    expect(baseInput.auditRepository.events).toMatchObject([
      {
        action: "requirement.created",
        targetType: "requirement",
        targetId: "requirement-1",
        metadata: {
          itemId: "item-1",
          name: "Monthly function check",
          intervalType: "monthly",
          nextDueDate: "2026-05-15",
        },
      },
    ]);
  });

  it("creates a custom-day interval when the value is a positive whole number", async () => {
    await expect(
      createRequirement({
        ...createBaseInput(),
        input: {
          itemId: "item-1",
          name: "Battery swap",
          intervalType: "custom_days",
          intervalValue: 45,
          nextDueDate: "2026-06-15",
        },
      }),
    ).resolves.toMatchObject({
      requirement: {
        name: "Battery swap",
        intervalType: "custom_days",
        intervalValue: 45,
      },
    });
  });

  it("validates names, intervals, custom values, and date-only due dates", async () => {
    await expect(
      createRequirement({
        ...createBaseInput(),
        input: {
          itemId: "item-1",
          name: "   ",
          intervalType: "monthly",
          nextDueDate: "2026-05-15",
        },
      }),
    ).rejects.toThrow("Requirement name is required.");

    await expect(
      createRequirement({
        ...createBaseInput(),
        input: {
          itemId: "item-1",
          name: "Function check",
          intervalType: "third_tuesday",
          nextDueDate: "2026-05-15",
        },
      }),
    ).rejects.toThrow("Requirement interval is not supported.");

    await expect(
      createRequirement({
        ...createBaseInput(),
        input: {
          itemId: "item-1",
          name: "Function check",
          intervalType: "custom_months",
          nextDueDate: "2026-05-15",
        },
      }),
    ).rejects.toThrow(
      "Custom requirement intervals need a positive whole number.",
    );

    await expect(
      createRequirement({
        ...createBaseInput(),
        input: {
          itemId: "item-1",
          name: "Function check",
          intervalType: "annual",
          intervalValue: 1,
          nextDueDate: "2026-05-15",
        },
      }),
    ).rejects.toThrow("Preset requirement intervals cannot include a value.");

    await expect(
      createRequirement({
        ...createBaseInput(),
        input: {
          itemId: "item-1",
          name: "Function check",
          intervalType: "annual",
          nextDueDate: "05/15/2026",
        },
      }),
    ).rejects.toThrow("Next due date must use YYYY-MM-DD format.");

    await expect(
      createRequirement({
        ...createBaseInput(),
        input: {
          itemId: "item-1",
          name: "Function check",
          intervalType: "annual",
          nextDueDate: "2026-02-31",
        },
      }),
    ).rejects.toThrow("Next due date must use YYYY-MM-DD format.");
  });

  it("returns a duplicate warning until the duplicate name is confirmed", async () => {
    const requirementRepository = new InMemoryRequirementRepository([
      {
        id: "existing-requirement",
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

    const warning = await createRequirement({
      ...createBaseInput(),
      requirementRepository,
    });

    expect(warning).toMatchObject({
      duplicateWarning: {
        hasDuplicate: true,
        existingRequirement: {
          id: "existing-requirement",
        },
      },
    });
    expect(requirementRepository.requirements).toHaveLength(1);

    await expect(
      createRequirement({
        ...createBaseInput(),
        input: {
          ...createBaseInput().input,
          confirmDuplicate: true,
        },
        requirementRepository,
      }),
    ).resolves.toMatchObject({
      requirement: {
        name: "Monthly function check",
      },
    });
    expect(requirementRepository.requirements).toHaveLength(2);
  });

  it("blocks requirement creation for read-only accounts", async () => {
    await expect(
      createRequirement({
        ...createBaseInput(),
        account: createAccount({
          accessState: "paused_read_only",
          subscriptionTier: "pro",
        }),
      }),
    ).rejects.toThrow("This account is read-only.");
  });
});
