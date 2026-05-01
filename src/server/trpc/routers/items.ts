import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  createItem,
  listActiveItemsByHandReceipt,
  listItems,
} from "@/modules/items";
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

const createItemInput = z.object({
  handReceiptId: z.uuid(),
  nomenclature: z
    .string()
    .trim()
    .min(1, "Item nomenclature is required.")
    .max(160),
  ecn: optionalText,
  serialNumber: optionalText,
  notes: z
    .string()
    .max(1000)
    .optional()
    .nullable()
    .transform((value) => value ?? null),
  generateFieldLedgerId: z.boolean().optional(),
  confirmDuplicate: z.boolean().optional(),
});

const listItemsInput = z
  .object({
    handReceiptId: z.uuid().optional(),
    status: z.enum(["active", "archived"]).optional(),
  })
  .optional();

const listByHandReceiptInput = z.object({
  handReceiptId: z.uuid(),
});

function toTRPCError(error: unknown): never {
  const message =
    error instanceof Error ? error.message : "Unable to update item.";

  switch (message) {
    case "This account is read-only.":
      throw new TRPCError({
        code: "FORBIDDEN",
        message,
      });
    case "Item nomenclature is required.":
    case "Provide an ECN, serial number, or generated ID.":
      throw new TRPCError({
        code: "BAD_REQUEST",
        message,
      });
    case "Hand receipt was not found.":
      throw new TRPCError({
        code: "NOT_FOUND",
        message,
      });
    case "Hand receipt is not active.":
      throw new TRPCError({
        code: "CONFLICT",
        message,
      });
    default:
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message,
      });
  }
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

export const itemsRouter = createTRPCRouter({
  list: protectedProcedure.input(listItemsInput).query(({ ctx, input }) =>
    listItems({
      accountId: ctx.account.id,
      status: input?.status ?? "active",
      ...(input?.handReceiptId ? { handReceiptId: input.handReceiptId } : {}),
      repository: ctx.itemRepository,
    }),
  ),
  listByHandReceipt: protectedProcedure
    .input(listByHandReceiptInput)
    .query(({ ctx, input }) =>
      listActiveItemsByHandReceipt({
        accountId: ctx.account.id,
        handReceiptId: input.handReceiptId,
        repository: ctx.itemRepository,
      }),
    ),
  create: protectedProcedure.input(createItemInput).mutation(({ ctx, input }) =>
    runInUnitOfWork(ctx, (repositories) =>
      createItem({
        account: ctx.account,
        actorId: ctx.session.userId,
        input: {
          handReceiptId: input.handReceiptId,
          nomenclature: input.nomenclature,
          ecn: input.ecn,
          serialNumber: input.serialNumber,
          notes: input.notes,
          ...(input.generateFieldLedgerId !== undefined
            ? { generateFieldLedgerId: input.generateFieldLedgerId }
            : {}),
          ...(input.confirmDuplicate !== undefined
            ? { confirmDuplicate: input.confirmDuplicate }
            : {}),
        },
        accountRepository: repositories.accountRepository,
        auditRepository: repositories.auditRepository,
        handReceiptRepository: repositories.handReceiptRepository,
        itemRepository: repositories.itemRepository,
      }),
    ),
  ),
});
