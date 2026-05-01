import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createRequirement, listRequirements } from "@/modules/requirements";
import type {
  AppUnitOfWork,
  AppUnitOfWorkRepositories,
} from "@/modules/provider-boundaries/database/app-unit-of-work";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc/init";

const createRequirementInput = z.object({
  itemId: z.uuid(),
  name: z.string().trim().min(1, "Requirement name is required.").max(200),
  intervalType: z.enum([
    "weekly",
    "monthly",
    "quarterly",
    "semiannual",
    "annual",
    "custom_days",
    "custom_months",
  ]),
  intervalValue: z.number().int().positive().optional().nullable(),
  nextDueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Next due date must use YYYY-MM-DD format."),
  confirmDuplicate: z.boolean().optional(),
});

const listRequirementsInput = z.object({
  itemId: z.uuid(),
});

function toTRPCError(
  error: unknown,
  context: { accountId: string; operation: string; userId: string },
): never {
  const message =
    error instanceof Error ? error.message : "Unable to update requirement.";

  switch (message) {
    case "This account is read-only.":
      throw new TRPCError({ code: "FORBIDDEN", message });
    case "Requirement name is required.":
    case "Requirement interval is not supported.":
    case "Preset requirement intervals cannot include a value.":
    case "Custom requirement intervals need a positive whole number.":
    case "Next due date must use YYYY-MM-DD format.":
      throw new TRPCError({ code: "BAD_REQUEST", message });
    case "Item was not found.":
      throw new TRPCError({ code: "NOT_FOUND", message });
    case "Item is not active.":
      throw new TRPCError({ code: "CONFLICT", message });
    default:
      console.error("Unexpected requirements tRPC error.", {
        accountId: context.accountId,
        operation: context.operation,
        userId: context.userId,
        error,
      });
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Unable to update requirement.",
      });
  }
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

export const requirementsRouter = createTRPCRouter({
  list: protectedProcedure
    .input(listRequirementsInput)
    .query(({ ctx, input }) =>
      listRequirements({
        accountId: ctx.account.id,
        itemId: input.itemId,
        repository: ctx.requirementRepository,
      }),
    ),
  create: protectedProcedure
    .input(createRequirementInput)
    .mutation(({ ctx, input }) =>
      runInUnitOfWork(ctx, "requirements.create", (repositories) =>
        createRequirement({
          account: ctx.account,
          actorId: ctx.session.userId,
          input: {
            itemId: input.itemId,
            name: input.name,
            intervalType: input.intervalType,
            intervalValue: input.intervalValue ?? null,
            nextDueDate: input.nextDueDate,
            ...(input.confirmDuplicate !== undefined
              ? { confirmDuplicate: input.confirmDuplicate }
              : {}),
          },
          auditRepository: repositories.auditRepository,
          itemRepository: repositories.itemRepository,
          requirementRepository: repositories.requirementRepository,
        }),
      ),
    ),
});
