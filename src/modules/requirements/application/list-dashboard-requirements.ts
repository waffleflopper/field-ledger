import { addDaysToDateOnly, classifyRequirement } from "./classify-requirement";
import { toLocalDateOnly } from "./date-only";
import type { RequirementRepository } from "./requirement-repository";
import type {
  DashboardRequirementRow,
  DashboardRequirementsResult,
} from "./types";

export type ListDashboardRequirementsInput = {
  accountId: string;
  repository: RequirementRepository;
  today?: string;
};

export async function listDashboardRequirements({
  accountId,
  repository,
  today = toLocalDateOnly(new Date()),
}: ListDashboardRequirementsInput): Promise<DashboardRequirementsResult> {
  const candidates = await repository.findDashboardRequirements(accountId, {
    maxNextDueDate: addDaysToDateOnly(today, 30),
  });
  const result: DashboardRequirementsResult = {
    overdue: [],
    dueSoon: [],
    upcoming: [],
  };

  for (const candidate of candidates) {
    const urgency = classifyRequirement(candidate.nextDueDate, today);

    if (urgency === "beyond") {
      continue;
    }

    const row: DashboardRequirementRow = {
      ...candidate,
      urgency,
    };

    if (urgency === "overdue") {
      result.overdue.push(row);
    } else if (urgency === "due_soon") {
      result.dueSoon.push(row);
    } else {
      result.upcoming.push(row);
    }
  }

  return result;
}
