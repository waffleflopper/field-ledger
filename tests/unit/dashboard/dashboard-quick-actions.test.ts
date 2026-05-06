import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DashboardQuickActions } from "@/modules/dashboard/ui/dashboard-quick-actions";

function hrefFor(markup: string, label: string) {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const anchors = markup.matchAll(/<a[^>]*href="([^"]+)"[^>]*>[\s\S]*?<\/a>/g);

  for (const anchor of anchors) {
    if (new RegExp(escapedLabel).test(anchor[0])) {
      return anchor[1];
    }
  }

  return "";
}

describe("DashboardQuickActions", () => {
  it("renders write-oriented quick actions for active accounts", () => {
    const markup = renderToStaticMarkup(
      createElement(DashboardQuickActions, { isReadOnly: false }),
    );

    expect(markup).toContain("Common actions");
    expect(markup).toContain("Add property item");
    expect(markup).toContain("Find an item");
    expect(markup).toContain("Review active 2062s");
    expect(markup).toContain("Archived receipts");
    expect(hrefFor(markup, "Add property item")).toBe("/app/hand-receipts");
    expect(hrefFor(markup, "Find an item")).toBe("/app/items");
    expect(hrefFor(markup, "Review active 2062s")).toBe("/app/active-2062s");
    expect(hrefFor(markup, "Archived receipts")).toBe(
      "/app/hand-receipts?view=archived",
    );
  });

  it("hides write-oriented quick actions for read-only accounts", () => {
    const markup = renderToStaticMarkup(
      createElement(DashboardQuickActions, { isReadOnly: true }),
    );

    expect(markup).not.toContain("Common actions");
    expect(markup).not.toContain("Add property item");
    expect(markup).not.toContain("Find an item");
    expect(markup).not.toContain("Review active 2062s");
    expect(markup).not.toContain("Archived receipts");
  });
});
