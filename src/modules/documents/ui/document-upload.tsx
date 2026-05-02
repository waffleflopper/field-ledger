"use client";

import { useId, useRef, useState } from "react";
import { FileUp, Loader2, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  ACCEPTED_DOCUMENT_MIME_TYPES,
  type AcceptedDocumentMimeType,
} from "@/modules/documents";
import { trpc } from "@/trpc/react";

type PendingDocumentUpload = {
  id: string;
  handReceiptId: string;
  filename: string;
  mimeType: AcceptedDocumentMimeType;
  sizeBytes: number;
};

type UploadState =
  | { status: "idle" }
  | { status: "uploading"; filename: string }
  | { status: "success"; filename: string }
  | {
      status: "error";
      message: string;
      pendingDocument?: PendingDocumentUpload;
    };

export function DocumentUpload({
  handReceiptId,
  disabled,
  onUploadComplete,
}: {
  handReceiptId: string;
  disabled: boolean;
  onUploadComplete?: () => void;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<UploadState>({ status: "idle" });
  const initiateUpload = trpc.documents.initiateUpload.useMutation();
  const completeUpload = trpc.documents.completeUpload.useMutation();
  const acceptedTypes = ACCEPTED_DOCUMENT_MIME_TYPES.join(",");

  async function completePendingUpload(
    pendingDocument: PendingDocumentUpload,
    successFilename = pendingDocument.filename,
  ) {
    try {
      setState({ status: "uploading", filename: pendingDocument.filename });
      await completeUpload.mutateAsync({
        documentId: pendingDocument.id,
        filename: pendingDocument.filename,
        handReceiptId: pendingDocument.handReceiptId,
        mimeType: pendingDocument.mimeType,
        sizeBytes: pendingDocument.sizeBytes,
      });

      setState({ status: "success", filename: successFilename });
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      onUploadComplete?.();
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "The upload could not be completed.",
        pendingDocument,
      });
    }
  }

  async function uploadFile(file: File) {
    if (
      !ACCEPTED_DOCUMENT_MIME_TYPES.includes(
        file.type as AcceptedDocumentMimeType,
      )
    ) {
      setState({
        status: "error",
        message: "Upload a PDF, JPG, PNG, WebP, or HEIC document.",
      });
      return;
    }

    setState({ status: "uploading", filename: file.name });

    try {
      const upload = await initiateUpload.mutateAsync({
        filename: file.name,
        handReceiptId,
        mimeType: file.type as AcceptedDocumentMimeType,
        sizeBytes: file.size,
      });

      const response = await fetch(upload.signedUploadUrl, {
        method: "PUT",
        headers: {
          "content-type": file.type,
        },
        body: file,
      });

      if (!response.ok) {
        throw new Error("The file could not be stored. Try again.");
      }

      await completePendingUpload(
        {
          id: upload.pendingDocument.id,
          filename: upload.pendingDocument.filename,
          handReceiptId: upload.pendingDocument.handReceiptId,
          mimeType: upload.pendingDocument.mimeType as AcceptedDocumentMimeType,
          sizeBytes: upload.pendingDocument.sizeBytes,
        },
        file.name,
      );
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "The upload could not be started.",
      });
    }
  }

  return (
    <section className="space-y-4 rounded-lg border bg-card p-4">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
          <FileUp aria-hidden="true" className="size-4" />
        </span>
        <div className="min-w-0 space-y-1">
          <h2 className="text-sm font-semibold tracking-normal">Upload 2062</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Add a private PDF or image scan now. Assignment selection lands in a
            later 2062 slice.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <label className="sr-only" htmlFor={inputId}>
          Upload 2062 document
        </label>
        <input
          id={inputId}
          ref={inputRef}
          accept={acceptedTypes}
          className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
          disabled={disabled || state.status === "uploading"}
          onChange={(event) => {
            const file = event.target.files?.[0];

            if (file) {
              void uploadFile(file);
            }
          }}
          type="file"
        />
        {disabled ? (
          <p className="text-sm text-muted-foreground">
            Read-only accounts can review existing documents but cannot upload
            new files.
          </p>
        ) : null}
        {state.status === "uploading" ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            Uploading {state.filename}
          </p>
        ) : null}
        {state.status === "success" ? (
          <p className="rounded-md border border-green-700/20 bg-green-700/10 px-3 py-2 text-sm font-medium text-green-800 dark:text-green-300">
            {state.filename} is saved as private document evidence.
          </p>
        ) : null}
        {state.status === "error" ? (
          <div
            className="space-y-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            <p className="font-medium">{state.message}</p>
            <Button
              onClick={() => {
                if (state.pendingDocument) {
                  void completePendingUpload(state.pendingDocument);
                  return;
                }

                if (inputRef.current) {
                  inputRef.current.value = "";
                }
                setState({ status: "idle" });
              }}
              size="sm"
              type="button"
              variant="outline"
            >
              <RotateCcw aria-hidden="true" className="size-4" />
              {state.pendingDocument ? "Retry save" : "Retry"}
            </Button>
          </div>
        ) : null}
      </div>

      <p className="sr-only">Upload context: hand receipt {handReceiptId}</p>
    </section>
  );
}
