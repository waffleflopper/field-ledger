import { describe, expect, it } from "vitest";

import { listRequirements } from "@/modules/requirements";
import { InMemoryRequirementRepository } from "../../support/requirement-repository";

describe("listRequirements", () => {
  it("lists active requirements for one item ordered by next due date", async () => {
    const repository = new InMemoryRequirementRepository([
      {
        id: "requirement-later",
        accountId: "account-1",
        itemId: "item-1",
        name: "Annual inventory",
        notes: null,
        intervalType: "annual",
        intervalValue: null,
        nextDueDate: "2026-12-01",
        status: "active",
        pausedAt: null,
        createdAt: new Date("2026-04-30T12:00:00.000Z"),
        updatedAt: new Date("2026-04-30T12:00:00.000Z"),
      },
      {
        id: "requirement-sooner",
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
      {
        id: "other-item",
        accountId: "account-1",
        itemId: "item-2",
        name: "Other item check",
        notes: null,
        intervalType: "weekly",
        intervalValue: null,
        nextDueDate: "2026-05-01",
        status: "active",
        pausedAt: null,
        createdAt: new Date("2026-04-30T12:00:00.000Z"),
        updatedAt: new Date("2026-04-30T12:00:00.000Z"),
      },
    ]);

    await expect(
      listRequirements({
        accountId: "account-1",
        itemId: "item-1",
        repository,
      }),
    ).resolves.toMatchObject([
      { id: "requirement-sooner" },
      { id: "requirement-later" },
    ]);
  });
});
