export const requirementIntervalTypes = [
  "weekly",
  "monthly",
  "quarterly",
  "semiannual",
  "annual",
  "custom_days",
  "custom_months",
] as const;

export const presetRequirementIntervalTypes = [
  "weekly",
  "monthly",
  "quarterly",
  "semiannual",
  "annual",
] as const;

export type RequirementIntervalType = (typeof requirementIntervalTypes)[number];

export type PresetRequirementIntervalType =
  (typeof presetRequirementIntervalTypes)[number];

export type RequirementStatus = "active";

export type RequirementRecord = {
  id: string;
  accountId: string;
  itemId: string;
  name: string;
  notes: string | null;
  intervalType: RequirementIntervalType;
  intervalValue: number | null;
  nextDueDate: string;
  status: RequirementStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type NewRequirementRecord = Omit<
  RequirementRecord,
  "id" | "notes" | "createdAt" | "updatedAt"
> & {
  id?: string;
  notes?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export type RequirementCompletionRecord = {
  id: string;
  accountId: string;
  requirementId: string;
  completedOn: string;
  notes: string | null;
  createdAt: Date;
};

export type NewRequirementCompletionRecord = Omit<
  RequirementCompletionRecord,
  "id" | "createdAt"
> & {
  id?: string;
  createdAt?: Date;
};

export type CreateRequirementResult =
  | {
      requirement: RequirementRecord;
      duplicateWarning?: never;
    }
  | {
      requirement?: never;
      duplicateWarning: {
        hasDuplicate: true;
        existingRequirement: RequirementRecord;
      };
    };

export type UpdateRequirementResult = {
  requirement: RequirementRecord;
  duplicateWarning: boolean;
};

export function isRequirementIntervalType(
  value: string,
): value is RequirementIntervalType {
  return requirementIntervalTypes.includes(value as RequirementIntervalType);
}

export function isPresetRequirementIntervalType(
  value: RequirementIntervalType,
): value is PresetRequirementIntervalType {
  return presetRequirementIntervalTypes.includes(
    value as PresetRequirementIntervalType,
  );
}
