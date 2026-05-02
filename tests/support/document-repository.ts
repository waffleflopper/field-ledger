import type {
  DocumentRecord,
  DocumentRepository,
  NewDocumentRecord,
} from "@/modules/documents";

export class InMemoryDocumentRepository implements DocumentRepository {
  documents: DocumentRecord[] = [];

  constructor(documents: DocumentRecord[] = []) {
    this.documents = [...documents];
  }

  async create(document: NewDocumentRecord) {
    const createdDocument = {
      ...document,
      id: document.id ?? `document-${this.documents.length + 1}`,
      createdAt: document.createdAt ?? new Date(),
      updatedAt: document.updatedAt ?? new Date(),
    };

    this.documents.push(createdDocument);
    return createdDocument;
  }

  async findById(accountId: string, documentId: string) {
    return (
      this.documents.find(
        (document) =>
          document.accountId === accountId && document.id === documentId,
      ) ?? null
    );
  }

  async listByAccountId(accountId: string, options = {}) {
    const { handReceiptId, limit = 50 } = options as {
      handReceiptId?: string;
      limit?: number;
    };

    return this.documents
      .filter((document) => document.accountId === accountId)
      .filter(
        (document) =>
          handReceiptId === undefined ||
          document.handReceiptId === handReceiptId,
      )
      .sort(
        (left, right) => right.uploadedAt.getTime() - left.uploadedAt.getTime(),
      )
      .slice(0, limit);
  }
}

export function createEmptyDocumentRepository() {
  return new InMemoryDocumentRepository();
}
