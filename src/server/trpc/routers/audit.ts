import { z } from "zod";

import { listRecentActivity, listTargetActivity } from "@/modules/audit";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc/init";

const activityLimitInput = z
  .object({
    limit: z.number().int().min(1).max(50).optional(),
  })
  .optional();

export const auditRouter = createTRPCRouter({
  listRecentActivity: protectedProcedure
    .input(activityLimitInput)
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
  listTargetActivity: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(50).optional(),
        targetId: z.string().min(1),
        targetType: z.literal("hand_receipt"),
      }),
    )
    .query(({ ctx, input }) =>
      listTargetActivity(
        input.limit === undefined
          ? {
              accountId: ctx.account.id,
              repository: ctx.auditRepository,
              targetId: input.targetId,
              targetType: input.targetType,
            }
          : {
              accountId: ctx.account.id,
              repository: ctx.auditRepository,
              targetId: input.targetId,
              targetType: input.targetType,
              limit: input.limit,
            },
      ),
    ),
});
