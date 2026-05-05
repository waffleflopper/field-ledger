import {
  completeOnboarding,
  getAccountSessionSummary,
  getOnboardingStatus,
} from "@/modules/accounts/application/ensure-account";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc/init";

export const accountsRouter = createTRPCRouter({
  me: protectedProcedure.query(({ ctx }) =>
    getAccountSessionSummary({
      account: ctx.account,
      email: ctx.session.email,
    }),
  ),
  getOnboardingStatus: protectedProcedure.query(({ ctx }) =>
    getOnboardingStatus({ account: ctx.account }),
  ),
  completeOnboarding: protectedProcedure.mutation(({ ctx }) =>
    ctx.unitOfWork.run((repositories) =>
      completeOnboarding({
        account: ctx.account,
        repository: repositories.accountRepository,
        auditRepository: repositories.auditRepository,
      }),
    ),
  ),
});
