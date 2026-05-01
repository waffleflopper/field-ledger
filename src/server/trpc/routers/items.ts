import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  archiveItem,
  checkDuplicateIdentifiers,
  createItem,
  getItem,
  listActiveItemsByHandReceipt,
  listArchivedItemsByHandReceipt,
  listItems,
  restoreItem,
  updateItem,
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
    status: z.enum(["active", "archived", "all"]).optional(),
  })
  .optional();

const listByHandReceiptInput = z.object({
  handReceiptId: z.uuid(),
  status: z.enum(["active", "archived"]).optional(),
});

const itemIdInput = z.object({
  id: z.uuid(),
});

const updateItemInput = z.object({
  id: z.uuid(),
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
  confirmDuplicate: z.boolean().optional(),
});

const checkDuplicateIdentifierInput = z.object({
  itemId: z.uuid().optional(),
  ecn: optionalText,
  serialNumber: optionalText,
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
    case "Item is already archived.":
    case "Item is already active.":
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
    .query(({ ctx, input }) => {
      if (input.status === "archived") {
        return listArchivedItemsByHandReceipt({
          accountId: ctx.account.id,
          handReceiptId: input.handReceiptId,
          repository: ctx.itemRepository,
        });
      }

      return listActiveItemsByHandReceipt({
        accountId: ctx.account.id,
        handReceiptId: input.handReceiptId,
        repository: ctx.itemRepository,
      });
    }),
  getById: protectedProcedure
    .input(itemIdInput)
    .query(async ({ ctx, input }) => {
      const item = await getItem({
        accountId: ctx.account.id,
        itemId: input.id,
        repository: ctx.itemRepository,
      });

      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Item was not found.",
        });
      }

      return item;
    }),
  checkDuplicateIdentifier: protectedProcedure
    .input(checkDuplicateIdentifierInput)
    .query(({ ctx, input }) =>
      checkDuplicateIdentifiers({
        accountId: ctx.account.id,
        ecn: input.ecn,
        serialNumber: input.serialNumber,
        ...(input.itemId ? { excludeItemId: input.itemId } : {}),
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
  update: protectedProcedure
    .input(updateItemInput)
    .mutation(async ({ ctx, input }) => {
      const result = await runInUnitOfWork(ctx, (repositories) =>
        updateItem({
          account: ctx.account,
          actorId: ctx.session.userId,
          itemId: input.id,
          input: {
            nomenclature: input.nomenclature,
            ecn: input.ecn,
            serialNumber: input.serialNumber,
            notes: input.notes,
            ...(input.confirmDuplicate !== undefined
              ? { confirmDuplicate: input.confirmDuplicate }
              : {}),
          },
          auditRepository: repositories.auditRepository,
          itemRepository: repositories.itemRepository,
        }),
      );

      if (result.item === null) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Item was not found.",
        });
      }

      return result;
    }),
  archive: protectedProcedure
    .input(itemIdInput)
    .mutation(async ({ ctx, input }) => {
      const archived = await runInUnitOfWork(ctx, (repositories) =>
        archiveItem({
          account: ctx.account,
          actorId: ctx.session.userId,
          itemId: input.id,
          auditRepository: repositories.auditRepository,
          itemRepository: repositories.itemRepository,
        }),
      );

      if (!archived) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Item was not found.",
        });
      }

      return archived;
    }),
  restore: protectedProcedure
    .input(itemIdInput)
    .mutation(async ({ ctx, input }) => {
      const restored = await runInUnitOfWork(ctx, (repositories) =>
        restoreItem({
          account: ctx.account,
          actorId: ctx.session.userId,
          itemId: input.id,
          auditRepository: repositories.auditRepository,
          itemRepository: repositories.itemRepository,
        }),
      );

      if (!restored) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Item was not found.",
        });
      }

      return restored;
    }),
});
