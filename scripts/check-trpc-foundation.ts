import { appRouter } from "../src/server/trpc/router";

async function main() {
  const caller = appRouter.createCaller({
    session: null,
    account: null,
    accountRepository: {
      async findByUserId() {
        return null;
      },
      async create() {
        return null;
      },
      async markOnboardingCompleted() {
        return null;
      },
    },
    auditRepository: {
      async record() {
        throw new Error("Foundation check should not record audit events.");
      },
      async listByAccountId() {
        return [];
      },
      async listByTarget() {
        return [];
      },
    },
    handReceiptRepository: {
      async create() {
        throw new Error("Foundation check should not create hand receipts.");
      },
      async findByAccountId() {
        return [];
      },
      async findById() {
        return null;
      },
      async update() {
        throw new Error("Foundation check should not update hand receipts.");
      },
      async countActiveByAccountId() {
        return 0;
      },
    },
    unitOfWork: {
      async run() {
        throw new Error("Foundation check should not start a unit of work.");
      },
    },
  });
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
