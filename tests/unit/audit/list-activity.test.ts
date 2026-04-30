import { describe, expect, it } from "vitest";

import { listRecentActivity, MAX_RECENT_ACTIVITY_LIMIT } from "@/modules/audit";
import type { AuditRepository } from "@/modules/audit";

function createRecordingRepository() {
  let receivedLimit: number | undefined;

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
  };

  return {
    repository,
    getReceivedLimit: () => receivedLimit,
  };
}

describe("listRecentActivity", () => {
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
});
