import type { RequirementIntervalType } from "./types";

const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDateOnly(value: string) {
  if (!dateOnlyPattern.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);

  if (year === undefined || month === undefined || day === undefined) {
    return false;
  }

  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function toDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function toLocalDateOnly(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDateOnly(value: string) {
  if (!isValidDateOnly(value)) {
    throw new Error("Date must use YYYY-MM-DD format.");
  }

  const [year, month, day] = value.split("-").map(Number) as [
    number,
    number,
    number,
  ];

  return new Date(Date.UTC(year, month - 1, day));
}

function daysInMonth(year: number, monthIndex: number) {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function addMonths(date: Date, months: number) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const targetMonthIndex = month + months;
  const targetMonthStart = new Date(Date.UTC(year, targetMonthIndex, 1));
  const clampedDay = Math.min(
    day,
    daysInMonth(
      targetMonthStart.getUTCFullYear(),
      targetMonthStart.getUTCMonth(),
    ),
  );

  return new Date(
    Date.UTC(
      targetMonthStart.getUTCFullYear(),
      targetMonthStart.getUTCMonth(),
      clampedDay,
    ),
  );
}

export function calculateNextDueDate(
  completedOn: string,
  interval: {
    intervalType: RequirementIntervalType;
    intervalValue: number | null;
  },
) {
  const completedDate = parseDateOnly(completedOn);

  switch (interval.intervalType) {
    case "weekly":
      return toDateOnly(addDays(completedDate, 7));
    case "monthly":
      return toDateOnly(addMonths(completedDate, 1));
    case "quarterly":
      return toDateOnly(addMonths(completedDate, 3));
    case "semiannual":
      return toDateOnly(addMonths(completedDate, 6));
    case "annual":
      return toDateOnly(addMonths(completedDate, 12));
    case "custom_days":
      if (
        !Number.isInteger(interval.intervalValue) ||
        (interval.intervalValue ?? 0) < 1
      ) {
        throw new Error(
          "Custom requirement intervals need a positive whole number.",
        );
      }

      return toDateOnly(
        addDays(completedDate, interval.intervalValue as number),
      );
    case "custom_months":
      if (
        !Number.isInteger(interval.intervalValue) ||
        (interval.intervalValue ?? 0) < 1
      ) {
        throw new Error(
          "Custom requirement intervals need a positive whole number.",
        );
      }

      return toDateOnly(
        addMonths(completedDate, interval.intervalValue as number),
      );
  }
}
