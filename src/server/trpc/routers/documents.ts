import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  ACCEPTED_DOCUMENT_MIME_TYPES,
  completeDocumentUpload,
  DocumentUploadReadOnlyError,
  getDocument,
  initiateDocumentUpload,
  listDocuments,
  UnsupportedDocumentMimeTypeError,
} from "@/modules/documents";
import type {
  AppUnitOfWork,
  AppUnitOfWorkRepositories,
} from "@/modules/provider-boundaries/database/app-unit-of-work";
import type { StoragePort } from "@/modules/provider-boundaries/storage";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc/init";

const uploadInput = z.object({
  filename: z.string().trim().min(1).max(255),
  handReceiptId: z.uuid(),
  mimeType: z.enum(ACCEPTED_DOCUMENT_MIME_TYPES),
  sizeBytes: z
    .number()
    .int()
    .positive()
    .max(20 * 1024 * 1024),
});

const completeUploadInput = uploadInput.extend({
  documentId: z.uuid(),
});

const documentIdInput = z.object({
  id: z.uuid(),
});

const listDocumentsInput = z
  .object({
    handReceiptId: z.uuid().optional(),
  })
  .optional();

function toTRPCError(error: unknown): never {
  const message =
    error instanceof Error ? error.message : "Unable to update documents.";

  if (error instanceof DocumentUploadReadOnlyError) {
    throw new TRPCError({ code: "FORBIDDEN", message });
  }

  if (
    error instanceof UnsupportedDocumentMimeTypeError ||
    message === "Document filename is required." ||
    message === "Document file size must be greater than zero." ||
    message === "Document file size must be 20 MiB or smaller." ||
    message === "Hand receipt must be active to upload documents." ||
    message === "Uploaded document file was not found."
  ) {
    throw new TRPCError({ code: "BAD_REQUEST", message });
  }

  if (message === "Hand receipt was not found.") {
    throw new TRPCError({ code: "NOT_FOUND", message });
  }

  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message,
  });
}

async function runInUnitOfWork<T>(
  ctx: { unitOfWork: AppUnitOfWork; storagePort: StoragePort },
  operation: (repositories: AppUnitOfWorkRepositories) => Promise<T>,
): Promise<T> {
  try {
    return await ctx.unitOfWork.run(operation);
  } catch (error) {
    if (error instanceof TRPCError) {
      throw error;
    }

    toTRPCError(error);
  }
}

export const documentsRouter = createTRPCRouter({
  initiateUpload: protectedProcedure
    .input(uploadInput)
    .mutation(async ({ ctx, input }) => {
      try {
        return await initiateDocumentUpload({
          account: ctx.account,
          input,
          handReceiptRepository: ctx.handReceiptRepository,
          storagePort: ctx.storagePort,
        });
      } catch (error) {
        toTRPCError(error);
      }
    }),
  completeUpload: protectedProcedure
    .input(completeUploadInput)
    .mutation(({ ctx, input }) =>
      runInUnitOfWork(ctx, (repositories) =>
        completeDocumentUpload({
          account: ctx.account,
          actorId: ctx.session.userId,
          input,
          documentRepository: repositories.documentRepository,
          handReceiptRepository: repositories.handReceiptRepository,
          auditRepository: repositories.auditRepository,
          storagePort: ctx.storagePort,
        }),
      ),
    ),
  list: protectedProcedure.input(listDocumentsInput).query(({ ctx, input }) =>
    listDocuments({
      accountId: ctx.account.id,
      repository: ctx.documentRepository,
      ...(input?.handReceiptId ? { handReceiptId: input.handReceiptId } : {}),
    }),
  ),
  getById: protectedProcedure
    .input(documentIdInput)
    .query(async ({ ctx, input }) => {
      const result = await getDocument({
        accountId: ctx.account.id,
        documentId: input.id,
        repository: ctx.documentRepository,
        storagePort: ctx.storagePort,
        includeDownloadUrl: true,
      });

      if (!result) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Document was not found.",
        });
      }

      return result;
    }),
});
