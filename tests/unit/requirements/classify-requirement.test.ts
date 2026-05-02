import { describe, expect, it } from "vitest";

import {
  addDaysToDateOnly,
  classifyRequirement,
} from "@/modules/requirements/application/classify-requirement";

describe("classifyRequirement", () => {
  it("classifies dashboard requirement windows from today", () => {
    const today = "2026-05-01";

    expect(classifyRequirement("2026-04-30", today)).toBe("overdue");
    expect(classifyRequirement("2026-05-01", today)).toBe("due_soon");
    expect(classifyRequirement("2026-05-15", today)).toBe("due_soon");
    expect(classifyRequirement("2026-05-16", today)).toBe("upcoming");
    expect(classifyRequirement("2026-05-31", today)).toBe("upcoming");
    expect(classifyRequirement("2026-06-01", today)).toBe("beyond");
  });

  it("adds calendar days without local timezone drift", () => {
    expect(addDaysToDateOnly("2026-05-01", 30)).toBe("2026-05-31");
  });
});
