"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { trpc } from "@/trpc/react";

function formatBytes(sizeBytes: number) {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function DocumentList({ handReceiptId }: { handReceiptId: string }) {
  const utilities = trpc.useUtils();
  const documentsQuery = trpc.documents.list.useQuery({ handReceiptId });

  async function openDownload(documentId: string) {
    const downloadWindow = window.open("about:blank", "_blank");

    if (downloadWindow) {
      downloadWindow.opener = null;
    }

    try {
      const result = await utilities.client.documents.getById.query({
        id: documentId,
      });

      if (result.downloadUrl) {
        if (downloadWindow) {
          downloadWindow.location.href = result.downloadUrl;
        } else {
          window.location.assign(result.downloadUrl);
        }
      } else {
        downloadWindow?.close();
      }
    } catch (error) {
      downloadWindow?.close();
      throw error;
    }
  }

  if (documentsQuery.isLoading) {
    return (
      <div className="rounded-lg border bg-secondary p-4 text-sm text-muted-foreground">
        Loading documents...
      </div>
    );
  }

  if (documentsQuery.error) {
    return (
      <div
        className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
        role="alert"
      >
        <p className="font-medium">Documents could not be loaded.</p>
        <Button
          onClick={() => void documentsQuery.refetch()}
          size="sm"
          type="button"
          variant="outline"
        >
          Retry
        </Button>
      </div>
    );
  }

  const documents = documentsQuery.data ?? [];

  if (documents.length === 0) {
    return (
      <div className="rounded-lg border bg-background p-4 text-sm text-muted-foreground">
        Uploaded 2062 scans and images will appear here.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {documents.map((document) => (
        <div
          className="flex items-center justify-between gap-3 rounded-lg border bg-background p-3"
          key={document.id}
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{document.filename}</p>
            <p className="text-xs text-muted-foreground">
              {formatBytes(document.sizeBytes)} · Uploaded{" "}
              {formatDate(document.uploadedAt)}
            </p>
          </div>
          <Button
            aria-label={`Download ${document.filename}`}
            onClick={() => void openDownload(document.id)}
            size="icon-sm"
            type="button"
            variant="outline"
          >
            <Download aria-hidden="true" className="size-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
