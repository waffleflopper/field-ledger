import { describe, expect, it } from "vitest";

import {
  formatAuditActionLabel,
  listRecentActivity,
  listTargetActivity,
  MAX_RECENT_ACTIVITY_LIMIT,
} from "@/modules/audit";
import type { AuditRepository } from "@/modules/audit";

function createRecordingRepository() {
  let receivedLimit: number | undefined;
  let receivedTarget:
    | {
        targetId: string;
        targetType: string;
      }
    | undefined;

  const repository: AuditRepository = {
    async record(event) {
      return {
        id: "event-1",
        createdAt: event.createdAt ?? event.occurredAt,
        ...event,
      };
    },
    async listByAccountId(_accountId, options = {}) {
      receivedLimit = options.limit;
      return [];
    },
    async listByTarget(_accountId, target, options = {}) {
      receivedLimit = options.limit;
      receivedTarget = target;
      return [];
    },
  };

  return {
    repository,
    getReceivedLimit: () => receivedLimit,
    getReceivedTarget: () => receivedTarget,
  };
}

describe("listRecentActivity", () => {
  it("maps hand receipt actions to user-readable labels", () => {
    expect(formatAuditActionLabel("hand_receipt.created")).toBe(
      "Hand receipt created",
    );
    expect(formatAuditActionLabel("hand_receipt.updated")).toBe(
      "Hand receipt updated",
    );
    expect(formatAuditActionLabel("hand_receipt.archived")).toBe(
      "Hand receipt archived",
    );
    expect(formatAuditActionLabel("hand_receipt.restored")).toBe(
      "Hand receipt restored",
    );
  });

  it("does not expose unknown raw action names", () => {
    expect(formatAuditActionLabel("future.internal_action")).toBe(
      "Activity recorded",
    );
  });

  it("normalizes invalid recent activity limits at the application boundary", async () => {
    const { repository, getReceivedLimit } = createRecordingRepository();

    await listRecentActivity({
      accountId: "account-1",
      repository,
      limit: 0,
    });

    expect(getReceivedLimit()).toBe(1);
  });

  it("caps oversized recent activity limits at the application boundary", async () => {
    const { repository, getReceivedLimit } = createRecordingRepository();

    await listRecentActivity({
      accountId: "account-1",
      repository,
      limit: MAX_RECENT_ACTIVITY_LIMIT + 1,
    });

    expect(getReceivedLimit()).toBe(MAX_RECENT_ACTIVITY_LIMIT);
  });

  it("returns readable target context from hand receipt metadata", async () => {
    const repository: AuditRepository = {
      async record(event) {
        return {
          id: "event-1",
          createdAt: event.createdAt ?? event.occurredAt,
          ...event,
        };
      },
      async listByAccountId() {
        return [
          {
            id: "event-1",
            accountId: "account-1",
            actorId: "user-1",
            action: "hand_receipt.created",
            targetType: "hand_receipt",
            targetId: "receipt-1",
            occurredAt: new Date("2026-05-01T12:00:00.000Z"),
            metadata: { name: "Alpha property book" },
            createdAt: new Date("2026-05-01T12:00:01.000Z"),
          },
        ];
      },
      async listByTarget() {
        return [];
      },
    };

    await expect(
      listRecentActivity({
        accountId: "account-1",
        repository,
      }),
    ).resolves.toMatchObject([
      {
        label: "Hand receipt created",
        targetLabel: "Alpha property book",
      },
    ]);
  });

  it("passes target filters to the repository for contextual activity", async () => {
    const { repository, getReceivedTarget } = createRecordingRepository();

    await listTargetActivity({
      accountId: "account-1",
      repository,
      targetId: "receipt-1",
      targetType: "hand_receipt",
    });

    expect(getReceivedTarget()).toEqual({
      targetId: "receipt-1",
      targetType: "hand_receipt",
    });
  });
});
