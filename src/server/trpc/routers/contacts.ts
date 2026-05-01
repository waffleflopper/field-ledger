import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  createContact,
  listContacts,
  searchContacts,
} from "@/modules/contacts";
import type {
  AppUnitOfWork,
  AppUnitOfWorkRepositories,
} from "@/modules/provider-boundaries/database/app-unit-of-work";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc/init";

const contactDisplayNameInput = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Contact display name is required.")
    .max(120),
});

const searchContactsInput = z.object({
  query: z.string().max(120).optional().default(""),
});

function toTRPCError(error: unknown): never {
  const message =
    error instanceof Error ? error.message : "Unable to update contacts.";

  switch (message) {
    case "This account is read-only.":
      throw new TRPCError({ code: "FORBIDDEN", message });
    case "Contact display name is required.":
      throw new TRPCError({ code: "BAD_REQUEST", message });
    default:
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message });
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

export const contactsRouter = createTRPCRouter({
  list: protectedProcedure.query(({ ctx }) =>
    listContacts({
      accountId: ctx.account.id,
      repository: ctx.contactRepository,
    }),
  ),
  search: protectedProcedure
    .input(searchContactsInput)
    .query(({ ctx, input }) =>
      searchContacts({
        accountId: ctx.account.id,
        query: input.query,
        repository: ctx.contactRepository,
      }),
    ),
  create: protectedProcedure
    .input(contactDisplayNameInput)
    .mutation(({ ctx, input }) =>
      runInUnitOfWork(ctx, (repositories) =>
        createContact({
          account: ctx.account,
          actorId: ctx.session.userId,
          input,
          contactRepository: repositories.contactRepository,
          auditRepository: repositories.auditRepository,
        }),
      ),
    ),
});
