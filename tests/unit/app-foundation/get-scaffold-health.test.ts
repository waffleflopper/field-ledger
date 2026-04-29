import { describe, expect, it } from "vitest";

import { getScaffoldHealth } from "@/modules/app-foundation/application/get-scaffold-health";

describe("getScaffoldHealth", () => {
  it("returns the scaffold API/query foundation status", () => {
    expect(getScaffoldHealth()).toEqual({
      status: "ok",
      api: "trpc",
      queryClient: "tanstack-query",
      scope: "scaffold",
    });
  });
});
