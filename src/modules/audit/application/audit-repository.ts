import type { AuditEventRecord, NewAuditEventRecord } from "./types";

export type ListAuditEventsOptions = {
  limit?: number;
};

export interface AuditRepository {
  record(event: NewAuditEventRecord): Promise<AuditEventRecord>;
  listByAccountId(
    accountId: string,
    options?: ListAuditEventsOptions,
  ): Promise<AuditEventRecord[]>;
}

export function createUnavailableAuditRepository(): AuditRepository {
  return {
    async record() {
      throw new Error("An authenticated database session is required.");
    },
    async listByAccountId() {
      throw new Error("An authenticated database session is required.");
    },
  };
}
