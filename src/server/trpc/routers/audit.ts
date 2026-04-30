import { z } from "zod";

import { listRecentActivity } from "@/modules/audit";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc/init";

export const auditRouter = createTRPCRouter({
  listRecentActivity: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().int().min(1).max(50).optional(),
        })
        .optional(),
    )
    .query(({ ctx, input }) => {
      const options = {
        accountId: ctx.account.id,
        repository: ctx.auditRepository,
      };

      return listRecentActivity(
        input?.limit === undefined
          ? options
          : {
              ...options,
              limit: input.limit,
            },
      );
    }),
});
