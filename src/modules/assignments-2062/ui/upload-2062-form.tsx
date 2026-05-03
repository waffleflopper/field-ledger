"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, FileText, Loader2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ContactPicker } from "@/modules/contacts/ui/contact-picker";
import { DocumentUpload } from "@/modules/documents/ui/document-upload";
import type { ItemRecord } from "@/modules/items";
import { trpc } from "@/trpc/react";

export function Upload2062Form({
  isReadOnly,
  item,
}: {
  isReadOnly: boolean;
  item: ItemRecord;
}) {
  const router = useRouter();
  const utilities = trpc.useUtils();
  const [selectedContactId, setSelectedContactId] = useState(
    item.signedToContactId ?? "",
  );
  const [selectedContactDisplayName, setSelectedContactDisplayName] = useState(
    item.signedToContactName ?? "",
  );
  const [newContactDisplayName, setNewContactDisplayName] = useState("");
  const [selectedDocumentId, setSelectedDocumentId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const documentsQuery = trpc.documents.list.useQuery({
    handReceiptId: item.handReceiptId,
  });
  const createAssignment = trpc.assignments2062.create.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utilities.items.getById.invalidate({ id: item.id }),
        utilities.items.search.invalidate(),
        utilities.audit.listRecentActivity.invalidate(),
        utilities.audit.listTargetActivity.invalidate({
          targetType: "item",
          targetId: item.id,
        }),
      ]);
      router.push(`/app/items/${item.id}`);
    },
    onError: (error) => setFormError(error.message),
  });
  const selectedContactName = useMemo(() => {
    if (newContactDisplayName) {
      return newContactDisplayName;
    }

    return selectedContactId
      ? selectedContactDisplayName || "Selected contact"
      : null;
  }, [newContactDisplayName, selectedContactDisplayName, selectedContactId]);
  const documents = documentsQuery.data ?? [];
  const canSubmit =
    item.status === "active" &&
    !isReadOnly &&
    (selectedContactId || newContactDisplayName.trim()) &&
    selectedDocumentId &&
    !createAssignment.isPending;

  function submit() {
    setFormError(null);

    if (!selectedContactId && !newContactDisplayName.trim()) {
      setFormError("Select or create a contact before creating the 2062.");
      return;
    }

    if (!selectedDocumentId) {
      setFormError("Select a private document before creating the 2062.");
      return;
    }

    createAssignment.mutate(
      selectedContactId
        ? {
            itemId: item.id,
            contactId: selectedContactId,
            documentId: selectedDocumentId,
          }
        : {
            itemId: item.id,
            contactDisplayName: newContactDisplayName.trim(),
            documentId: selectedDocumentId,
          },
    );
  }

  return (
    <section className="space-y-5">
      {item.active2062Coverage ? (
        <div className="rounded-lg border bg-card p-4 text-sm">
          This item already has active formal 2062 coverage for{" "}
          <span className="font-medium">
            {item.active2062Coverage.contactName}
          </span>
          .
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-4">
          <section className="rounded-lg border bg-card p-4">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
                <ShieldCheck aria-hidden="true" className="size-4" />
              </span>
              <div className="min-w-0 space-y-1">
                <h2 className="text-sm font-semibold tracking-normal">
                  Preselected item
                </h2>
                <p className="text-sm font-medium">{item.nomenclature}</p>
                <p className="break-words font-mono text-xs text-muted-foreground">
                  {item.ecn ?? item.serialNumber ?? item.generatedId}
                </p>
              </div>
            </div>
          </section>

          <ContactPicker
            currentContactName={selectedContactName}
            disabled={
              isReadOnly ||
              item.status !== "active" ||
              createAssignment.isPending
            }
            disabledReason={
              isReadOnly
                ? "2062 creation is paused while this account is read-only."
                : "2062 creation is unavailable for archived items."
            }
            isPending={createAssignment.isPending}
            onAssignExisting={(contact) => {
              setSelectedContactId(contact.id);
              setSelectedContactDisplayName(contact.displayName);
              setNewContactDisplayName("");
            }}
            onAssignNew={(displayName) => {
              setSelectedContactId("");
              setSelectedContactDisplayName("");
              setNewContactDisplayName(displayName);
            }}
            onClear={() => {
              setSelectedContactId("");
              setSelectedContactDisplayName("");
              setNewContactDisplayName("");
            }}
          />

          <section className="space-y-3 rounded-lg border bg-card p-4">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
                <FileText aria-hidden="true" className="size-4" />
              </span>
              <div className="min-w-0 space-y-1">
                <h2 className="text-sm font-semibold tracking-normal">
                  Private document
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  Select a saved PDF or image from this hand receipt.
                </p>
              </div>
            </div>
            <select
              aria-label="Select document"
              className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              disabled={
                isReadOnly ||
                item.status !== "active" ||
                createAssignment.isPending ||
                documentsQuery.isLoading
              }
              onChange={(event) => setSelectedDocumentId(event.target.value)}
              value={selectedDocumentId}
            >
              <option value="">Select document</option>
              {documents.map((document) => (
                <option key={document.id} value={document.id}>
                  {document.filename}
                </option>
              ))}
            </select>
            {documents.length === 0 && !documentsQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">
                Upload a document below, then select it here.
              </p>
            ) : null}
          </section>
        </div>

        <div className="space-y-4">
          <DocumentUpload
            disabled={isReadOnly || item.status !== "active"}
            handReceiptId={item.handReceiptId}
            onUploadComplete={() =>
              utilities.documents.list.invalidate({
                handReceiptId: item.handReceiptId,
              })
            }
          />
          <section className="space-y-3 rounded-lg border bg-card p-4">
            {formError ? (
              <p
                className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                role="alert"
              >
                {formError}
              </p>
            ) : null}
            <Button
              className="w-full"
              disabled={!canSubmit || Boolean(item.active2062Coverage)}
              onClick={submit}
              type="button"
            >
              {createAssignment.isPending ? (
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              ) : (
                <CheckCircle2 aria-hidden="true" className="size-4" />
              )}
              {createAssignment.isPending ? "Creating 2062" : "Create 2062"}
            </Button>
            <Button asChild className="w-full" type="button" variant="outline">
              <Link href={`/app/items/${item.id}`}>Cancel</Link>
            </Button>
          </section>
        </div>
      </div>
    </section>
  );
}
