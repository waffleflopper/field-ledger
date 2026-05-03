import type {
  AssignmentRecord,
  AssignmentRepository,
  AssignmentStatus,
  NewAssignmentRecord,
} from "@/modules/assignments-2062";

export class InMemoryAssignmentRepository implements AssignmentRepository {
  assignments: AssignmentRecord[] = [];

  constructor(assignments: AssignmentRecord[] = []) {
    this.assignments = [...assignments];
  }

  async create(assignment: NewAssignmentRecord) {
    const created: AssignmentRecord = {
      contactName: null,
      documentFilename: null,
      createdAt: assignment.createdAt ?? new Date(),
      updatedAt: assignment.updatedAt ?? new Date(),
      ...assignment,
    };

    this.assignments.push(created);
    return created;
  }

  async findById(accountId: string, assignmentId: string) {
    return (
      this.assignments.find(
        (assignment) =>
          assignment.accountId === accountId && assignment.id === assignmentId,
      ) ?? null
    );
  }

  async findByAccountId(
    accountId: string,
    options: { status?: AssignmentStatus } = {},
  ) {
    return this.assignments
      .filter((assignment) => assignment.accountId === accountId)
      .filter(
        (assignment) =>
          options.status === undefined || assignment.status === options.status,
      );
  }

  async findByHandReceiptId(
    accountId: string,
    handReceiptId: string,
    options: { status?: AssignmentStatus } = {},
  ) {
    return this.findByAccountId(accountId, options).then((assignments) =>
      assignments.filter(
        (assignment) => assignment.handReceiptId === handReceiptId,
      ),
    );
  }

  async updateStatus(
    accountId: string,
    assignmentId: string,
    status: AssignmentStatus,
    updatedAt: Date,
  ) {
    const index = this.assignments.findIndex(
      (assignment) =>
        assignment.accountId === accountId && assignment.id === assignmentId,
    );

    if (index === -1) {
      return null;
    }

    const existing = this.assignments[index];

    if (!existing) {
      return null;
    }

    const updated: AssignmentRecord = { ...existing, status, updatedAt };
    this.assignments[index] = updated;
    return updated;
  }
}

export function createEmptyAssignmentRepository() {
  return new InMemoryAssignmentRepository();
}
