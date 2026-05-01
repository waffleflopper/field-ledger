import type {
  HandReceiptRecord,
  HandReceiptStatus,
  NewHandReceiptRecord,
  UpdateHandReceiptRecord,
} from "./types";

export interface HandReceiptRepository {
  create(handReceipt: NewHandReceiptRecord): Promise<HandReceiptRecord>;
  findByAccountId(
    accountId: string,
    options?: { status?: HandReceiptStatus },
  ): Promise<HandReceiptRecord[]>;
  findById(
    accountId: string,
    handReceiptId: string,
  ): Promise<HandReceiptRecord | null>;
  update(
    accountId: string,
    handReceiptId: string,
    updates: UpdateHandReceiptRecord,
  ): Promise<HandReceiptRecord | null>;
  countActiveByAccountId(accountId: string): Promise<number>;
}

export function createUnavailableHandReceiptRepository(): HandReceiptRepository {
  return {
    async create() {
      throw new Error("An authenticated database session is required.");
    },
    async findByAccountId() {
      throw new Error("An authenticated database session is required.");
    },
    async findById() {
      throw new Error("An authenticated database session is required.");
    },
    async update() {
      throw new Error("An authenticated database session is required.");
    },
    async countActiveByAccountId() {
      throw new Error("An authenticated database session is required.");
    },
  };
}
