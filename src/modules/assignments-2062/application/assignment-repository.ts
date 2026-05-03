import type {
  AssignmentRecord,
  AssignmentStatus,
  NewAssignmentRecord,
} from "./types";

export interface AssignmentRepository {
  create(assignment: NewAssignmentRecord): Promise<AssignmentRecord>;
  findById(
    accountId: string,
    assignmentId: string,
  ): Promise<AssignmentRecord | null>;
  findByAccountId(
    accountId: string,
    options?: { status?: AssignmentStatus },
  ): Promise<AssignmentRecord[]>;
  findByHandReceiptId(
    accountId: string,
    handReceiptId: string,
    options?: { status?: AssignmentStatus },
  ): Promise<AssignmentRecord[]>;
  updateStatus(
    accountId: string,
    assignmentId: string,
    status: AssignmentStatus,
    updatedAt: Date,
  ): Promise<AssignmentRecord | null>;
}

export function createUnavailableAssignmentRepository(): AssignmentRepository {
  return {
    async create() {
      throw new Error("An authenticated database session is required.");
    },
    async findById() {
      throw new Error("An authenticated database session is required.");
    },
    async findByAccountId() {
      throw new Error("An authenticated database session is required.");
    },
    async findByHandReceiptId() {
      throw new Error("An authenticated database session is required.");
    },
    async updateStatus() {
      throw new Error("An authenticated database session is required.");
    },
  };
}
