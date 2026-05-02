import type { AuditRepository } from "@/modules/audit";
import { createTransactionalDrizzleAuditRepository } from "@/modules/audit/infrastructure/drizzle-audit-repository";
import type { ContactRepository } from "@/modules/contacts";
import { createTransactionalDrizzleContactRepository } from "@/modules/contacts/infrastructure/drizzle-contact-repository";
import type { DocumentRepository } from "@/modules/documents";
import { createTransactionalDrizzleDocumentRepository } from "@/modules/documents/infrastructure/drizzle-document-repository";
import type { AccountRepository } from "@/modules/accounts/application/ensure-account";
import { createTransactionalDrizzleAccountRepository } from "@/modules/accounts/infrastructure/drizzle-account-repository";
import type { HandReceiptRepository } from "@/modules/hand-receipts";
import { createTransactionalDrizzleHandReceiptRepository } from "@/modules/hand-receipts/infrastructure/drizzle-hand-receipt-repository";
import type { ItemRepository } from "@/modules/items";
import { createTransactionalDrizzleItemRepository } from "@/modules/items/infrastructure/drizzle-item-repository";
import type { LocationRepository } from "@/modules/locations";
import { createTransactionalDrizzleLocationRepository } from "@/modules/locations/infrastructure/drizzle-location-repository";
import type { RequirementRepository } from "@/modules/requirements";
import type { RequirementCompletionRepository } from "@/modules/requirements";
import { createTransactionalDrizzleRequirementCompletionRepository } from "@/modules/requirements/infrastructure/drizzle-requirement-completion-repository";
import { createTransactionalDrizzleRequirementRepository } from "@/modules/requirements/infrastructure/drizzle-requirement-repository";
import type { AuthenticatedDatabaseSession } from "./authenticated-session";
import { runWithAuthenticatedDatabaseSession } from "./authenticated-session";
import type { createDrizzleClient } from "./drizzle";

type DrizzleClient = ReturnType<typeof createDrizzleClient>;

export type AppUnitOfWorkRepositories = {
  accountRepository: AccountRepository;
  auditRepository: AuditRepository;
  contactRepository: ContactRepository;
  documentRepository: DocumentRepository;
  handReceiptRepository: HandReceiptRepository;
  itemRepository: ItemRepository;
  locationRepository: LocationRepository;
  requirementCompletionRepository: RequirementCompletionRepository;
  requirementRepository: RequirementRepository;
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
          contactRepository:
            createTransactionalDrizzleContactRepository(transaction),
          documentRepository:
            createTransactionalDrizzleDocumentRepository(transaction),
          handReceiptRepository:
            createTransactionalDrizzleHandReceiptRepository(transaction),
          itemRepository: createTransactionalDrizzleItemRepository(transaction),
          locationRepository:
            createTransactionalDrizzleLocationRepository(transaction),
          requirementCompletionRepository:
            createTransactionalDrizzleRequirementCompletionRepository(
              transaction,
            ),
          requirementRepository:
            createTransactionalDrizzleRequirementRepository(transaction),
        }),
      );
    },
  };
}
