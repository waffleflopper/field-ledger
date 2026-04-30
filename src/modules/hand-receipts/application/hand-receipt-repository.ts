import type { NewAuditEventRecord } from "@/modules/audit";
import type {
  HandReceiptRecord,
  HandReceiptStatus,
  NewHandReceiptRecord,
} from "./types";

export interface HandReceiptRepository {
  createWithAuditEvent(
    handReceipt: NewHandReceiptRecord,
    auditEvent: NewAuditEventRecord,
  ): Promise<HandReceiptRecord>;
  findByAccountId(
    accountId: string,
    options?: { status?: HandReceiptStatus },
  ): Promise<HandReceiptRecord[]>;
  countActiveByAccountId(accountId: string): Promise<number>;
}

export function createUnavailableHandReceiptRepository(): HandReceiptRepository {
  return {
    async createWithAuditEvent() {
      throw new Error("An authenticated database session is required.");
    },
    async findByAccountId() {
      throw new Error("An authenticated database session is required.");
    },
    async countActiveByAccountId() {
      throw new Error("An authenticated database session is required.");
    },
  };
}
