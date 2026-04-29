import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import type { NextRequest } from "next/server";

import { createTRPCContext } from "@/server/trpc/context";
import { appRouter } from "@/server/trpc/router";

function handler(request: NextRequest) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: request,
    router: appRouter,
    createContext: createTRPCContext,
  });
}

export { handler as GET, handler as POST };
