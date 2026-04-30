import { describe, expect, it, vi } from "vitest";

import { runWithAuthenticatedDatabaseSession } from "@/modules/provider-boundaries/database/authenticated-session";

describe("runWithAuthenticatedDatabaseSession", () => {
  it("fails before opening a transaction when authSubject is blank", async () => {
    const db = {
      transaction: vi.fn(),
    };

    await expect(
      runWithAuthenticatedDatabaseSession(
        db as never,
        { authSubject: "   " },
        async () => null,
      ),
    ).rejects.toThrow("non-empty authSubject");

    expect(db.transaction).not.toHaveBeenCalled();
  });
});
