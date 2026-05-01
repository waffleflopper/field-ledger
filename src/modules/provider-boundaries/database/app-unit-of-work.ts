import type { AuditRepository } from "@/modules/audit";
import { createTransactionalDrizzleAuditRepository } from "@/modules/audit/infrastructure/drizzle-audit-repository";
import type { AccountRepository } from "@/modules/accounts/application/ensure-account";
import { createTransactionalDrizzleAccountRepository } from "@/modules/accounts/infrastructure/drizzle-account-repository";
import type { HandReceiptRepository } from "@/modules/hand-receipts";
import { createTransactionalDrizzleHandReceiptRepository } from "@/modules/hand-receipts/infrastructure/drizzle-hand-receipt-repository";
import type { ItemRepository } from "@/modules/items";
import { createTransactionalDrizzleItemRepository } from "@/modules/items/infrastructure/drizzle-item-repository";
import type { AuthenticatedDatabaseSession } from "./authenticated-session";
import { runWithAuthenticatedDatabaseSession } from "./authenticated-session";
import type { createDrizzleClient } from "./drizzle";

type DrizzleClient = ReturnType<typeof createDrizzleClient>;

export type AppUnitOfWorkRepositories = {
  accountRepository: AccountRepository;
  auditRepository: AuditRepository;
  handReceiptRepository: HandReceiptRepository;
  itemRepository: ItemRepository;
};

export type AppUnitOfWork = {
  run<T>(
    operation: (repositories: AppUnitOfWorkRepositories) => Promise<T>,
  ): Promise<T>;
};

export function createUnavailableAppUnitOfWork(): AppUnitOfWork {
  return {
    async run() {
      throw new Error("An authenticated database session is required.");
    },
  };
}

export function createDrizzleAppUnitOfWork(
  db: DrizzleClient,
  session: AuthenticatedDatabaseSession,
): AppUnitOfWork {
  return {
    run(operation) {
      return runWithAuthenticatedDatabaseSession(db, session, (transaction) =>
        operation({
          accountRepository:
            createTransactionalDrizzleAccountRepository(transaction),
          auditRepository:
            createTransactionalDrizzleAuditRepository(transaction),
          handReceiptRepository:
            createTransactionalDrizzleHandReceiptRepository(transaction),
          itemRepository: createTransactionalDrizzleItemRepository(transaction),
        }),
      );
    },
  };
}
