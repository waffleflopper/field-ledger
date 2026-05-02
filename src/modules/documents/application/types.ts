export const ACCEPTED_DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
] as const;

export const MAX_DOCUMENT_UPLOAD_SIZE_BYTES = 20 * 1024 * 1024;

export type AcceptedDocumentMimeType =
  (typeof ACCEPTED_DOCUMENT_MIME_TYPES)[number];

export type DocumentRecord = {
  id: string;
  accountId: string;
  handReceiptId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  uploadedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type NewDocumentRecord = Omit<
  DocumentRecord,
  "id" | "createdAt" | "updatedAt"
> & {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type UploadDocumentInput = {
  filename: string;
  mimeType: string;
  sizeBytes: number;
  handReceiptId: string;
};

export type CompleteDocumentUploadInput = UploadDocumentInput & {
  documentId: string;
};

export class UnsupportedDocumentMimeTypeError extends Error {
  constructor(mimeType: string) {
    super(`Unsupported document type: ${mimeType}.`);
    this.name = "UnsupportedDocumentMimeTypeError";
  }
}

export class DocumentUploadReadOnlyError extends Error {
  constructor() {
    super("This account is read-only.");
    this.name = "DocumentUploadReadOnlyError";
  }
}
