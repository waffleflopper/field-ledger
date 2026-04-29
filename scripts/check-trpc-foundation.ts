import { appRouter } from "../src/server/trpc/router";

async function main() {
  const caller = appRouter.createCaller({});
  const health = await caller.foundation.health();

  if (
    health.status !== "ok" ||
    health.api !== "trpc" ||
    health.queryClient !== "tanstack-query"
  ) {
    throw new Error("Unexpected tRPC foundation health response.");
  }

  console.log("tRPC foundation check OK.");
}

void main();
