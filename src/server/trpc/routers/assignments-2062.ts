import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  AccountReadOnlyError,
  Active2062CoverageConflictError,
  AssignmentAlreadyClosedError,
  closeAssignment,
  CloseDateFutureError,
  CloseDateInvalidError,
  ContactDisplayNameRequiredError,
  ContactNotFoundError,
  createAssignment,
  createAssignmentWithItems,
  DocumentNotFoundError,
  DocumentReceiptMismatchError,
  EmptyItemSelectionError,
  getHandReceiptAssignments,
  getItemCoverage,
  HandReceiptNotActiveError,
  HandReceiptNotFoundError,
  ItemLinkAlreadyClosedError,
  ItemLinkNotFoundError,
  ItemNotActiveError,
  ItemNotFoundError,
  ItemReceiptMismatchError,
  listActiveAssignments,
  removeAssignmentItemLink,
} from "@/modules/assignments-2062";
import type {
  AppUnitOfWork,
  AppUnitOfWorkRepositories,
} from "@/modules/provider-boundaries/database/app-unit-of-work";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc/init";

const createAssignmentInput = z
  .object({
    itemId: z.uuid(),
    contactId: z.uuid().optional(),
    contactDisplayName: z.string().trim().min(1).max(120).optional(),
    documentId: z.uuid(),
  })
  .refine((input) => input.contactId || input.contactDisplayName, {
    message: "Select or create a contact.",
    path: ["contactId"],
  })
  .refine((input) => !(input.contactId && input.contactDisplayName), {
    message: "Use an existing contact or create a new one, not both.",
    path: ["contactId"],
  });

const createAssignmentWithItemsInput = z
  .object({
    handReceiptId: z.uuid(),
    itemIds: z.array(z.uuid()),
    contactId: z.uuid().optional(),
    contactDisplayName: z.string().trim().min(1).max(120).optional(),
    documentId: z.uuid(),
  })
  .refine((input) => input.itemIds.length > 0, {
    message: "Select at least one item.",
    path: ["itemIds"],
  })
  .refine((input) => input.contactId || input.contactDisplayName, {
    message: "Select or create a contact.",
    path: ["contactId"],
  })
  .refine((input) => !(input.contactId && input.contactDisplayName), {
    message: "Use an existing contact or create a new one, not both.",
    path: ["contactId"],
  });

const closeAssignmentInput = z.object({
  assignmentId: z.uuid(),
  closedOn: z.string().optional(),
});

const removeItemLinkInput = z.object({
  itemLinkId: z.uuid(),
  closedOn: z.string().optional(),
});

function toTRPCError(
  error: unknown,
  context: { accountId: string; operation: string; userId: string },
): never {
  const message =
    error instanceof Error ? error.message : "Unable to create 2062.";

  if (isConflictError(error)) {
    throw new TRPCError({ code: "CONFLICT", message });
  }

  if (error instanceof AccountReadOnlyError) {
    throw new TRPCError({ code: "FORBIDDEN", message });
  }

  if (isNotFoundError(error)) {
    throw new TRPCError({ code: "NOT_FOUND", message });
  }

  if (isBadRequestError(error)) {
    throw new TRPCError({ code: "BAD_REQUEST", message });
  }

  console.error("Unexpected assignments 2062 tRPC error.", {
    accountId: context.accountId,
    operation: context.operation,
    userId: context.userId,
    error,
  });
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "Unable to create 2062.",
  });
}

function isConflictError(error: unknown) {
  return (
    error instanceof Active2062CoverageConflictError ||
    error instanceof AssignmentAlreadyClosedError ||
    error instanceof DocumentReceiptMismatchError ||
    error instanceof HandReceiptNotActiveError ||
    error instanceof ItemLinkAlreadyClosedError ||
    error instanceof ItemNotActiveError ||
    error instanceof ItemReceiptMismatchError
  );
}

function isNotFoundError(error: unknown) {
  return (
    error instanceof ContactNotFoundError ||
    error instanceof DocumentNotFoundError ||
    error instanceof HandReceiptNotFoundError ||
    error instanceof ItemLinkNotFoundError ||
    error instanceof ItemNotFoundError
  );
}

function isBadRequestError(error: unknown) {
  return (
    error instanceof ContactDisplayNameRequiredError ||
    error instanceof CloseDateFutureError ||
    error instanceof CloseDateInvalidError ||
    error instanceof EmptyItemSelectionError
  );
}

async function runInUnitOfWork<T>(
  ctx: {
    account: { id: string };
    session: { userId: string };
    unitOfWork: AppUnitOfWork;
  },
  operationName: string,
  operation: (repositories: AppUnitOfWorkRepositories) => Promise<T>,
): Promise<T> {
  try {
    return await ctx.unitOfWork.run(operation);
  } catch (error) {
    if (error instanceof TRPCError) {
      throw error;
    }

    toTRPCError(error, {
      accountId: ctx.account.id,
      operation: operationName,
      userId: ctx.session.userId,
    });
  }
}

