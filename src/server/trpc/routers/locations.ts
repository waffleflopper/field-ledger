import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  createLocation,
  listLocations,
  searchLocations,
} from "@/modules/locations";
import type {
  AppUnitOfWork,
  AppUnitOfWorkRepositories,
} from "@/modules/provider-boundaries/database/app-unit-of-work";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc/init";

const locationNameInput = z.object({
  name: z.string().trim().min(1, "Location name is required.").max(120),
});

const searchLocationsInput = z.object({
  query: z.string().max(120).optional().default(""),
});

function toTRPCError(error: unknown): never {
  const message =
    error instanceof Error ? error.message : "Unable to update locations.";

  switch (message) {
    case "This account is read-only.":
      throw new TRPCError({ code: "FORBIDDEN", message });
    case "Location name is required.":
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
      runInUnitOfWork(ctx, (repositories) =>
        createLocation({
          account: ctx.account,
          actorId: ctx.session.userId,
          input,
          locationRepository: repositories.locationRepository,
          auditRepository: repositories.auditRepository,
        }),
      ),
    ),
});
