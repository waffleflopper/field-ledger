import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DashboardQuickActions } from "@/modules/dashboard/ui/dashboard-quick-actions";

describe("DashboardQuickActions", () => {
  it("renders write-oriented quick actions for active accounts", () => {
    const markup = renderToStaticMarkup(
      createElement(DashboardQuickActions, { isReadOnly: false }),
    );

    expect(markup).toContain("Quick Actions");
    expect(markup).toContain("Add item");
    expect(markup).toContain("Upload 2062");
    expect(markup).toContain("/app/hand-receipts");
  });

  it("hides write-oriented quick actions for read-only accounts", () => {
    const markup = renderToStaticMarkup(
      createElement(DashboardQuickActions, { isReadOnly: true }),
    );

    expect(markup).not.toContain("Quick Actions");
    expect(markup).not.toContain("Add item");
    expect(markup).not.toContain("Upload 2062");
  });
});
