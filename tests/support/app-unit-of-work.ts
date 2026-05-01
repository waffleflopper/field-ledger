import type {
  AppUnitOfWork,
  AppUnitOfWorkRepositories,
} from "@/modules/provider-boundaries/database/app-unit-of-work";
import { InMemoryAccountRepository } from "./account-repository";
import { InMemoryAuditRepository } from "./audit-repository";
import { InMemoryHandReceiptRepository } from "./hand-receipt-repository";
import { InMemoryItemRepository } from "./item-repository";

export function createInMemoryAppUnitOfWork(
  repositories: Partial<AppUnitOfWorkRepositories> = {},
): AppUnitOfWork {
  const handReceiptRepository =
    repositories.handReceiptRepository ?? new InMemoryHandReceiptRepository();
  const auditRepository =
    repositories.auditRepository ?? new InMemoryAuditRepository();
  const accountRepository =
    repositories.accountRepository ?? new InMemoryAccountRepository();
  const itemRepository =
    repositories.itemRepository ?? new InMemoryItemRepository();

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
      const inMemoryItemRepository =
        itemRepository instanceof InMemoryItemRepository
          ? itemRepository
          : null;
      const itemSnapshot =
        inMemoryItemRepository !== null
          ? [...inMemoryItemRepository.items]
          : null;

      try {
        return await operation({
          accountRepository,
          auditRepository,
          handReceiptRepository,
          itemRepository,
        });
      } catch (error) {
        if (inMemoryHandReceiptRepository && handReceiptSnapshot) {
          inMemoryHandReceiptRepository.handReceipts = handReceiptSnapshot;
        }

        if (inMemoryAuditRepository && auditSnapshot) {
          inMemoryAuditRepository.events = auditSnapshot;
        }

        if (inMemoryItemRepository && itemSnapshot) {
          inMemoryItemRepository.items = itemSnapshot;
        }

        throw error;
      }
    },
  };
}
