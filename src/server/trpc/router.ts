import { createTRPCRouter } from "@/server/trpc/init";
import { foundationRouter } from "@/server/trpc/routers/foundation";

export const appRouter = createTRPCRouter({
  foundation: foundationRouter,
});

export type AppRouter = typeof appRouter;
