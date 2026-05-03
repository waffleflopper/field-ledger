import type {
  AppUnitOfWork,
  AppUnitOfWorkRepositories,
} from "@/modules/provider-boundaries/database/app-unit-of-work";
import { InMemoryAccountRepository } from "./account-repository";
import { InMemoryAssignmentItemLinkRepository } from "./assignment-item-link-repository";
import { InMemoryAssignmentRepository } from "./assignment-repository";
import { InMemoryAuditRepository } from "./audit-repository";
import { InMemoryContactRepository } from "./contact-repository";
import { InMemoryDocumentRepository } from "./document-repository";
import { InMemoryHandReceiptRepository } from "./hand-receipt-repository";
import { InMemoryItemRepository } from "./item-repository";
import { InMemoryLocationRepository } from "./location-repository";
import { InMemoryRequirementCompletionRepository } from "./requirement-completion-repository";
import { InMemoryRequirementRepository } from "./requirement-repository";

export function createInMemoryAppUnitOfWork(
  repositories: Partial<AppUnitOfWorkRepositories> = {},
): AppUnitOfWork {
  const handReceiptRepository =
    repositories.handReceiptRepository ?? new InMemoryHandReceiptRepository();
  const assignmentItemLinkRepository =
    repositories.assignmentItemLinkRepository ??
    new InMemoryAssignmentItemLinkRepository();
  const assignmentRepository =
    repositories.assignmentRepository ?? new InMemoryAssignmentRepository();
  const auditRepository =
    repositories.auditRepository ?? new InMemoryAuditRepository();
  const contactRepository =
    repositories.contactRepository ?? new InMemoryContactRepository();
  const documentRepository =
    repositories.documentRepository ?? new InMemoryDocumentRepository();
  const accountRepository =
    repositories.accountRepository ?? new InMemoryAccountRepository();
  const itemRepository =
    repositories.itemRepository ?? new InMemoryItemRepository();
  const locationRepository =
    repositories.locationRepository ?? new InMemoryLocationRepository();
  const requirementRepository =
    repositories.requirementRepository ?? new InMemoryRequirementRepository();
  const requirementCompletionRepository =
    repositories.requirementCompletionRepository ??
    new InMemoryRequirementCompletionRepository();

  return {
    async run(operation) {
      const inMemoryHandReceiptRepository =
        handReceiptRepository instanceof InMemoryHandReceiptRepository
          ? handReceiptRepository
          : null;
      const inMemoryAssignmentItemLinkRepository =
        assignmentItemLinkRepository instanceof
        InMemoryAssignmentItemLinkRepository
          ? assignmentItemLinkRepository
          : null;
      const assignmentItemLinkSnapshot =
        inMemoryAssignmentItemLinkRepository !== null
          ? [...inMemoryAssignmentItemLinkRepository.links]
          : null;
      const inMemoryAssignmentRepository =
        assignmentRepository instanceof InMemoryAssignmentRepository
          ? assignmentRepository
          : null;
      const assignmentSnapshot =
        inMemoryAssignmentRepository !== null
          ? [...inMemoryAssignmentRepository.assignments]
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
      const inMemoryDocumentRepository =
        documentRepository instanceof InMemoryDocumentRepository
          ? documentRepository
          : null;
      const documentSnapshot =
        inMemoryDocumentRepository !== null
          ? [...inMemoryDocumentRepository.documents]
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
      const inMemoryRequirementCompletionRepository =
        requirementCompletionRepository instanceof
        InMemoryRequirementCompletionRepository
          ? requirementCompletionRepository
          : null;
      const requirementCompletionSnapshot =
        inMemoryRequirementCompletionRepository !== null
          ? [...inMemoryRequirementCompletionRepository.completions]
          : null;

      try {
        return await operation({
          accountRepository,
          assignmentItemLinkRepository,
          assignmentRepository,
          auditRepository,
          contactRepository,
          documentRepository,
          handReceiptRepository,
          itemRepository,
          locationRepository,
          requirementCompletionRepository,
          requirementRepository,
        });
      } catch (error) {
        if (inMemoryHandReceiptRepository && handReceiptSnapshot) {
          inMemoryHandReceiptRepository.handReceipts = handReceiptSnapshot;
        }

        if (
          inMemoryAssignmentItemLinkRepository &&
          assignmentItemLinkSnapshot
        ) {
          inMemoryAssignmentItemLinkRepository.links =
            assignmentItemLinkSnapshot;
        }

        if (inMemoryAssignmentRepository && assignmentSnapshot) {
          inMemoryAssignmentRepository.assignments = assignmentSnapshot;
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

        if (inMemoryDocumentRepository && documentSnapshot) {
          inMemoryDocumentRepository.documents = documentSnapshot;
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

        if (
          inMemoryRequirementCompletionRepository &&
          requirementCompletionSnapshot
        ) {
          inMemoryRequirementCompletionRepository.completions =
            requirementCompletionSnapshot;
        }

        throw error;
      }
    },
  };
}
