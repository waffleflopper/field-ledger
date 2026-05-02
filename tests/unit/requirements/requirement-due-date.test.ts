import { describe, expect, it } from "vitest";

import { calculateNextDueDate } from "@/modules/requirements";

describe("calculateNextDueDate", () => {
  it("calculates preset intervals from the entered completion date", () => {
    expect(
      calculateNextDueDate("2026-05-01", {
        intervalType: "weekly",
        intervalValue: null,
      }),
    ).toBe("2026-05-08");
    expect(
      calculateNextDueDate("2026-05-01", {
        intervalType: "monthly",
        intervalValue: null,
      }),
    ).toBe("2026-06-01");
    expect(
      calculateNextDueDate("2026-05-01", {
        intervalType: "quarterly",
        intervalValue: null,
      }),
    ).toBe("2026-08-01");
    expect(
      calculateNextDueDate("2026-05-01", {
        intervalType: "semiannual",
        intervalValue: null,
      }),
    ).toBe("2026-11-01");
    expect(
      calculateNextDueDate("2026-05-01", {
        intervalType: "annual",
        intervalValue: null,
      }),
    ).toBe("2027-05-01");
  });

  it("calculates custom intervals and clamps month-end dates", () => {
    expect(
      calculateNextDueDate("2026-05-01", {
        intervalType: "custom_days",
        intervalValue: 45,
      }),
    ).toBe("2026-06-15");
    expect(
      calculateNextDueDate("2026-01-31", {
        intervalType: "custom_months",
        intervalValue: 1,
      }),
    ).toBe("2026-02-28");
    expect(
      calculateNextDueDate("2028-02-29", {
        intervalType: "annual",
        intervalValue: null,
      }),
    ).toBe("2029-02-28");
  });
});
