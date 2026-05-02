import type {
  NewRequirementCompletionRecord,
  RequirementCompletionRecord,
  RequirementCompletionRepository,
} from "@/modules/requirements";

export class InMemoryRequirementCompletionRepository implements RequirementCompletionRepository {
  completions: RequirementCompletionRecord[] = [];

  constructor(completions: RequirementCompletionRecord[] = []) {
    this.completions = [...completions];
  }

  async create(completion: NewRequirementCompletionRecord) {
    const createdCompletion: RequirementCompletionRecord = {
      id: completion.id ?? `completion-${this.completions.length + 1}`,
      createdAt: completion.createdAt ?? new Date(),
      ...completion,
    };

    this.completions.push(createdCompletion);
    return createdCompletion;
  }

  async listByRequirementId(accountId: string, requirementId: string) {
    return this.completions
      .filter(
        (completion) =>
          completion.accountId === accountId &&
          completion.requirementId === requirementId,
      )
      .sort((left, right) => {
        const completedSort = right.completedOn.localeCompare(left.completedOn);

        if (completedSort !== 0) {
          return completedSort;
        }

        return right.createdAt.getTime() - left.createdAt.getTime();
      });
  }

  async findLatestByRequirementId(accountId: string, requirementId: string) {
    return (
      (await this.listByRequirementId(accountId, requirementId))[0] ?? null
    );
  }
}
