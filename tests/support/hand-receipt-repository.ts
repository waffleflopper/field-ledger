import type { AuditEventRecord, NewAuditEventRecord } from "@/modules/audit";
import type {
  HandReceiptRecord,
  HandReceiptRepository,
  NewHandReceiptRecord,
  UpdateHandReceiptRecord,
} from "@/modules/hand-receipts";

export class InMemoryHandReceiptRepository implements HandReceiptRepository {
  handReceipts: HandReceiptRecord[] = [];
  auditEvents: AuditEventRecord[] = [];
  failAuditRecording = false;

  constructor(handReceipts: HandReceiptRecord[] = []) {
    this.handReceipts = [...handReceipts];
  }

  private async create(handReceipt: NewHandReceiptRecord) {
    const createdHandReceipt = {
      id: `hand-receipt-${this.handReceipts.length + 1}`,
      createdAt: handReceipt.createdAt ?? new Date(),
      updatedAt: handReceipt.updatedAt ?? new Date(),
      ...handReceipt,
    };

    this.handReceipts.push(createdHandReceipt);
    return createdHandReceipt;
  }

  async createWithAuditEvent(
    handReceipt: NewHandReceiptRecord,
    auditEvent: NewAuditEventRecord,
  ) {
    if (this.failAuditRecording) {
      throw new Error("Audit event was not recorded.");
    }

    const createdHandReceipt = await this.create(handReceipt);
    const createdAuditEvent = {
      id: `event-${this.auditEvents.length + 1}`,
      createdAt: auditEvent.createdAt ?? auditEvent.occurredAt,
      ...auditEvent,
    };

    this.auditEvents.push(createdAuditEvent);
    return createdHandReceipt;
  }

  async findByAccountId(
    accountId: string,
    options: { status?: "active" | "archived" } = {},
  ) {
    return this.handReceipts
      .filter((handReceipt) => handReceipt.accountId === accountId)
      .filter(
        (handReceipt) =>
          options.status === undefined || handReceipt.status === options.status,
      )
      .sort(
        (left, right) => right.createdAt.getTime() - left.createdAt.getTime(),
      );
  }

  async findById(accountId: string, handReceiptId: string) {
    return (
      this.handReceipts.find(
        (handReceipt) =>
          handReceipt.accountId === accountId &&
          handReceipt.id === handReceiptId,
      ) ?? null
    );
  }

  async updateWithAuditEvent(
    accountId: string,
    handReceiptId: string,
    updates: UpdateHandReceiptRecord,
    auditEvent: NewAuditEventRecord,
  ) {
    if (this.failAuditRecording) {
      throw new Error("Audit event was not recorded.");
    }

    const index = this.handReceipts.findIndex(
      (handReceipt) =>
        handReceipt.accountId === accountId && handReceipt.id === handReceiptId,
    );

    if (index === -1) {
      return null;
    }

    const existing = this.handReceipts[index];

    if (!existing) {
      return null;
    }

    const updatedHandReceipt: HandReceiptRecord = {
      ...existing,
      ...updates,
      updatedAt: updates.updatedAt ?? new Date(),
    };

    this.handReceipts[index] = updatedHandReceipt;
    this.auditEvents.push({
      id: `event-${this.auditEvents.length + 1}`,
      createdAt: auditEvent.createdAt ?? auditEvent.occurredAt,
      ...auditEvent,
    });

    return updatedHandReceipt;
  }

  async countActiveByAccountId(accountId: string) {
    return this.handReceipts.filter(
      (handReceipt) =>
        handReceipt.accountId === accountId && handReceipt.status === "active",
    ).length;
  }
}

export function createEmptyHandReceiptRepository() {
  return new InMemoryHandReceiptRepository();
}
