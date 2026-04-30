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
    },
    handReceiptRepository: {
      async createWithAuditEvent() {
        throw new Error("Foundation check should not create hand receipts.");
      },
      async findByAccountId() {
        return [];
      },
      async findById() {
        return null;
      },
      async updateWithAuditEvent() {
        throw new Error("Foundation check should not update hand receipts.");
      },
      async countActiveByAccountId() {
        return 0;
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
