import { describe, expect, it } from "vitest";

import { listDashboardRequirements } from "@/modules/requirements";
import type {
  DashboardRequirementCandidate,
  RequirementRecord,
} from "@/modules/requirements";
import { InMemoryRequirementRepository } from "../../support/requirement-repository";

function requirement(
  overrides: Partial<RequirementRecord> = {},
): RequirementRecord {
  return {
    id: "requirement-1",
    accountId: "account-1",
    itemId: "item-1",
    name: "Monthly PMCS",
    notes: null,
    intervalType: "monthly",
    intervalValue: null,
    nextDueDate: "2026-05-01",
    status: "active",
    pausedAt: null,
    createdAt: new Date("2026-04-01T12:00:00.000Z"),
    updatedAt: new Date("2026-04-01T12:00:00.000Z"),
    ...overrides,
  };
}

function dashboardCandidate(
  overrides: Partial<DashboardRequirementCandidate> = {},
): DashboardRequirementCandidate {
  return {
    requirementId: "requirement-1",
    requirementName: "Monthly PMCS",
    nextDueDate: "2026-05-01",
    itemId: "item-1",
    itemNomenclature: "M4 carbine",
    handReceiptId: "hand-receipt-1",
    handReceiptName: "Primary receipt",
    ...overrides,
  };
}

describe("listDashboardRequirements", () => {
  it("groups dashboard requirements by operational priority", async () => {
    const repository = new InMemoryRequirementRepository(
      [
        requirement({
          id: "overdue",
          nextDueDate: "2026-04-30",
        }),
        requirement({
          id: "due-soon",
          nextDueDate: "2026-05-15",
        }),
        requirement({
          id: "upcoming",
          nextDueDate: "2026-05-16",
        }),
        requirement({
          id: "beyond",
          nextDueDate: "2026-06-01",
        }),
      ],
      [
        dashboardCandidate({
          requirementId: "overdue",
          requirementName: "Overdue PMCS",
          nextDueDate: "2026-04-30",
        }),
        dashboardCandidate({
          requirementId: "due-soon",
          requirementName: "Due soon PMCS",
          nextDueDate: "2026-05-15",
        }),
        dashboardCandidate({
          requirementId: "upcoming",
          requirementName: "Upcoming PMCS",
          nextDueDate: "2026-05-16",
        }),
        dashboardCandidate({
          requirementId: "beyond",
          requirementName: "Beyond window",
          nextDueDate: "2026-06-01",
        }),
      ],
    );

    await expect(
      listDashboardRequirements({
        accountId: "account-1",
        repository,
        today: "2026-05-01",
      }),
    ).resolves.toMatchObject({
      overdue: [{ requirementName: "Overdue PMCS", urgency: "overdue" }],
      dueSoon: [{ requirementName: "Due soon PMCS", urgency: "due_soon" }],
      upcoming: [{ requirementName: "Upcoming PMCS", urgency: "upcoming" }],
    });
  });

  it("suppresses paused and beyond-window requirements from active dashboard work", async () => {
    const repository = new InMemoryRequirementRepository(
      [
        requirement({
          id: "paused",
          pausedAt: new Date("2026-05-01T12:00:00.000Z"),
        }),
        requirement({
          id: "beyond",
          nextDueDate: "2026-06-01",
        }),
      ],
      [
        dashboardCandidate({
          requirementId: "paused",
          requirementName: "Paused PMCS",
        }),
        dashboardCandidate({
          requirementId: "beyond",
          requirementName: "Beyond window",
          nextDueDate: "2026-06-01",
        }),
      ],
    );

    await expect(
      listDashboardRequirements({
        accountId: "account-1",
        repository,
        today: "2026-05-01",
      }),
    ).resolves.toEqual({ overdue: [], dueSoon: [], upcoming: [] });
  });
});
