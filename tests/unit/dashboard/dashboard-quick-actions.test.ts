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

    expect(markup).toContain("Quick Actions");
    expect(markup).toContain("Add item");
    expect(markup).toContain("Search items");
    expect(markup).toContain("Review 2062s");
    expect(markup).toContain("Review archived receipts");
    expect(hrefFor(markup, "Add item")).toBe("/app/hand-receipts");
    expect(hrefFor(markup, "Search items")).toBe("/app/items");
    expect(hrefFor(markup, "Review 2062s")).toBe("/app/active-2062s");
    expect(hrefFor(markup, "Review archived receipts")).toBe(
      "/app/hand-receipts?view=archived",
    );
  });

  it("hides write-oriented quick actions for read-only accounts", () => {
    const markup = renderToStaticMarkup(
      createElement(DashboardQuickActions, { isReadOnly: true }),
    );

    expect(markup).not.toContain("Quick Actions");
    expect(markup).not.toContain("Add item");
    expect(markup).not.toContain("Search items");
    expect(markup).not.toContain("Review 2062s");
    expect(markup).not.toContain("Review archived receipts");
  });
});
