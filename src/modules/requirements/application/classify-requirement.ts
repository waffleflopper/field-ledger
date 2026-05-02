import { isValidDateOnly } from "./date-only";
import type { RequirementUrgency } from "./types";

function parseDateOnly(value: string) {
  if (!isValidDateOnly(value)) {
    throw new Error("Date must use YYYY-MM-DD format.");
  }

  const [year, month, day] = value.split("-").map(Number) as [
    number,
    number,
    number,
  ];

  return Date.UTC(year, month - 1, day);
}

function daysBetween(startDate: string, endDate: string) {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  return Math.round(
    (parseDateOnly(endDate) - parseDateOnly(startDate)) / millisecondsPerDay,
  );
}

export function addDaysToDateOnly(value: string, days: number) {
  const date = new Date(parseDateOnly(value));
  date.setUTCDate(date.getUTCDate() + days);

  return date.toISOString().slice(0, 10);
}

export function classifyRequirement(
  nextDueDate: string,
  today: string,
): RequirementUrgency {
  const daysUntilDue = daysBetween(today, nextDueDate);

  if (daysUntilDue < 0) {
    return "overdue";
  }

  if (daysUntilDue <= 14) {
    return "due_soon";
  }

  if (daysUntilDue <= 30) {
    return "upcoming";
  }

  return "beyond";
}
