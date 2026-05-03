import type {
  AssignmentItemLinkRecord,
  AssignmentStatus,
  NewAssignmentItemLinkRecord,
} from "./types";

export interface AssignmentItemLinkRepository {
  create(link: NewAssignmentItemLinkRecord): Promise<AssignmentItemLinkRecord>;
  findById(
    accountId: string,
    linkId: string,
  ): Promise<AssignmentItemLinkRecord | null>;
  findActiveByItemId(
    accountId: string,
    itemId: string,
  ): Promise<AssignmentItemLinkRecord | null>;
  findByAssignmentId(
    accountId: string,
    assignmentId: string,
    options?: { status?: AssignmentStatus },
  ): Promise<AssignmentItemLinkRecord[]>;
  updateStatus(
    accountId: string,
    linkId: string,
    status: AssignmentStatus,
    updatedAt: Date,
    closedAt?: Date | null,
  ): Promise<AssignmentItemLinkRecord | null>;
}

export function createUnavailableAssignmentItemLinkRepository(): AssignmentItemLinkRepository {
  return {
    async create() {
      throw new Error("An authenticated database session is required.");
    },
    async findById() {
      throw new Error("An authenticated database session is required.");
    },
    async findActiveByItemId() {
      throw new Error("An authenticated database session is required.");
    },
    async findByAssignmentId() {
      throw new Error("An authenticated database session is required.");
    },
    async updateStatus() {
      throw new Error("An authenticated database session is required.");
    },
  };
}
