import {
  completeOnboarding,
  getOnboardingStatus,
} from "@/modules/accounts/application/ensure-account";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc/init";

export const accountsRouter = createTRPCRouter({
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
