import type {
  AssignmentItemLinkRecord,
  AssignmentItemLinkRepository,
  AssignmentStatus,
  NewAssignmentItemLinkRecord,
} from "@/modules/assignments-2062";

export class InMemoryAssignmentItemLinkRepository implements AssignmentItemLinkRepository {
  links: AssignmentItemLinkRecord[] = [];

  constructor(links: AssignmentItemLinkRecord[] = []) {
    this.links = [...links];
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
      .sort((left, right) => {
        const leftTime = left.closedAt?.getTime() ?? left.updatedAt.getTime();
        const rightTime =
          right.closedAt?.getTime() ?? right.updatedAt.getTime();

        return rightTime - leftTime;
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
