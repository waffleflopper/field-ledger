import { describe, expect, it } from "vitest";

import { recordAuditEvent } from "@/modules/audit";
import { InMemoryAuditRepository } from "../../support/audit-repository";

describe("recordAuditEvent", () => {
  it("records an account-owned audit event with actor, action, target, timestamp, and metadata", async () => {
    const repository = new InMemoryAuditRepository();
    const occurredAt = new Date("2026-04-29T12:00:00.000Z");

    const event = await recordAuditEvent({
      accountId: "account-1",
      actorId: "user-1",
      action: "system.initialized",
      target: {
        type: "account",
        id: "account-1",
      },
      metadata: {
        source: "test",
      },
      occurredAt,
      repository,
    });

    expect(event).toMatchObject({
      accountId: "account-1",
      actorId: "user-1",
      action: "system.initialized",
      targetType: "account",
      targetId: "account-1",
      metadata: {
        source: "test",
      },
      occurredAt,
    });
    expect(repository.events).toHaveLength(1);
  });
});
