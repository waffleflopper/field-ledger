import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  createHandReceipt,
  getHandReceipt,
  listActiveHandReceipts,
  updateHandReceipt,
} from "@/modules/hand-receipts";
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

function toTRPCError(error: unknown): never {
  const message =
    error instanceof Error ? error.message : "Unable to create hand receipt.";

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

  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message,
  });
}

export const handReceiptsRouter = createTRPCRouter({
  list: protectedProcedure.query(({ ctx }) =>
    listActiveHandReceipts({
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
    .mutation(async ({ ctx, input }) => {
      try {
        return await createHandReceipt({
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
          handReceiptRepository: ctx.handReceiptRepository,
        });
      } catch (error) {
        toTRPCError(error);
      }
    }),
  update: protectedProcedure
    .input(updateHandReceiptInput)
    .mutation(async ({ ctx, input }) => {
      try {
        const updated = await updateHandReceipt({
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
          handReceiptRepository: ctx.handReceiptRepository,
        });

        if (!updated) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Hand receipt was not found.",
          });
        }

        return updated;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        toTRPCError(error);
      }
    }),
});
