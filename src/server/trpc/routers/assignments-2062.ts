import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  Active2062CoverageConflictError,
  createAssignment,
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

function toTRPCError(
  error: unknown,
  context: { accountId: string; operation: string; userId: string },
): never {
  const message =
    error instanceof Error ? error.message : "Unable to create 2062.";

  if (
    error instanceof Active2062CoverageConflictError ||
    message === "Item must be active to upload a 2062." ||
    message === "Document must belong to the item's hand receipt."
  ) {
    throw new TRPCError({ code: "CONFLICT", message });
  }

  if (message === "This account is read-only.") {
    throw new TRPCError({ code: "FORBIDDEN", message });
  }

  if (
    message === "Item was not found." ||
    message === "Contact was not found." ||
    message === "Document was not found."
  ) {
    throw new TRPCError({ code: "NOT_FOUND", message });
  }

  if (message === "Contact display name is required.") {
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
          itemRepository: repositories.itemRepository,
        }),
      ),
    ),
});
