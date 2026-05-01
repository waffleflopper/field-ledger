import type {
  AppUnitOfWork,
  AppUnitOfWorkRepositories,
} from "@/modules/provider-boundaries/database/app-unit-of-work";
import { InMemoryAccountRepository } from "./account-repository";
import { InMemoryAuditRepository } from "./audit-repository";
import { InMemoryContactRepository } from "./contact-repository";
import { InMemoryHandReceiptRepository } from "./hand-receipt-repository";
import { InMemoryItemRepository } from "./item-repository";
import { InMemoryLocationRepository } from "./location-repository";
import { InMemoryRequirementRepository } from "./requirement-repository";

export function createInMemoryAppUnitOfWork(
  repositories: Partial<AppUnitOfWorkRepositories> = {},
): AppUnitOfWork {
  const handReceiptRepository =
    repositories.handReceiptRepository ?? new InMemoryHandReceiptRepository();
  const auditRepository =
    repositories.auditRepository ?? new InMemoryAuditRepository();
  const contactRepository =
    repositories.contactRepository ?? new InMemoryContactRepository();
  const accountRepository =
    repositories.accountRepository ?? new InMemoryAccountRepository();
  const itemRepository =
    repositories.itemRepository ?? new InMemoryItemRepository();
  const locationRepository =
    repositories.locationRepository ?? new InMemoryLocationRepository();
  const requirementRepository =
    repositories.requirementRepository ?? new InMemoryRequirementRepository();

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
      const inMemoryContactRepository =
        contactRepository instanceof InMemoryContactRepository
          ? contactRepository
          : null;
      const contactSnapshot =
        inMemoryContactRepository !== null
          ? [...inMemoryContactRepository.contacts]
          : null;
      const inMemoryLocationRepository =
        locationRepository instanceof InMemoryLocationRepository
          ? locationRepository
          : null;
      const locationSnapshot =
        inMemoryLocationRepository !== null
          ? [...inMemoryLocationRepository.locations]
          : null;
      const inMemoryAccountRepository =
        accountRepository instanceof InMemoryAccountRepository
          ? accountRepository
          : null;
      const accountSnapshot =
        inMemoryAccountRepository !== null
          ? inMemoryAccountRepository.snapshotState()
          : null;
      const inMemoryRequirementRepository =
        requirementRepository instanceof InMemoryRequirementRepository
          ? requirementRepository
          : null;
      const requirementSnapshot =
        inMemoryRequirementRepository !== null
          ? [...inMemoryRequirementRepository.requirements]
          : null;

      try {
        return await operation({
          accountRepository,
          auditRepository,
          contactRepository,
          handReceiptRepository,
          itemRepository,
          locationRepository,
          requirementRepository,
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

        if (inMemoryContactRepository && contactSnapshot) {
          inMemoryContactRepository.contacts = contactSnapshot;
        }

        if (inMemoryLocationRepository && locationSnapshot) {
          inMemoryLocationRepository.locations = locationSnapshot;
        }

        if (inMemoryAccountRepository && accountSnapshot) {
          inMemoryAccountRepository.restoreState(accountSnapshot);
        }

        if (inMemoryRequirementRepository && requirementSnapshot) {
          inMemoryRequirementRepository.requirements = requirementSnapshot;
        }

        throw error;
      }
    },
  };
}
