import type { AccountRecord } from "@/modules/accounts/application/ensure-account";
import { recordAuditEvent, type AuditRepository } from "@/modules/audit";
import {
  canUploadDocument,
  deriveAccountCapabilities,
} from "@/modules/billing";
import type { HandReceiptRepository } from "@/modules/hand-receipts";
import type { StoragePort } from "@/modules/provider-boundaries/storage";
import type { DocumentRepository } from "./document-repository";
import {
  ACCEPTED_DOCUMENT_MIME_TYPES,
  type AcceptedDocumentMimeType,
  type CompleteDocumentUploadInput,
  DocumentUploadReadOnlyError,
  MAX_DOCUMENT_UPLOAD_SIZE_BYTES,
  UnsupportedDocumentMimeTypeError,
  type UploadDocumentInput,
} from "./types";

type InitiateDocumentUploadArgs = {
  account: AccountRecord;
  input: UploadDocumentInput;
  handReceiptRepository: HandReceiptRepository;
  storagePort: StoragePort;
  now?: Date;
  createDocumentId?: () => string;
};

type CompleteDocumentUploadArgs = {
  account: AccountRecord;
  actorId: string;
  input: CompleteDocumentUploadInput;
  documentRepository: DocumentRepository;
  handReceiptRepository: HandReceiptRepository;
  auditRepository: AuditRepository;
  now?: Date;
};

function cleanFilename(filename: string) {
  const trimmed = filename.trim();

  if (!trimmed) {
    throw new Error("Document filename is required.");
  }

  return trimmed;
}

async function validateDocumentUpload({
  account,
  input,
  handReceiptRepository,
  now,
}: {
  account: AccountRecord;
  input: UploadDocumentInput;
  handReceiptRepository: HandReceiptRepository;
  now: Date;
}) {
  const capabilities = deriveAccountCapabilities(account, now);

  if (!canUploadDocument(capabilities)) {
    throw new DocumentUploadReadOnlyError();
  }

  if (
    !ACCEPTED_DOCUMENT_MIME_TYPES.includes(
      input.mimeType as AcceptedDocumentMimeType,
    )
  ) {
    throw new UnsupportedDocumentMimeTypeError(input.mimeType);
  }

  if (!Number.isInteger(input.sizeBytes) || input.sizeBytes <= 0) {
    throw new Error("Document file size must be greater than zero.");
  }

  if (input.sizeBytes > MAX_DOCUMENT_UPLOAD_SIZE_BYTES) {
    throw new Error("Document file size must be 20 MiB or smaller.");
  }

  const handReceipt = await handReceiptRepository.findById(
    account.id,
    input.handReceiptId,
  );

  if (!handReceipt) {
    throw new Error("Hand receipt was not found.");
  }

  if (handReceipt.status !== "active") {
    throw new Error("Hand receipt must be active to upload documents.");
  }
}

export async function initiateDocumentUpload({
  account,
  input,
  handReceiptRepository,
  storagePort,
  now = new Date(),
  createDocumentId = () => globalThis.crypto.randomUUID(),
}: InitiateDocumentUploadArgs) {
  await validateDocumentUpload({
    account,
    input,
    handReceiptRepository,
    now,
  });

  const documentId = createDocumentId();
  const filename = cleanFilename(input.filename);
  const storagePath = `${account.id}/${documentId}`;
  const upload = await storagePort.createSignedUploadUrl(storagePath);

  return {
    pendingDocument: {
      id: documentId,
      handReceiptId: input.handReceiptId,
      filename,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      storagePath: upload.path,
    },
    signedUploadUrl: upload.signedUrl,
    uploadToken: upload.token,
    storagePath: upload.path,
  };
}

export async function completeDocumentUpload({
  account,
  actorId,
  input,
  documentRepository,
  handReceiptRepository,
  auditRepository,
  now = new Date(),
}: CompleteDocumentUploadArgs) {
  await validateDocumentUpload({
    account,
    input,
    handReceiptRepository,
    now,
  });

  const filename = cleanFilename(input.filename);
  const storagePath = `${account.id}/${input.documentId}`;
  const document = await documentRepository.create({
    id: input.documentId,
    accountId: account.id,
    handReceiptId: input.handReceiptId,
    filename,
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
    storagePath,
    uploadedAt: now,
    createdAt: now,
    updatedAt: now,
  });

  await recordAuditEvent({
    accountId: account.id,
    actorId,
    action: "document.uploaded",
    target: {
      type: "document",
      id: document.id,
    },
    metadata: {
      filename,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
    },
    occurredAt: now,
    repository: auditRepository,
  });

  return { document };
}
