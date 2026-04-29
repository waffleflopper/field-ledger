import { getScaffoldHealth } from "@/modules/app-foundation/application/get-scaffold-health";
import { createTRPCRouter, publicProcedure } from "@/server/trpc/init";

export const foundationRouter = createTRPCRouter({
  health: publicProcedure.query(() => getScaffoldHealth()),
});
