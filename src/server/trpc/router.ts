import { createTRPCRouter } from "@/server/trpc/init";
import { billingRouter } from "@/server/trpc/routers/billing";
import { foundationRouter } from "@/server/trpc/routers/foundation";

export const appRouter = createTRPCRouter({
  billing: billingRouter,
  foundation: foundationRouter,
});

export type AppRouter = typeof appRouter;
