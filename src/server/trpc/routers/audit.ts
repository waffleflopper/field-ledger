import { z } from "zod";

import { listRecentActivity, listTargetActivity } from "@/modules/audit";
import type { AuditRepository } from "@/modules/audit";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc/init";

const activityLimitInput = z
  .object({
    limit: z.number().int().min(1).max(50).optional(),
  })
  .optional();

function activityOptions(
  accountId: string,
  repository: AuditRepository,
  limit: number | undefined,
) {
  return limit === undefined
    ? {
        accountId,
        repository,
      }
    : {
        accountId,
        repository,
        limit,
      };
}

export const auditRouter = createTRPCRouter({
  listRecentActivity: protectedProcedure
    .input(activityLimitInput)
    .query(({ ctx, input }) =>
      listRecentActivity(
        activityOptions(ctx.account.id, ctx.auditRepository, input?.limit),
      ),
    ),
  listTargetActivity: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(50).optional(),
        targetId: z.string().min(1),
        targetType: z.literal("hand_receipt"),
      }),
    )
    .query(({ ctx, input }) =>
      listTargetActivity({
        ...activityOptions(ctx.account.id, ctx.auditRepository, input.limit),
        targetId: input.targetId,
        targetType: input.targetType,
      }),
    ),
});
