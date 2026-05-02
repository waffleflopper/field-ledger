import type { StoragePort } from "@/modules/provider-boundaries/storage";
import type { DocumentRepository } from "./document-repository";

export async function getDocument({
  accountId,
  documentId,
  repository,
  storagePort,
  includeDownloadUrl = false,
}: {
  accountId: string;
  documentId: string;
  repository: DocumentRepository;
  storagePort?: StoragePort;
  includeDownloadUrl?: boolean;
}) {
  const document = await repository.findById(accountId, documentId);

  if (!document) {
    return null;
  }

  if (!includeDownloadUrl || !storagePort) {
    return { document, downloadUrl: null };
  }

  return {
    document,
    downloadUrl: await storagePort.createSignedDownloadUrl(
      document.storagePath,
    ),
  };
}
