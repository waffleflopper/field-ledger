import type {
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
    async update() {
      throw new Error("An authenticated database session is required.");
    },
    async updateNextDueDate() {
      throw new Error("An authenticated database session is required.");
    },
  };
}
