import type {
  AuditEventRecord,
  AuditRepository,
  NewAuditEventRecord,
} from "@/modules/audit";

export class InMemoryAuditRepository implements AuditRepository {
  events: AuditEventRecord[] = [];

  constructor(events: AuditEventRecord[] = []) {
    this.events = [...events];
  }

  async record(event: NewAuditEventRecord) {
    const createdEvent = {
      id: `event-${this.events.length + 1}`,
      createdAt: event.createdAt ?? event.occurredAt,
      ...event,
    };

    this.events.push(createdEvent);
    return createdEvent;
  }

  async listByAccountId(accountId: string, options = {}) {
    const { limit = 20 } = options as { limit?: number };

    return this.events
      .filter((event) => event.accountId === accountId)
      .sort(
        (left, right) => right.occurredAt.getTime() - left.occurredAt.getTime(),
      )
      .slice(0, limit);
  }

  async listByTarget(
    accountId: string,
    target: { targetType: string; targetId: string },
    options = {},
  ) {
    const { limit = 20 } = options as { limit?: number };

    return this.events
      .filter(
        (event) =>
          event.accountId === accountId &&
          event.targetType === target.targetType &&
          event.targetId === target.targetId,
      )
      .sort(
        (left, right) => right.occurredAt.getTime() - left.occurredAt.getTime(),
      )
      .slice(0, limit);
  }
}

export function createEmptyAuditRepository() {
  return new InMemoryAuditRepository();
}
