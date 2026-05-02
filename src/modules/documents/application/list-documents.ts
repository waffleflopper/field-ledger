import type { DocumentRepository } from "./document-repository";

export function listDocuments({
  accountId,
  handReceiptId,
  repository,
}: {
  accountId: string;
  handReceiptId?: string;
  repository: DocumentRepository;
}) {
  return repository.listByAccountId(
    accountId,
    handReceiptId ? { handReceiptId } : undefined,
  );
}
