import { describe, expect, it } from "vitest";

import {
  formatAuditActionLabel,
  listRecentActivity,
  listTargetActivity,
  MAX_RECENT_ACTIVITY_LIMIT,
} from "@/modules/audit";
import type { AuditEventRecord, AuditRepository } from "@/modules/audit";

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

function createActivityRepository(event: AuditEventRecord): AuditRepository {
  return {
    async record(recordedEvent) {
      return {
        id: "event-1",
        createdAt: recordedEvent.createdAt ?? recordedEvent.occurredAt,
        ...recordedEvent,
      };
    },
    async listByAccountId() {
      return [event];
    },
    async listByTarget() {
      return [];
    },
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

  it("returns readable target context from requirement metadata", async () => {
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
            action: "requirement.created",
            targetType: "requirement",
            targetId: "requirement-1",
            occurredAt: new Date("2026-05-01T12:00:00.000Z"),
            metadata: { name: "Monthly PMCS" },
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
        label: "Requirement created",
        targetLabel: "Monthly PMCS",
      },
    ]);
  });

  it("returns readable target context from requirement completion metadata", async () => {
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
            action: "requirement.completed",
            targetType: "requirement",
            targetId: "requirement-1",
            occurredAt: new Date("2026-05-01T12:00:00.000Z"),
            metadata: {
              name: "Monthly PMCS",
              requirementName: "Monthly PMCS",
              completedOn: "2026-05-01",
              nextDueDate: "2026-06-01",
            },
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
        label: "Requirement completed",
        targetLabel: "Monthly PMCS",
      },
    ]);
  });

  it("returns readable target context from 2062 assignment metadata", async () => {
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
            action: "assignment.closed",
            targetType: "assignment",
            targetId: "assignment-1",
            occurredAt: new Date("2026-05-01T12:00:00.000Z"),
            metadata: {
              handReceiptId: "receipt-1",
              contactName: "SPC Rivera",
              documentFilename: "signed-2062.pdf",
            },
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
        label: "2062 assignment closed",
        targetLabel: "SPC Rivera",
      },
    ]);
  });

  it("returns readable target context from contact, document, and location metadata", async () => {
    await expect(
      listRecentActivity({
        accountId: "account-1",
        repository: createActivityRepository({
          id: "event-1",
          accountId: "account-1",
          actorId: "user-1",
          action: "contact.created",
          targetType: "contact",
          targetId: "contact-1",
          occurredAt: new Date("2026-05-01T12:00:00.000Z"),
          metadata: { displayName: "SPC Rivera" },
          createdAt: new Date("2026-05-01T12:00:01.000Z"),
        }),
      }),
    ).resolves.toMatchObject([
      {
        label: "Contact created",
        targetLabel: "SPC Rivera",
      },
    ]);

    await expect(
      listRecentActivity({
        accountId: "account-1",
        repository: createActivityRepository({
          id: "event-2",
          accountId: "account-1",
          actorId: "user-1",
          action: "document.uploaded",
          targetType: "document",
          targetId: "document-1",
          occurredAt: new Date("2026-05-01T12:00:00.000Z"),
          metadata: { filename: "signed-2062.pdf" },
          createdAt: new Date("2026-05-01T12:00:01.000Z"),
        }),
      }),
    ).resolves.toMatchObject([
      {
        label: "Document uploaded",
        targetLabel: "signed-2062.pdf",
      },
    ]);

    await expect(
      listRecentActivity({
        accountId: "account-1",
        repository: createActivityRepository({
          id: "event-3",
          accountId: "account-1",
          actorId: "user-1",
          action: "location.created",
          targetType: "location",
          targetId: "location-1",
          occurredAt: new Date("2026-05-01T12:00:00.000Z"),
          metadata: { name: "Cage 2" },
          createdAt: new Date("2026-05-01T12:00:01.000Z"),
        }),
      }),
    ).resolves.toMatchObject([
      {
        label: "Location created",
        targetLabel: "Cage 2",
      },
    ]);
  });

  it("falls back to readable target type labels without raw ids", async () => {
    await expect(
      listRecentActivity({
        accountId: "account-1",
        repository: createActivityRepository({
          id: "event-1",
          accountId: "account-1",
          actorId: "user-1",
          action: "document.uploaded",
          targetType: "document",
          targetId: "document-1",
          occurredAt: new Date("2026-05-01T12:00:00.000Z"),
          metadata: {},
          createdAt: new Date("2026-05-01T12:00:01.000Z"),
        }),
      }),
    ).resolves.toMatchObject([
      {
        label: "Document uploaded",
        targetLabel: "Document",
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

  it("maps target-scoped activity to readable target labels", async () => {
    const repository: AuditRepository = {
      async record(event) {
        return {
          id: "event-1",
          createdAt: event.createdAt ?? event.occurredAt,
          ...event,
        };
      },
      async listByAccountId() {
        return [];
      },
      async listByTarget() {
        return [
          {
            id: "event-1",
            accountId: "account-1",
            actorId: "user-1",
            action: "hand_receipt.updated",
            targetType: "hand_receipt",
            targetId: "receipt-1",
            occurredAt: new Date("2026-05-01T12:00:00.000Z"),
            metadata: { name: "Alpha property book" },
            createdAt: new Date("2026-05-01T12:00:01.000Z"),
          },
        ];
      },
    };

    await expect(
      listTargetActivity({
        accountId: "account-1",
        repository,
        targetId: "receipt-1",
        targetType: "hand_receipt",
      }),
    ).resolves.toMatchObject([
      {
        label: "Hand receipt updated",
        targetLabel: "Alpha property book",
      },
    ]);
  });
});
