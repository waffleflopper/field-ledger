import type {
  NewRequirementRecord,
  RequirementRecord,
  RequirementRepository,
} from "@/modules/requirements";

export class InMemoryRequirementRepository implements RequirementRepository {
  requirements: RequirementRecord[] = [];

  constructor(requirements: RequirementRecord[] = []) {
    this.requirements = [...requirements];
  }

  async create(requirement: NewRequirementRecord) {
    const createdRequirement: RequirementRecord = {
      id: requirement.id ?? `requirement-${this.requirements.length + 1}`,
      createdAt: requirement.createdAt ?? new Date(),
      updatedAt: requirement.updatedAt ?? new Date(),
      ...requirement,
    };

    this.requirements.push(createdRequirement);
    return createdRequirement;
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
}

export function createEmptyRequirementRepository() {
  return new InMemoryRequirementRepository();
}
