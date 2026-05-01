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
  intervalType: RequirementIntervalType;
  intervalValue: number | null;
  nextDueDate: string;
  status: RequirementStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type NewRequirementRecord = Omit<
  RequirementRecord,
  "id" | "createdAt" | "updatedAt"
> & {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
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
