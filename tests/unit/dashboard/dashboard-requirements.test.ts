import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DashboardRequirements } from "@/modules/requirements/ui/dashboard-requirements";
import type { DashboardRequirementRow } from "@/modules/requirements";

const upcomingRequirement: DashboardRequirementRow = {
  handReceiptId: "receipt-1",
  handReceiptName: "Very long hand receipt name that should not break layout",
  itemId: "item-1",
  itemNomenclature: "Dashboard radio with a long nomenclature",
  nextDueDate: "2026-05-20",
  requirementId: "requirement-1",
  requirementName: "Quarterly service",
  urgency: "upcoming",
};

describe("DashboardRequirements", () => {
  it("keeps every dashboard window visible when only one window has work", () => {
    const markup = renderToStaticMarkup(
      createElement(DashboardRequirements, {
        dueSoon: [],
        isReadOnly: false,
        overdue: [],
        upcoming: [upcomingRequirement],
      }),
    );

    expect(markup).toContain("Overdue");
    expect(markup).toContain("Due Soon");
    expect(markup).toContain("Plan Ahead");
    expect(markup).toContain("No active requirement work in this window.");
    expect(markup).toContain("Quarterly service");
  });

  it("falls back cleanly when a row date cannot be formatted", () => {
    const markup = renderToStaticMarkup(
      createElement(DashboardRequirements, {
        dueSoon: [{ ...upcomingRequirement, nextDueDate: "not-a-date" }],
        isReadOnly: false,
        overdue: [],
        upcoming: [],
      }),
    );

    expect(markup).toContain("Date unavailable");
  });
});
