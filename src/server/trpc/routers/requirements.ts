import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  adjustRequirementNextDue,
  completeRequirement,
  createRequirement,
  listDashboardRequirements,
  listRequirementCompletions,
  listRequirements,
  pauseRequirement,
  resumeRequirement,
  updateRequirement,
} from "@/modules/requirements";
import { deriveAccountCapabilities } from "@/modules/billing";
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

const requirementIdInput = z.object({
  requirementId: z.uuid(),
});

const completeRequirementInput = z.object({
  requirementId: z.uuid(),
  completedOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Completion date must use YYYY-MM-DD format.")
    .optional(),
  notes: z
    .string()
    .max(500)
    .optional()
    .nullable()
    .transform((value) => value ?? null),
});

const updateRequirementInput = z.object({
  requirementId: z.uuid(),
  name: z.string().trim().min(1, "Requirement name is required.").max(200),
  notes: z
    .string()
    .max(500)
    .optional()
    .nullable()
    .transform((value) => value ?? null),
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
});

const adjustRequirementNextDueInput = z.object({
  requirementId: z.uuid(),
  nextDueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Next due date must use YYYY-MM-DD format."),
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
    case "Completion date must use YYYY-MM-DD format.":
    case "Completion date cannot be in the future.":
      throw new TRPCError({ code: "BAD_REQUEST", message });
    case "Item was not found.":
    case "Requirement was not found.":
      throw new TRPCError({ code: "NOT_FOUND", message });
    case "Item is not active.":
    case "Requirement is already paused.":
    case "Requirement is not paused.":
    case "Requirement is paused.":
    case "Cannot resume requirement on archived item.":
    case "Cannot resume requirement on archived hand receipt.":
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
  dashboardWork: protectedProcedure.query(({ ctx }) => {
    const capabilities = deriveAccountCapabilities(ctx.account);

    if (capabilities.isReadOnly) {
      return {
        isReadOnly: true,
        overdue: [],
        dueSoon: [],
        upcoming: [],
      };
    }

    return listDashboardRequirements({
      accountId: ctx.account.id,
      repository: ctx.requirementRepository,
    }).then((requirements) => ({
      isReadOnly: false,
      ...requirements,
    }));
  }),
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
  complete: protectedProcedure
    .input(completeRequirementInput)
    .mutation(async ({ ctx, input }) => {
      const result = await runInUnitOfWork(
        ctx,
        "requirements.complete",
        (repositories) =>
          completeRequirement({
            account: ctx.account,
            actorId: ctx.session.userId,
            input: {
              requirementId: input.requirementId,
              ...(input.completedOn ? { completedOn: input.completedOn } : {}),
              notes: input.notes,
            },
            auditRepository: repositories.auditRepository,
            completionRepository: repositories.requirementCompletionRepository,
            requirementRepository: repositories.requirementRepository,
          }),
      );

      if (result === null) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Requirement was not found.",
        });
      }

      return result;
    }),
  update: protectedProcedure
    .input(updateRequirementInput)
    .mutation(({ ctx, input }) =>
      runInUnitOfWork(ctx, "requirements.update", (repositories) =>
        updateRequirement({
          account: ctx.account,
          actorId: ctx.session.userId,
          input: {
            requirementId: input.requirementId,
            name: input.name,
            notes: input.notes,
            intervalType: input.intervalType,
            intervalValue: input.intervalValue ?? null,
          },
          auditRepository: repositories.auditRepository,
          completionRepository: repositories.requirementCompletionRepository,
          requirementRepository: repositories.requirementRepository,
        }),
      ),
    ),
  adjustNextDue: protectedProcedure
    .input(adjustRequirementNextDueInput)
    .mutation(({ ctx, input }) =>
      runInUnitOfWork(ctx, "requirements.adjustNextDue", (repositories) =>
        adjustRequirementNextDue({
          account: ctx.account,
          actorId: ctx.session.userId,
          input,
          auditRepository: repositories.auditRepository,
          requirementRepository: repositories.requirementRepository,
        }),
      ),
    ),
  pause: protectedProcedure
    .input(requirementIdInput)
    .mutation(({ ctx, input }) =>
      runInUnitOfWork(ctx, "requirements.pause", (repositories) =>
        pauseRequirement({
          account: ctx.account,
          actorId: ctx.session.userId,
          input,
          auditRepository: repositories.auditRepository,
          requirementRepository: repositories.requirementRepository,
        }),
      ),
    ),
  resume: protectedProcedure
    .input(requirementIdInput)
    .mutation(({ ctx, input }) =>
      runInUnitOfWork(ctx, "requirements.resume", (repositories) =>
        resumeRequirement({
          account: ctx.account,
          actorId: ctx.session.userId,
          input,
          auditRepository: repositories.auditRepository,
          handReceiptRepository: repositories.handReceiptRepository,
          itemRepository: repositories.itemRepository,
          requirementRepository: repositories.requirementRepository,
        }),
      ),
    ),
  listCompletionHistory: protectedProcedure
    .input(requirementIdInput)
    .query(({ ctx, input }) =>
      listRequirementCompletions({
        accountId: ctx.account.id,
        requirementId: input.requirementId,
        repository: ctx.requirementCompletionRepository,
        limit: 10,
      }),
    ),
});
