import type {
  AppUnitOfWork,
  AppUnitOfWorkRepositories,
} from "@/modules/provider-boundaries/database/app-unit-of-work";
import { InMemoryAuditRepository } from "./audit-repository";
import { InMemoryHandReceiptRepository } from "./hand-receipt-repository";

export function createInMemoryAppUnitOfWork(
  repositories: Partial<AppUnitOfWorkRepositories> = {},
): AppUnitOfWork {
  const handReceiptRepository =
    repositories.handReceiptRepository ?? new InMemoryHandReceiptRepository();
  const auditRepository =
    repositories.auditRepository ?? new InMemoryAuditRepository();

  return {
    async run(operation) {
      const inMemoryHandReceiptRepository =
        handReceiptRepository instanceof InMemoryHandReceiptRepository
          ? handReceiptRepository
          : null;
      const inMemoryAuditRepository =
        auditRepository instanceof InMemoryAuditRepository
          ? auditRepository
          : null;
      const handReceiptSnapshot =
        inMemoryHandReceiptRepository !== null
          ? [...inMemoryHandReceiptRepository.handReceipts]
          : null;
      const auditSnapshot =
        inMemoryAuditRepository !== null
          ? [...inMemoryAuditRepository.events]
          : null;

      try {
        return await operation({
          auditRepository,
          handReceiptRepository,
        });
      } catch (error) {
        if (inMemoryHandReceiptRepository && handReceiptSnapshot) {
          inMemoryHandReceiptRepository.handReceipts = handReceiptSnapshot;
        }

        if (inMemoryAuditRepository && auditSnapshot) {
          inMemoryAuditRepository.events = auditSnapshot;
        }

        throw error;
      }
    },
  };
}
