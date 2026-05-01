import type { NewAuditEventRecord } from "@/modules/audit";
import type {
  HandReceiptRecord,
  HandReceiptStatus,
  NewHandReceiptRecord,
  UpdateHandReceiptRecord,
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
  findById(
    accountId: string,
    handReceiptId: string,
  ): Promise<HandReceiptRecord | null>;
  updateWithAuditEvent(
    accountId: string,
    handReceiptId: string,
    updates: UpdateHandReceiptRecord,
    auditEvent: NewAuditEventRecord,
  ): Promise<HandReceiptRecord | null>;
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
    async findById() {
      throw new Error("An authenticated database session is required.");
    },
    async updateWithAuditEvent() {
      throw new Error("An authenticated database session is required.");
    },
    async countActiveByAccountId() {
      throw new Error("An authenticated database session is required.");
    },
  };
}
