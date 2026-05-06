import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DashboardSignedOut } from "@/modules/dashboard/ui/dashboard-signed-out";
import type { DashboardSignedOutResult } from "@/modules/items";

const emptySignedOut: DashboardSignedOutResult = {
  coveredItems: [],
  manualItems: [],
};

describe("DashboardSignedOut", () => {
  it("uses only the empty-state read-only message when no property is signed out", () => {
    const markup = renderToStaticMarkup(
      createElement(DashboardSignedOut, {
        ...emptySignedOut,
        isReadOnly: true,
      }),
    );

    expect(markup).toContain("No signed-out property");
    expect(markup).toContain("This account is read-only");
    expect(markup).not.toContain("Signed-out property is review-only");
  });

  it("shows the read-only notice when signed-out property exists", () => {
    const markup = renderToStaticMarkup(
      createElement(DashboardSignedOut, {
        coveredItems: [
          {
            assignmentId: "assignment-1",
            coverageType: "da2062",
            documentFilename: "signed-da-2062.pdf",
            handReceiptId: "receipt-1",
            handReceiptName: "Primary receipt",
            identifier: "FL-000123",
            itemId: "item-1",
            nomenclature: "Radio set",
            signedToName: "SSG Carter",
          },
        ],
        isReadOnly: true,
        manualItems: [],
      }),
    );

    expect(markup).toContain("Signed-out property is review-only");
    expect(markup).toContain("no-2062 assignments");
    expect(markup).toContain("Radio set");
  });
});
