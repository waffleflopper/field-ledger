import { describe, expect, it } from "vitest";

import { getSafeAuthRedirectPath } from "@/modules/provider-boundaries/auth/redirect";

describe("getSafeAuthRedirectPath", () => {
  it("allows app-local redirect paths", () => {
    expect(getSafeAuthRedirectPath("/app/dashboard")).toBe("/app/dashboard");
    expect(getSafeAuthRedirectPath("/app/items?filter=due#top")).toBe(
      "/app/items?filter=due#top",
    );
  });

  it("falls back for external or non-app redirect targets", () => {
    expect(getSafeAuthRedirectPath(null)).toBe("/app");
    expect(getSafeAuthRedirectPath("/")).toBe("/app");
    expect(getSafeAuthRedirectPath("/auth/login")).toBe("/app");
    expect(getSafeAuthRedirectPath("//evil.example/app")).toBe("/app");
    expect(getSafeAuthRedirectPath("https://evil.example/app")).toBe("/app");
    expect(getSafeAuthRedirectPath("/\\evil.example")).toBe("/app");
  });
});
