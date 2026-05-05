import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  archiveLocation,
  createLocation,
  listLocations,
  searchLocations,
  updateLocation,
} from "@/modules/locations";
import type {
  AppUnitOfWork,
  AppUnitOfWorkRepositories,
} from "@/modules/provider-boundaries/database/app-unit-of-work";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc/init";

const locationNameInput = z.object({
  name: z.string().trim().min(1, "Location name is required.").max(120),
});

const locationIdInput = z.object({
  id: z.uuid(),
});

const updateLocationInput = locationNameInput.extend({
  id: z.uuid(),
});

const searchLocationsInput = z.object({
  query: z.string().max(120).optional().default(""),
});

function toTRPCError(
  error: unknown,
  context: { accountId: string; operation: string; userId: string },
): never {
  const message =
    error instanceof Error ? error.message : "Unable to create location.";

  switch (message) {
    case "This account is read-only.":
      throw new TRPCError({ code: "FORBIDDEN", message });
    case "Location name is required.":
      throw new TRPCError({ code: "BAD_REQUEST", message });
    case "Location is already archived.":
      throw new TRPCError({ code: "CONFLICT", message });
    default:
      console.error("Unexpected locations tRPC error.", {
        accountId: context.accountId,
        operation: context.operation,
        userId: context.userId,
        error,
      });
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Unable to create location.",
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

export const locationsRouter = createTRPCRouter({
  list: protectedProcedure.query(({ ctx }) =>
    listLocations({
      accountId: ctx.account.id,
      repository: ctx.locationRepository,
    }),
  ),
  search: protectedProcedure
    .input(searchLocationsInput)
    .query(({ ctx, input }) =>
      searchLocations({
        accountId: ctx.account.id,
        query: input.query,
        repository: ctx.locationRepository,
      }),
    ),
  create: protectedProcedure
    .input(locationNameInput)
    .mutation(({ ctx, input }) =>
      runInUnitOfWork(ctx, "locations.create", (repositories) =>
        createLocation({
          account: ctx.account,
          actorId: ctx.session.userId,
          input,
          locationRepository: repositories.locationRepository,
          auditRepository: repositories.auditRepository,
        }),
      ),
    ),
  update: protectedProcedure
    .input(updateLocationInput)
    .mutation(async ({ ctx, input }) => {
      const updated = await runInUnitOfWork(
        ctx,
        "locations.update",
        (repositories) =>
          updateLocation({
            account: ctx.account,
            actorId: ctx.session.userId,
            locationId: input.id,
            input: {
              name: input.name,
            },
            locationRepository: repositories.locationRepository,
            auditRepository: repositories.auditRepository,
          }),
      );

      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Location was not found.",
        });
      }

      return updated;
    }),
  archive: protectedProcedure
    .input(locationIdInput)
    .mutation(async ({ ctx, input }) => {
      const archived = await runInUnitOfWork(
        ctx,
        "locations.archive",
        (repositories) =>
          archiveLocation({
            account: ctx.account,
            actorId: ctx.session.userId,
            locationId: input.id,
            locationRepository: repositories.locationRepository,
            auditRepository: repositories.auditRepository,
          }),
      );

      if (!archived) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Location was not found.",
        });
      }

      return archived;
    }),
});
