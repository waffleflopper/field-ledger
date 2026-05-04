import type {
  AssignmentItemLinkRecord,
  AssignmentItemLinkRepository,
  AssignmentStatus,
  CoverageHistoryEntry,
  NewAssignmentItemLinkRecord,
} from "@/modules/assignments-2062";

type AssignmentLinkContext = Pick<
  CoverageHistoryEntry,
  | "assignmentId"
  | "handReceiptId"
  | "handReceiptName"
  | "contactId"
  | "contactName"
  | "documentId"
  | "documentFilename"
>;

function compareLinksByRecency(
  left: Pick<AssignmentItemLinkRecord, "closedAt" | "createdAt" | "updatedAt">,
  right: Pick<AssignmentItemLinkRecord, "closedAt" | "createdAt" | "updatedAt">,
) {
  const closedDelta =
    (right.closedAt?.getTime() ?? Number.NEGATIVE_INFINITY) -
    (left.closedAt?.getTime() ?? Number.NEGATIVE_INFINITY);

  if (closedDelta !== 0) {
    return closedDelta;
  }

  const updatedDelta = right.updatedAt.getTime() - left.updatedAt.getTime();

  if (updatedDelta !== 0) {
    return updatedDelta;
  }

  return right.createdAt.getTime() - left.createdAt.getTime();
}

export class InMemoryAssignmentItemLinkRepository implements AssignmentItemLinkRepository {
  links: AssignmentItemLinkRecord[] = [];
  assignmentContexts: AssignmentLinkContext[] = [];

  constructor(
    links: AssignmentItemLinkRecord[] = [],
    assignmentContexts: AssignmentLinkContext[] = [],
  ) {
    this.links = [...links];
    this.assignmentContexts = [...assignmentContexts];
  }

  async create(link: NewAssignmentItemLinkRecord) {
    const existingActive = this.links.find(
      (candidate) =>
        candidate.accountId === link.accountId &&
        candidate.itemId === link.itemId &&
        candidate.status === "active" &&
        link.status === "active",
    );

    if (existingActive) {
      const error = new Error("Active assignment item link already exists.");
      Object.assign(error, {
        constraint: "assignment_item_links_one_active_item_idx",
      });
      throw error;
    }

    const created: AssignmentItemLinkRecord = {
      createdAt: link.createdAt ?? new Date(),
      updatedAt: link.updatedAt ?? new Date(),
      ...link,
    };

    this.links.push(created);
    return created;
  }

  async findById(accountId: string, linkId: string) {
    return (
      this.links.find(
        (link) => link.accountId === accountId && link.id === linkId,
      ) ?? null
    );
  }

  async findActiveByItemId(accountId: string, itemId: string) {
    return (
      this.links.find(
        (link) =>
          link.accountId === accountId &&
          link.itemId === itemId &&
          link.status === "active",
      ) ?? null
    );
  }

  async findByItemId(
    accountId: string,
    itemId: string,
    options: { status?: AssignmentStatus } = {},
  ) {
    return this.links
      .filter((link) => link.accountId === accountId && link.itemId === itemId)
      .filter(
        (link) =>
          options.status === undefined || link.status === options.status,
      )
      .sort(compareLinksByRecency);
  }

  async findByItemIdWithAssignment(
    accountId: string,
    itemId: string,
    options: { status?: AssignmentStatus } = {},
  ) {
    return this.links
      .filter((link) => link.accountId === accountId && link.itemId === itemId)
      .filter(
        (link) =>
          options.status === undefined || link.status === options.status,
      )
      .map((link): CoverageHistoryEntry | null => {
        const context = this.assignmentContexts.find(
          (assignmentContext) =>
            assignmentContext.assignmentId === link.assignmentId,
        );

        if (!context) {
          return null;
        }

        return {
          linkId: link.id,
          assignmentId: link.assignmentId,
          itemId: link.itemId,
          status: link.status,
          closedAt: link.closedAt,
          createdAt: link.createdAt,
          updatedAt: link.updatedAt,
          handReceiptId: context.handReceiptId,
          handReceiptName: context.handReceiptName,
          contactId: context.contactId,
          contactName: context.contactName,
          documentId: context.documentId,
          documentFilename: context.documentFilename,
        };
      })
      .filter((entry): entry is CoverageHistoryEntry => Boolean(entry))
      .sort((left, right) => {
        if (left.status !== right.status) {
          return left.status === "active" ? -1 : 1;
        }

        return compareLinksByRecency(left, right);
      });
  }

  async findByAssignmentId(
    accountId: string,
    assignmentId: string,
    options: { status?: AssignmentStatus } = {},
  ) {
    return this.links
      .filter(
        (link) =>
          link.accountId === accountId && link.assignmentId === assignmentId,
      )
      .filter(
        (link) =>
          options.status === undefined || link.status === options.status,
      );
  }

  async countActiveByAssignmentIds(accountId: string, assignmentIds: string[]) {
    const assignmentIdSet = new Set(assignmentIds);
    const counts = new Map<string, number>();

    for (const link of this.links) {
      if (
        link.accountId !== accountId ||
        link.status !== "active" ||
        !assignmentIdSet.has(link.assignmentId)
      ) {
        continue;
      }

      counts.set(link.assignmentId, (counts.get(link.assignmentId) ?? 0) + 1);
    }

    return counts;
  }

  async updateStatus(
    accountId: string,
    linkId: string,
    status: AssignmentStatus,
    updatedAt: Date,
    closedAt: Date | null = null,
  ) {
    const index = this.links.findIndex(
      (link) => link.accountId === accountId && link.id === linkId,
    );

    if (index === -1) {
      return null;
    }

    const existing = this.links[index];

    if (!existing) {
      return null;
    }

    if (status === "active") {
      const existingActive = this.links.find(
        (candidate) =>
          candidate.id !== linkId &&
          candidate.accountId === accountId &&
          candidate.itemId === existing.itemId &&
          candidate.status === "active",
      );

      if (existingActive) {
        const error = new Error("Active assignment item link already exists.");
        Object.assign(error, {
          constraint: "assignment_item_links_one_active_item_idx",
        });
        throw error;
      }
    }

    const updated: AssignmentItemLinkRecord = {
      ...existing,
      status,
      updatedAt,
      closedAt,
    };
    this.links[index] = updated;
    return updated;
  }
}

export function createEmptyAssignmentItemLinkRepository() {
  return new InMemoryAssignmentItemLinkRepository();
}
