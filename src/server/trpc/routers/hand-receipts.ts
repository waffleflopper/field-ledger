import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  archiveHandReceipt,
  createHandReceipt,
  getHandReceipt,
  listArchivedHandReceipts,
  listHandReceipts,
  restoreHandReceipt,
  updateHandReceipt,
} from "@/modules/hand-receipts";
import type {
  AppUnitOfWork,
  AppUnitOfWorkRepositories,
} from "@/modules/provider-boundaries/database/app-unit-of-work";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc/init";

const optionalText = z
  .string()
  .max(500)
  .optional()
  .nullable()
  .transform((value) => value ?? null);

const createHandReceiptInput = z.object({
  name: z.string().trim().min(1, "Hand receipt name is required.").max(120),
  notes: z
    .string()
    .max(1000)
    .optional()
    .nullable()
    .transform((value) => value ?? null),
  handReceiptNumber: optionalText,
  holderName: optionalText,
  unitName: optionalText,
  uic: optionalText,
  effectiveDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD.")
    .optional()
    .nullable()
    .transform((value) => value ?? null),
});

const handReceiptIdInput = z.object({
  id: z.uuid(),
});

const updateHandReceiptInput = createHandReceiptInput.extend({
  id: z.uuid(),
});

const listHandReceiptsInput = z
  .object({
    status: z.enum(["active", "archived", "all"]).optional(),
  })
  .optional();

function toTRPCError(error: unknown): never {
  const message =
    error instanceof Error ? error.message : "Unable to update hand receipt.";

  if (
    message === "This account is read-only." ||
    message === "Active hand receipt limit reached."
  ) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message,
    });
  }

  if (message === "Hand receipt name is required.") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message,
    });
  }

  if (
    message === "Hand receipt is already archived." ||
    message === "Hand receipt is already active."
  ) {
    throw new TRPCError({
      code: "CONFLICT",
      message,
    });
  }

  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message,
  });
}

async function runInUnitOfWork<T>(
  ctx: { unitOfWork: AppUnitOfWork },
  operation: (repositories: AppUnitOfWorkRepositories) => Promise<T>,
): Promise<T> {
  try {
    return await ctx.unitOfWork.run(operation);
  } catch (error) {
    if (error instanceof TRPCError) {
      throw error;
    }

    toTRPCError(error);
  }
}

export const handReceiptsRouter = createTRPCRouter({
  list: protectedProcedure
    .input(listHandReceiptsInput)
    .query(({ ctx, input }) =>
      listHandReceipts({
        accountId: ctx.account.id,
        status: input?.status ?? "active",
        repository: ctx.handReceiptRepository,
      }),
    ),
  listArchived: protectedProcedure.query(({ ctx }) =>
    listArchivedHandReceipts({
      accountId: ctx.account.id,
      repository: ctx.handReceiptRepository,
    }),
  ),
  getById: protectedProcedure
    .input(handReceiptIdInput)
    .query(async ({ ctx, input }) => {
      const handReceipt = await getHandReceipt({
        accountId: ctx.account.id,
        handReceiptId: input.id,
        repository: ctx.handReceiptRepository,
      });

      if (!handReceipt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Hand receipt was not found.",
        });
      }

      return handReceipt;
    }),
  create: protectedProcedure
    .input(createHandReceiptInput)
    .mutation(({ ctx, input }) =>
      runInUnitOfWork(ctx, (repositories) =>
        createHandReceipt({
          account: ctx.account,
          actorId: ctx.session.userId,
          input: {
            name: input.name,
            notes: input.notes,
            handReceiptNumber: input.handReceiptNumber,
            holderName: input.holderName,
            unitName: input.unitName,
            uic: input.uic,
            effectiveDate: input.effectiveDate,
          },
          handReceiptRepository: repositories.handReceiptRepository,
          auditRepository: repositories.auditRepository,
        }),
      ),
    ),
  update: protectedProcedure
    .input(updateHandReceiptInput)
    .mutation(async ({ ctx, input }) => {
      const updated = await runInUnitOfWork(ctx, (repositories) =>
        updateHandReceipt({
          account: ctx.account,
          actorId: ctx.session.userId,
          handReceiptId: input.id,
          input: {
            name: input.name,
            notes: input.notes,
            handReceiptNumber: input.handReceiptNumber,
            holderName: input.holderName,
            unitName: input.unitName,
            uic: input.uic,
            effectiveDate: input.effectiveDate,
          },
          handReceiptRepository: repositories.handReceiptRepository,
          auditRepository: repositories.auditRepository,
        }),
      );

      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Hand receipt was not found.",
        });
      }

      return updated;
    }),
  archive: protectedProcedure
    .input(handReceiptIdInput)
    .mutation(async ({ ctx, input }) => {
      const archived = await runInUnitOfWork(ctx, (repositories) =>
        archiveHandReceipt({
          account: ctx.account,
          actorId: ctx.session.userId,
          handReceiptId: input.id,
          handReceiptRepository: repositories.handReceiptRepository,
          auditRepository: repositories.auditRepository,
        }),
      );

      if (!archived) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Hand receipt was not found.",
        });
      }

      return archived;
    }),
  restore: protectedProcedure
    .input(handReceiptIdInput)
    .mutation(async ({ ctx, input }) => {
      const restored = await runInUnitOfWork(ctx, (repositories) =>
        restoreHandReceipt({
          account: ctx.account,
          actorId: ctx.session.userId,
          handReceiptId: input.id,
          handReceiptRepository: repositories.handReceiptRepository,
          auditRepository: repositories.auditRepository,
        }),
      );

      if (!restored) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Hand receipt was not found.",
        });
      }

      return restored;
    }),
});
