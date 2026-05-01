import type {
  NewRequirementCompletionRecord,
  RequirementCompletionRecord,
} from "./types";

export interface RequirementCompletionRepository {
  create(
    completion: NewRequirementCompletionRecord,
  ): Promise<RequirementCompletionRecord>;
  listByRequirementId(
    accountId: string,
    requirementId: string,
    options?: { limit?: number },
  ): Promise<RequirementCompletionRecord[]>;
}

export function createUnavailableRequirementCompletionRepository(): RequirementCompletionRepository {
  return {
    async create() {
      throw new Error("An authenticated database session is required.");
    },
    async listByRequirementId() {
      throw new Error("An authenticated database session is required.");
    },
  };
}
