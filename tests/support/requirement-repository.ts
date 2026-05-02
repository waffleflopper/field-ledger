import type {
  DashboardRequirementCandidate,
  NewRequirementRecord,
  RequirementRecord,
  RequirementRepository,
} from "@/modules/requirements";

export class InMemoryRequirementRepository implements RequirementRepository {
  dashboardRequirements: DashboardRequirementCandidate[] = [];
  requirements: RequirementRecord[] = [];

  constructor(
    requirements: RequirementRecord[] = [],
    dashboardRequirements: DashboardRequirementCandidate[] = [],
  ) {
    this.requirements = [...requirements];
    this.dashboardRequirements = [...dashboardRequirements];
  }

  async create(requirement: NewRequirementRecord) {
    const createdRequirement: RequirementRecord = {
      id: requirement.id ?? `requirement-${this.requirements.length + 1}`,
      createdAt: requirement.createdAt ?? new Date(),
      updatedAt: requirement.updatedAt ?? new Date(),
      ...requirement,
      notes: requirement.notes ?? null,
      pausedAt: requirement.pausedAt ?? null,
    };

    this.requirements.push(createdRequirement);
    return createdRequirement;
  }

  async findById(accountId: string, requirementId: string) {
    return (
      this.requirements.find(
        (requirement) =>
          requirement.accountId === accountId &&
          requirement.id === requirementId,
      ) ?? null
    );
  }

  async findByItemId(accountId: string, itemId: string) {
    return this.requirements.filter(
      (requirement) =>
        requirement.accountId === accountId &&
        requirement.itemId === itemId &&
        requirement.status === "active",
    );
  }

  async findByName(accountId: string, itemId: string, name: string) {
    const normalizedName = name.trim().toLowerCase();

    return (
      this.requirements.find(
        (requirement) =>
          requirement.accountId === accountId &&
          requirement.itemId === itemId &&
          requirement.status === "active" &&
          requirement.name.toLowerCase() === normalizedName,
      ) ?? null
    );
  }

  async findDashboardRequirements(
    accountId: string,
    options: { maxNextDueDate: string },
  ) {
    return this.dashboardRequirements.filter(
      (requirement) =>
        requirement.nextDueDate <= options.maxNextDueDate &&
        this.requirements.some(
          (record) =>
            record.accountId === accountId &&
            record.id === requirement.requirementId &&
            record.status === "active" &&
            record.pausedAt === null,
        ),
    );
  }

  async updateNextDueDate(
    accountId: string,
    requirementId: string,
    input: { nextDueDate: string; updatedAt: Date },
  ) {
    const index = this.requirements.findIndex(
      (requirement) =>
        requirement.accountId === accountId && requirement.id === requirementId,
    );

    if (index === -1) {
      return null;
    }

    const existing = this.requirements[index];

    if (!existing) {
      return null;
    }

    const updated = {
      ...existing,
      nextDueDate: input.nextDueDate,
      updatedAt: input.updatedAt,
    };

    this.requirements[index] = updated;
    return updated;
  }

  async update(
    accountId: string,
    requirementId: string,
    input: {
      name: string;
      notes: string | null;
      intervalType: RequirementRecord["intervalType"];
      intervalValue: number | null;
      nextDueDate: string;
      updatedAt: Date;
    },
  ) {
    const index = this.requirements.findIndex(
      (requirement) =>
        requirement.accountId === accountId && requirement.id === requirementId,
    );

    if (index === -1) {
      return null;
    }

    const existing = this.requirements[index];

    if (!existing) {
      return null;
    }

    const updated = {
      ...existing,
      ...input,
    };

    this.requirements[index] = updated;
    return updated;
  }

  async updateLifecycle(
    accountId: string,
    requirementId: string,
    input: {
      nextDueDate?: string;
      pausedAt?: Date | null;
      updatedAt: Date;
    },
  ) {
    const index = this.requirements.findIndex(
      (requirement) =>
        requirement.accountId === accountId && requirement.id === requirementId,
    );

    if (index === -1) {
      return null;
    }

    const existing = this.requirements[index];

    if (!existing) {
      return null;
    }

    const updated = {
      ...existing,
      ...("nextDueDate" in input ? { nextDueDate: input.nextDueDate } : {}),
      ...("pausedAt" in input ? { pausedAt: input.pausedAt } : {}),
      updatedAt: input.updatedAt,
    };

    this.requirements[index] = updated;
    return updated;
  }
}

export function createEmptyRequirementRepository() {
  return new InMemoryRequirementRepository();
}
