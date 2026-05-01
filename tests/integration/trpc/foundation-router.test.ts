import { describe, expect, it } from "vitest";

import { appRouter } from "@/server/trpc/router";
import { createEmptyAccountRepository } from "../../support/account-repository";
import { createEmptyAuditRepository } from "../../support/audit-repository";
import { createInMemoryAppUnitOfWork } from "../../support/app-unit-of-work";
import { createEmptyContactRepository } from "../../support/contact-repository";
import { createEmptyHandReceiptRepository } from "../../support/hand-receipt-repository";
import { createEmptyItemRepository } from "../../support/item-repository";
import { createEmptyLocationRepository } from "../../support/location-repository";

describe("foundationRouter", () => {
  it("serves health through the typed tRPC caller", async () => {
    const caller = appRouter.createCaller({
      session: null,
      account: null,
      accountRepository: createEmptyAccountRepository(),
      auditRepository: createEmptyAuditRepository(),
      contactRepository: createEmptyContactRepository(),
      handReceiptRepository: createEmptyHandReceiptRepository(),
      itemRepository: createEmptyItemRepository(),
      locationRepository: createEmptyLocationRepository(),
      unitOfWork: createInMemoryAppUnitOfWork(),
    });

    await expect(caller.foundation.health()).resolves.toMatchObject({
      status: "ok",
      api: "trpc",
      queryClient: "tanstack-query",
    });
  });
});
