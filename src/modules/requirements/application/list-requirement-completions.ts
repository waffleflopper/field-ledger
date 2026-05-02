import type { RequirementCompletionRepository } from "./requirement-completion-repository";

type ListRequirementCompletionsInput = {
  accountId: string;
  requirementId: string;
  repository: RequirementCompletionRepository;
  limit?: number;
};

export async function listRequirementCompletions({
  accountId,
  requirementId,
  repository,
  limit = 10,
}: ListRequirementCompletionsInput) {
  return repository.listByRequirementId(accountId, requirementId, { limit });
}
