import type {
  AssignmentItemLinkRecord,
  AssignmentStatus,
  CoverageHistoryEntry,
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
  findByItemId(
    accountId: string,
    itemId: string,
    options?: { status?: AssignmentStatus },
  ): Promise<AssignmentItemLinkRecord[]>;
  findByItemIdWithAssignment(
    accountId: string,
    itemId: string,
    options?: { status?: AssignmentStatus },
  ): Promise<CoverageHistoryEntry[]>;
  findByAssignmentId(
    accountId: string,
    assignmentId: string,
    options?: { status?: AssignmentStatus },
  ): Promise<AssignmentItemLinkRecord[]>;
  countActiveByAssignmentIds(
    accountId: string,
    assignmentIds: string[],
  ): Promise<Map<string, number>>;
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
    async findByItemId() {
      throw new Error("An authenticated database session is required.");
    },
    async findByItemIdWithAssignment() {
      throw new Error("An authenticated database session is required.");
    },
    async findByAssignmentId() {
      throw new Error("An authenticated database session is required.");
    },
    async countActiveByAssignmentIds() {
      throw new Error("An authenticated database session is required.");
    },
    async updateStatus() {
      throw new Error("An authenticated database session is required.");
    },
  };
}
