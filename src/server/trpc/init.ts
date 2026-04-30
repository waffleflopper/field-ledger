import { initTRPC } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import superjson from "superjson";

import type { TRPCContext } from "@/server/trpc/context";

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session || !ctx.account) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "An initialized Field Ledger account is required.",
    });
  }

  return next({
    ctx: {
      session: ctx.session,
      account: ctx.account,
      accountRepository: ctx.accountRepository,
      auditRepository: ctx.auditRepository,
    },
  });
});
