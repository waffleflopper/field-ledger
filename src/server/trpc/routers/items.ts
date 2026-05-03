import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { hasActive2062Coverage } from "@/modules/assignments-2062";
import {
  assignSignedTo,
  assignSignedToWithNewContact,
  archiveItem,
  checkDuplicateIdentifiers,
  clearSignedTo,
  createItem,
  getItem,
  listActiveItemsByHandReceipt,
  listArchivedItemsByHandReceipt,
  listItems,
  moveItem,
  restoreItem,
  searchItems,
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
  locationId: z.uuid().optional().nullable(),
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

const searchItemsInput = z.object({
  query: z.string().max(160),
  includeArchived: z.boolean().optional(),
});

const itemIdInput = z.object({
  id: z.uuid(),
});

const moveItemInput = z.object({
  id: z.uuid(),
  targetHandReceiptId: z.uuid(),
});

const assignSignedToInput = z.object({
  id: z.uuid(),
  contactId: z.uuid(),
});

const assignSignedToWithNewContactInput = z.object({
  id: z.uuid(),
  contactDisplayName: z
    .string()
    .trim()
    .min(1, "Contact display name is required.")
    .max(120),
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
  locationId: z.uuid().optional().nullable(),
  confirmDuplicate: z.boolean().optional(),
});

const checkDuplicateIdentifierInput = z.object({
  itemId: z.uuid().optional(),
  ecn: optionalText,
  serialNumber: optionalText,
});

function toTRPCError(
  error: unknown,
  context: { accountId: string; operation: string; userId: string },
): never {
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
    case "Contact was not found.":
    case "Location was not found.":
      throw new TRPCError({
        code: "NOT_FOUND",
        message,
      });
    case "Contact display name is required.":
      throw new TRPCError({
        code: "BAD_REQUEST",
        message,
      });
    case "Hand receipt is not active.":
    case "Item is already archived.":
    case "Item is already active.":
    case "Cannot move an archived item.":
    case "Cannot move item from an archived hand receipt.":
    case "Cannot move item to an archived hand receipt.":
    case "Cannot move item with active 2062 coverage.":
      throw new TRPCError({
        code: "CONFLICT",
        message,
      });
    default:
      console.error("Unexpected items tRPC error.", {
        accountId: context.accountId,
        operation: context.operation,
        userId: context.userId,
        error,
      });
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Unable to update item.",
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
  search: protectedProcedure.input(searchItemsInput).query(({ ctx, input }) =>
    searchItems({
      accountId: ctx.account.id,
      query: input.query,
      includeArchived: input.includeArchived ?? false,
      repository: ctx.itemRepository,
    }),
  ),
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
    runInUnitOfWork(ctx, "items.create", (repositories) =>
      createItem({
        account: ctx.account,
        actorId: ctx.session.userId,
        input: {
          handReceiptId: input.handReceiptId,
          nomenclature: input.nomenclature,
          ecn: input.ecn,
          serialNumber: input.serialNumber,
          notes: input.notes,
          locationId: input.locationId ?? null,
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
        locationRepository: repositories.locationRepository,
      }),
    ),
  ),
  update: protectedProcedure
    .input(updateItemInput)
    .mutation(async ({ ctx, input }) => {
      const result = await runInUnitOfWork(
        ctx,
        "items.update",
        (repositories) =>
          updateItem({
            account: ctx.account,
            actorId: ctx.session.userId,
            itemId: input.id,
            input: {
              nomenclature: input.nomenclature,
              ecn: input.ecn,
              serialNumber: input.serialNumber,
              notes: input.notes,
              ...(input.locationId !== undefined
                ? { locationId: input.locationId }
                : {}),
              ...(input.confirmDuplicate !== undefined
                ? { confirmDuplicate: input.confirmDuplicate }
                : {}),
            },
            auditRepository: repositories.auditRepository,
            itemRepository: repositories.itemRepository,
            locationRepository: repositories.locationRepository,
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
      const archived = await runInUnitOfWork(
        ctx,
        "items.archive",
        (repositories) =>
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
      const restored = await runInUnitOfWork(
        ctx,
        "items.restore",
        (repositories) =>
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
  move: protectedProcedure
    .input(moveItemInput)
    .mutation(async ({ ctx, input }) => {
      const moved = await runInUnitOfWork(ctx, "items.move", (repositories) =>
        moveItem({
          account: ctx.account,
          actorId: ctx.session.userId,
          itemId: input.id,
          targetHandReceiptId: input.targetHandReceiptId,
          auditRepository: repositories.auditRepository,
          handReceiptRepository: repositories.handReceiptRepository,
          itemRepository: repositories.itemRepository,
          hasActive2062Coverage: ({ accountId, itemId }) =>
            hasActive2062Coverage({
              accountId,
              itemId,
              assignmentItemLinkRepository:
                repositories.assignmentItemLinkRepository,
            }),
        }),
      );

      if (!moved) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Item or target hand receipt was not found.",
        });
      }

      return moved;
    }),
  assignSignedTo: protectedProcedure
    .input(assignSignedToInput)
    .mutation(async ({ ctx, input }) => {
      const assigned = await runInUnitOfWork(
        ctx,
        "items.assignSignedTo",
        (repositories) =>
          assignSignedTo({
            account: ctx.account,
            actorId: ctx.session.userId,
            itemId: input.id,
            contactId: input.contactId,
            auditRepository: repositories.auditRepository,
            contactRepository: repositories.contactRepository,
            itemRepository: repositories.itemRepository,
          }),
      );

      if (!assigned) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Item was not found.",
        });
      }

      return assigned;
    }),
  assignSignedToWithNewContact: protectedProcedure
    .input(assignSignedToWithNewContactInput)
    .mutation(async ({ ctx, input }) => {
      const assigned = await runInUnitOfWork(
        ctx,
        "items.assignSignedToWithNewContact",
        (repositories) =>
          assignSignedToWithNewContact({
            account: ctx.account,
            actorId: ctx.session.userId,
            itemId: input.id,
            contactDisplayName: input.contactDisplayName,
            auditRepository: repositories.auditRepository,
            contactRepository: repositories.contactRepository,
            itemRepository: repositories.itemRepository,
          }),
      );

      if (!assigned) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Item was not found.",
        });
      }

      return assigned;
    }),
  clearSignedTo: protectedProcedure
    .input(itemIdInput)
    .mutation(async ({ ctx, input }) => {
      const cleared = await runInUnitOfWork(
        ctx,
        "items.clearSignedTo",
        (repositories) =>
          clearSignedTo({
            account: ctx.account,
            actorId: ctx.session.userId,
            itemId: input.id,
            auditRepository: repositories.auditRepository,
            itemRepository: repositories.itemRepository,
          }),
      );

      if (!cleared) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Item was not found.",
        });
      }

      return cleared;
    }),
});
