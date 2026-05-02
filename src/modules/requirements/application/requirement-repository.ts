import type {
  DashboardRequirementCandidate,
  NewRequirementRecord,
  RequirementIntervalType,
  RequirementRecord,
} from "./types";

export type RequirementUpdateInput = {
  name: string;
  notes: string | null;
  intervalType: RequirementIntervalType;
  intervalValue: number | null;
  nextDueDate: string;
  updatedAt: Date;
};

export type RequirementLifecycleUpdateInput = {
  nextDueDate?: string;
  pausedAt?: Date | null;
  updatedAt: Date;
};

export interface RequirementRepository {
  create(requirement: NewRequirementRecord): Promise<RequirementRecord>;
  findById(
    accountId: string,
    requirementId: string,
  ): Promise<RequirementRecord | null>;
  findByItemId(accountId: string, itemId: string): Promise<RequirementRecord[]>;
  findByName(
    accountId: string,
    itemId: string,
    name: string,
  ): Promise<RequirementRecord | null>;
  findDashboardRequirements(
    accountId: string,
    options: { maxNextDueDate: string },
  ): Promise<DashboardRequirementCandidate[]>;
  update(
    accountId: string,
    requirementId: string,
    input: RequirementUpdateInput,
  ): Promise<RequirementRecord | null>;
  updateNextDueDate(
    accountId: string,
    requirementId: string,
    input: { nextDueDate: string; updatedAt: Date },
  ): Promise<RequirementRecord | null>;
  updateLifecycle(
    accountId: string,
    requirementId: string,
    input: RequirementLifecycleUpdateInput,
  ): Promise<RequirementRecord | null>;
}

export function createUnavailableRequirementRepository(): RequirementRepository {
  return {
    async create() {
      throw new Error("An authenticated database session is required.");
    },
    async findById() {
      throw new Error("An authenticated database session is required.");
    },
    async findByItemId() {
      throw new Error("An authenticated database session is required.");
    },
    async findByName() {
      throw new Error("An authenticated database session is required.");
    },
    async findDashboardRequirements() {
      throw new Error("An authenticated database session is required.");
    },
    async update() {
      throw new Error("An authenticated database session is required.");
    },
    async updateNextDueDate() {
      throw new Error("An authenticated database session is required.");
    },
    async updateLifecycle() {
      throw new Error("An authenticated database session is required.");
    },
  };
}
