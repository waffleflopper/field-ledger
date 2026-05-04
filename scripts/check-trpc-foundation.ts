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
      async incrementAndGetNextItemSequence() {
        throw new Error("Foundation check should not allocate item sequences.");
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
    contactRepository: {
      async create() {
        throw new Error("Foundation check should not create contacts.");
      },
      async findByAccountId() {
        return [];
      },
      async findById() {
        return null;
      },
      async searchByName() {
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
      async findManyByIds() {
        return [];
      },
      async update() {
        throw new Error("Foundation check should not update hand receipts.");
      },
      async countActiveByAccountId() {
        return 0;
      },
    },
    itemRepository: {
      async create() {
        throw new Error("Foundation check should not create items.");
      },
      async findByAccountId() {
        return [];
      },
      async findById() {
        return null;
      },
      async findManyByIds() {
        return [];
      },
      async findByHandReceiptId() {
        return [];
      },
      async update() {
        throw new Error("Foundation check should not update items.");
      },
      async findByEcn() {
        return [];
      },
      async findBySerialNumber() {
        return [];
      },
      async countActiveByAccountId() {
        return 0;
      },
      async countActiveByHandReceiptId() {
        return 0;
      },
      async search() {
        return [];
      },
    },
    locationRepository: {
      async create() {
        throw new Error("Foundation check should not create locations.");
      },
      async findByAccountId() {
        return [];
      },
      async findById() {
        return null;
      },
      async searchByName() {
        return [];
      },
    },
    requirementRepository: {
      async create() {
        throw new Error("Foundation check should not create requirements.");
      },
      async findById() {
        return null;
      },
      async findByItemId() {
        return [];
      },
      async findByName() {
        return null;
      },
      async findDashboardRequirements() {
        return [];
      },
      async update() {
        throw new Error("Foundation check should not update requirements.");
      },
      async updateNextDueDate() {
        throw new Error("Foundation check should not update requirements.");
      },
      async updateLifecycle() {
        throw new Error("Foundation check should not update requirements.");
      },
    },
    requirementCompletionRepository: {
      async create() {
        throw new Error(
          "Foundation check should not create requirement completions.",
        );
      },
      async listByRequirementId() {
        return [];
      },
      async findLatestByRequirementId() {
        return null;
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
