import { initTRPC } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import superjson from "superjson";

import {
  createUnavailableAssignmentItemLinkRepository,
  createUnavailableAssignmentRepository,
} from "@/modules/assignments-2062";
import {
  createUnavailableRequirementCompletionRepository,
  createUnavailableRequirementRepository,
} from "@/modules/requirements";
import { createUnavailableDocumentRepository } from "@/modules/documents";
import { createUnavailableStoragePort } from "@/modules/provider-boundaries/storage";
import type { TRPCContext } from "@/server/trpc/context";

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session || !ctx.account) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "An initialized Field Ledger account is required.",
    });
  }

  return next({
    ctx: {
      session: ctx.session,
      account: ctx.account,
      accountRepository: ctx.accountRepository,
      assignmentItemLinkRepository:
        ctx.assignmentItemLinkRepository ??
        createUnavailableAssignmentItemLinkRepository(),
      assignmentRepository:
        ctx.assignmentRepository ?? createUnavailableAssignmentRepository(),
      auditRepository: ctx.auditRepository,
      contactRepository: ctx.contactRepository,
      documentRepository:
        ctx.documentRepository ?? createUnavailableDocumentRepository(),
      handReceiptRepository: ctx.handReceiptRepository,
      itemRepository: ctx.itemRepository,
      locationRepository: ctx.locationRepository,
      requirementCompletionRepository:
        ctx.requirementCompletionRepository ??
        createUnavailableRequirementCompletionRepository(),
      requirementRepository:
        ctx.requirementRepository ?? createUnavailableRequirementRepository(),
      unitOfWork: ctx.unitOfWork,
      storagePort: ctx.storagePort ?? createUnavailableStoragePort(),
    },
  });
});
