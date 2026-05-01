import type { NewRequirementRecord, RequirementRecord } from "./types";

export interface RequirementRepository {
  create(requirement: NewRequirementRecord): Promise<RequirementRecord>;
  findByItemId(accountId: string, itemId: string): Promise<RequirementRecord[]>;
  findByName(
    accountId: string,
    itemId: string,
    name: string,
  ): Promise<RequirementRecord | null>;
}

export function createUnavailableRequirementRepository(): RequirementRepository {
  return {
    async create() {
      throw new Error("An authenticated database session is required.");
    },
    async findByItemId() {
      throw new Error("An authenticated database session is required.");
    },
    async findByName() {
      throw new Error("An authenticated database session is required.");
    },
  };
}
