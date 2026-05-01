import { TRPCError } from "@trpc/server";
import { describe, expect, it } from "vitest";

import { createTRPCRouter, protectedProcedure } from "@/server/trpc/init";
import { createEmptyAccountRepository } from "../../support/account-repository";
import { createEmptyAuditRepository } from "../../support/audit-repository";
import { createInMemoryAppUnitOfWork } from "../../support/app-unit-of-work";
import { createEmptyContactRepository } from "../../support/contact-repository";
import { createEmptyHandReceiptRepository } from "../../support/hand-receipt-repository";
import { createEmptyItemRepository } from "../../support/item-repository";
import { createEmptyLocationRepository } from "../../support/location-repository";
import { createEmptyRequirementRepository } from "../../support/requirement-repository";

const authProbeRouter = createTRPCRouter({
  currentUserEmail: protectedProcedure.query(({ ctx }) => ctx.session.email),
});

describe("protectedProcedure", () => {
  it("rejects callers without an app session", async () => {
    const caller = authProbeRouter.createCaller({
      session: null,
      account: null,
      accountRepository: createEmptyAccountRepository(),
      auditRepository: createEmptyAuditRepository(),
      contactRepository: createEmptyContactRepository(),
      handReceiptRepository: createEmptyHandReceiptRepository(),
      itemRepository: createEmptyItemRepository(),
      locationRepository: createEmptyLocationRepository(),
      requirementRepository: createEmptyRequirementRepository(),
      unitOfWork: createInMemoryAppUnitOfWork(),
    });

    await expect(caller.currentUserEmail()).rejects.toMatchObject({
      code: "UNAUTHORIZED" satisfies TRPCError["code"],
    });
  });

  it("rejects callers without an initialized owner account", async () => {
    const caller = authProbeRouter.createCaller({
      session: {
        userId: "user-1",
        email: "owner@example.com",
      },
      account: null,
      accountRepository: createEmptyAccountRepository(),
      auditRepository: createEmptyAuditRepository(),
      contactRepository: createEmptyContactRepository(),
      handReceiptRepository: createEmptyHandReceiptRepository(),
      itemRepository: createEmptyItemRepository(),
      locationRepository: createEmptyLocationRepository(),
      requirementRepository: createEmptyRequirementRepository(),
      unitOfWork: createInMemoryAppUnitOfWork(),
    });

    await expect(caller.currentUserEmail()).rejects.toMatchObject({
      code: "UNAUTHORIZED" satisfies TRPCError["code"],
    });
  });

  it("allows callers with an app session", async () => {
    const caller = authProbeRouter.createCaller({
      session: {
        userId: "user-1",
        email: "owner@example.com",
      },
      account: {
        id: "account-1",
        userId: "user-1",
        accessState: "trialing",
        subscriptionTier: null,
        trialStartsAt: new Date("2026-04-29T12:00:00.000Z"),
        trialEndsAt: new Date("2026-05-29T12:00:00.000Z"),
      },
      accountRepository: createEmptyAccountRepository(),
      auditRepository: createEmptyAuditRepository(),
      contactRepository: createEmptyContactRepository(),
      handReceiptRepository: createEmptyHandReceiptRepository(),
      itemRepository: createEmptyItemRepository(),
      locationRepository: createEmptyLocationRepository(),
      requirementRepository: createEmptyRequirementRepository(),
      unitOfWork: createInMemoryAppUnitOfWork(),
    });

    await expect(caller.currentUserEmail()).resolves.toBe("owner@example.com");
  });
});
