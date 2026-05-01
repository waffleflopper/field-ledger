import type { AuditRepository } from "@/modules/audit";
import { createTransactionalDrizzleAuditRepository } from "@/modules/audit/infrastructure/drizzle-audit-repository";
import type { HandReceiptRepository } from "@/modules/hand-receipts";
import { createTransactionalDrizzleHandReceiptRepository } from "@/modules/hand-receipts/infrastructure/drizzle-hand-receipt-repository";
import type { AuthenticatedDatabaseSession } from "./authenticated-session";
import { runWithAuthenticatedDatabaseSession } from "./authenticated-session";
import type { createDrizzleClient } from "./drizzle";

type DrizzleClient = ReturnType<typeof createDrizzleClient>;

export type AppUnitOfWorkRepositories = {
  auditRepository: AuditRepository;
  handReceiptRepository: HandReceiptRepository;
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
          auditRepository:
            createTransactionalDrizzleAuditRepository(transaction),
          handReceiptRepository:
            createTransactionalDrizzleHandReceiptRepository(transaction),
        }),
      );
    },
  };
}
