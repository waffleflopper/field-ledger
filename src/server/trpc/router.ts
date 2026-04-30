import { createTRPCRouter } from "@/server/trpc/init";
import { accountsRouter } from "@/server/trpc/routers/accounts";
import { auditRouter } from "@/server/trpc/routers/audit";
import { billingRouter } from "@/server/trpc/routers/billing";
import { foundationRouter } from "@/server/trpc/routers/foundation";

export const appRouter = createTRPCRouter({
  accounts: accountsRouter,
  audit: auditRouter,
  billing: billingRouter,
  foundation: foundationRouter,
});

export type AppRouter = typeof appRouter;