export const assignments2062Router = createTRPCRouter({
  list: protectedProcedure.query(({ ctx }) =>
    runInUnitOfWork(ctx, "assignments2062.list", (repositories) =>
      listActiveAssignments({
        account: ctx.account,
        assignmentItemLinkRepository: repositories.assignmentItemLinkRepository,
        assignmentRepository: repositories.assignmentRepository,
        handReceiptRepository: repositories.handReceiptRepository,
        itemRepository: repositories.itemRepository,
      }),
    ),
  ),
  getItemCoverage: protectedProcedure
    .input(z.object({ itemId: z.uuid() }))
    .query(({ ctx, input }) =>
      runInUnitOfWork(ctx, "assignments2062.getItemCoverage", (repositories) =>
        getItemCoverage({
          account: ctx.account,
          assignmentItemLinkRepository:
            repositories.assignmentItemLinkRepository,
          assignmentRepository: repositories.assignmentRepository,
          handReceiptRepository: repositories.handReceiptRepository,
          itemRepository: repositories.itemRepository,
          itemId: input.itemId,
        }),
      ),
    ),
  getHandReceiptAssignments: protectedProcedure
    .input(z.object({ handReceiptId: z.uuid() }))
    .query(({ ctx, input }) =>
      runInUnitOfWork(
        ctx,
        "assignments2062.getHandReceiptAssignments",
        (repositories) =>
          getHandReceiptAssignments({
            account: ctx.account,
            assignmentItemLinkRepository:
              repositories.assignmentItemLinkRepository,
            assignmentRepository: repositories.assignmentRepository,
            handReceiptId: input.handReceiptId,
            handReceiptRepository: repositories.handReceiptRepository,
            itemRepository: repositories.itemRepository,
          }),
      ),
    ),
  create: protectedProcedure
    .input(createAssignmentInput)
    .mutation(({ ctx, input }) =>
      runInUnitOfWork(ctx, "assignments2062.create", (repositories) =>
        createAssignment({
          account: ctx.account,
          actorId: ctx.session.userId,
          input:
            input.contactId !== undefined
              ? {
                  itemId: input.itemId,
                  contactId: input.contactId,
                  documentId: input.documentId,
                }
              : {
                  itemId: input.itemId,
                  contactDisplayName: input.contactDisplayName ?? "",
                  documentId: input.documentId,
                },
          assignmentRepository: repositories.assignmentRepository,
          assignmentItemLinkRepository:
            repositories.assignmentItemLinkRepository,
          auditRepository: repositories.auditRepository,
          contactRepository: repositories.contactRepository,
          documentRepository: repositories.documentRepository,
          handReceiptRepository: repositories.handReceiptRepository,
          itemRepository: repositories.itemRepository,
        }),
      ),
    ),
  createWithItems: protectedProcedure
    .input(createAssignmentWithItemsInput)
    .mutation(({ ctx, input }) =>
      runInUnitOfWork(ctx, "assignments2062.createWithItems", (repositories) =>
        createAssignmentWithItems({
          account: ctx.account,
          actorId: ctx.session.userId,
          input:
            input.contactId !== undefined
              ? {
                  handReceiptId: input.handReceiptId,
                  itemIds: input.itemIds,
                  contactId: input.contactId,
                  documentId: input.documentId,
                }
              : {
                  handReceiptId: input.handReceiptId,
                  itemIds: input.itemIds,
                  contactDisplayName: input.contactDisplayName ?? "",
                  documentId: input.documentId,
                },
          assignmentRepository: repositories.assignmentRepository,
          assignmentItemLinkRepository:
            repositories.assignmentItemLinkRepository,
          auditRepository: repositories.auditRepository,
          contactRepository: repositories.contactRepository,
          documentRepository: repositories.documentRepository,
          handReceiptRepository: repositories.handReceiptRepository,
          itemRepository: repositories.itemRepository,
        }),
      ),
    ),
  close: protectedProcedure
    .input(closeAssignmentInput)
    .mutation(({ ctx, input }) =>
      runInUnitOfWork(ctx, "assignments2062.close", (repositories) =>
        closeAssignment({
          account: ctx.account,
          actorId: ctx.session.userId,
          assignmentId: input.assignmentId,
          ...(input.closedOn ? { closedOn: input.closedOn } : {}),
          assignmentRepository: repositories.assignmentRepository,
          assignmentItemLinkRepository:
            repositories.assignmentItemLinkRepository,
          auditRepository: repositories.auditRepository,
          itemRepository: repositories.itemRepository,
        }),
      ),
    ),
  removeItemLink: protectedProcedure
    .input(removeItemLinkInput)
    .mutation(({ ctx, input }) =>
      runInUnitOfWork(ctx, "assignments2062.removeItemLink", (repositories) =>
        removeAssignmentItemLink({
          account: ctx.account,
          actorId: ctx.session.userId,
          itemLinkId: input.itemLinkId,
          ...(input.closedOn ? { closedOn: input.closedOn } : {}),
          assignmentRepository: repositories.assignmentRepository,
          assignmentItemLinkRepository:
            repositories.assignmentItemLinkRepository,
          auditRepository: repositories.auditRepository,
          itemRepository: repositories.itemRepository,
        }),
      ),
    ),
});
