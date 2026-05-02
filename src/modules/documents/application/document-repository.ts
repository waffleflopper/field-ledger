import type { DocumentRecord, NewDocumentRecord } from "./types";

export type ListDocumentsOptions = {
  handReceiptId?: string;
  limit?: number;
};

export type DocumentRepository = {
  create(record: NewDocumentRecord): Promise<DocumentRecord>;
  findById(
    accountId: string,
    documentId: string,
  ): Promise<DocumentRecord | null>;
  listByAccountId(
    accountId: string,
    options?: ListDocumentsOptions,
  ): Promise<DocumentRecord[]>;
};

export function createUnavailableDocumentRepository(): DocumentRepository {
  return {
    async create() {
      throw new Error("An authenticated document repository is required.");
    },
    async findById() {
      throw new Error("An authenticated document repository is required.");
    },
    async listByAccountId() {
      throw new Error("An authenticated document repository is required.");
    },
  };
}
