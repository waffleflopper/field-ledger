import { deriveAccountCapabilities } from "@/modules/billing";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc/init";

export const billingRouter = createTRPCRouter({
  capabilities: protectedProcedure.query(({ ctx }) =>
    deriveAccountCapabilities(ctx.account),
  ),
  status: protectedProcedure.query(({ ctx }) => ({
    ...deriveAccountCapabilities(ctx.account),
    trialStartsAt: ctx.account.trialStartsAt,
    trialEndsAt: ctx.account.trialEndsAt,
  })),
});
