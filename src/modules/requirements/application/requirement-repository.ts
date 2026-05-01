import type { NewRequirementRecord, RequirementRecord } from "./types";

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
  updateNextDueDate(
    accountId: string,
    requirementId: string,
    input: { nextDueDate: string; updatedAt: Date },
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
    async updateNextDueDate() {
      throw new Error("An authenticated database session is required.");
    },
  };
}
