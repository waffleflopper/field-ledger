import type { RequirementRepository } from "./requirement-repository";

type ListRequirementsInput = {
  accountId: string;
  itemId: string;
  repository: RequirementRepository;
};

export async function listRequirements({
  accountId,
  itemId,
  repository,
}: ListRequirementsInput) {
  const requirements = await repository.findByItemId(accountId, itemId);

  return requirements.toSorted((left, right) =>
    left.nextDueDate.localeCompare(right.nextDueDate),
  );
}
