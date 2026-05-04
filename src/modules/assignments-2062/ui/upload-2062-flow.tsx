"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Loader2,
  PackageCheck,
  Search,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ContactPicker } from "@/modules/contacts/ui/contact-picker";
import { DocumentUpload } from "@/modules/documents/ui/document-upload";
import type { ItemRecord } from "@/modules/items";
import { trpc } from "@/trpc/react";

type Step = "contact" | "document" | "items" | "summary";

const steps: { id: Step; label: string }[] = [
  { id: "contact", label: "Contact" },
  { id: "document", label: "Document" },
  { id: "items", label: "Items" },
  { id: "summary", label: "Summary" },
];

function getPrimaryIdentifier(item: ItemRecord) {
  if (item.ecn) {
    return `ECN ${item.ecn}`;
  }

  if (item.serialNumber) {
    return `Serial ${item.serialNumber}`;
  }

  return item.generatedId ?? "No identifier";
}

function itemMatchesQuery(item: ItemRecord, query: string) {
  const normalized = query.trim().toLocaleLowerCase();

  if (!normalized) {
    return true;
  }

  return [
    item.nomenclature,
    item.ecn,
    item.serialNumber,
    item.generatedId,
    item.signedToContactName,
    item.active2062Coverage?.contactName,
  ].some((value) => value?.toLocaleLowerCase().includes(normalized));
}

function StepRail({ currentStep }: { currentStep: Step }) {
  const currentIndex = steps.findIndex((step) => step.id === currentStep);

  return (
    <ol className="grid gap-2 sm:grid-cols-4">
      {steps.map((step, index) => {
        const isCurrent = step.id === currentStep;
        const isComplete = index < currentIndex;

        return (
          <li
            className="flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-xs"
            key={step.id}
          >
            <span
              className={
                isCurrent || isComplete
                  ? "flex size-5 items-center justify-center rounded-sm bg-primary font-mono text-[0.68rem] text-primary-foreground"
                  : "flex size-5 items-center justify-center rounded-sm bg-secondary font-mono text-[0.68rem] text-muted-foreground"
              }
            >
              {isComplete ? (
                <CheckCircle2 aria-hidden="true" className="size-3" />
              ) : (
                index + 1
              )}
            </span>
            <span
              className={
                isCurrent
                  ? "font-semibold text-foreground"
                  : "text-muted-foreground"
              }
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function ItemSelector({
  disabled,
  items,
  selectedItemIds,
  setSelectedItemIds,
}: {
  disabled: boolean;
  items: ItemRecord[];
  selectedItemIds: string[];
  setSelectedItemIds: (itemIds: string[]) => void;
}) {
  const searchId = useId();
  const [query, setQuery] = useState("");
  const visibleItems = items.filter((item) => itemMatchesQuery(item, query));
  const selectedSet = new Set(selectedItemIds);

  function toggleItem(item: ItemRecord) {
    if (disabled || item.active2062Coverage) {
      return;
    }

    if (selectedSet.has(item.id)) {
      setSelectedItemIds(selectedItemIds.filter((id) => id !== item.id));
      return;
    }

    setSelectedItemIds([...selectedItemIds, item.id]);
  }

  return (
    <section className="space-y-4 rounded-lg border bg-card p-4">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
          <PackageCheck aria-hidden="true" className="size-4" />
        </span>
        <div className="min-w-0 space-y-1">
          <h2 className="text-sm font-semibold tracking-normal">
            Select property
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Choose active items from this hand receipt. Items already under an
            active 2062 stay visible but cannot be selected.
          </p>
        </div>
      </div>

      <div className="rounded-md border bg-background px-3 py-2">
        <label
          className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground"
          htmlFor={searchId}
        >
          <Search aria-hidden="true" className="size-3.5" />
          Narrow items
        </label>
        <Input
          disabled={disabled}
          id={searchId}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search nomenclature, ECN, serial, or FL ID"
          value={query}
        />
      </div>

      {visibleItems.length === 0 ? (
        <div className="rounded-lg border bg-background p-4 text-sm text-muted-foreground">
          No active items match this search.
        </div>
      ) : (
        <div className="divide-y rounded-lg border bg-background">
          {visibleItems.map((item) => {
            const isSelected = selectedSet.has(item.id);
            const ineligible = Boolean(item.active2062Coverage);

            return (
              <label
                className={
                  ineligible
                    ? "grid gap-3 p-3 text-muted-foreground sm:grid-cols-[auto_minmax(0,1fr)_auto]"
                    : "grid cursor-pointer gap-3 p-3 transition-colors hover:bg-secondary sm:grid-cols-[auto_minmax(0,1fr)_auto]"
                }
                key={item.id}
              >
                <input
                  checked={isSelected}
                  className="mt-1 size-4 accent-primary"
                  disabled={disabled || ineligible}
                  onChange={() => toggleItem(item)}
                  type="checkbox"
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-foreground">
                    {item.nomenclature}
                  </span>
                  <span className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="font-mono">
                      {getPrimaryIdentifier(item)}
                    </span>
                    {item.signedToContactName ? (
                      <span>Manual signed to {item.signedToContactName}</span>
                    ) : null}
                  </span>
                </span>
                {ineligible ? (
                  <span className="w-fit rounded-sm border px-2 py-1 font-mono text-[0.68rem] uppercase">
                    Active 2062
                  </span>
                ) : isSelected ? (
                  <span className="w-fit rounded-sm bg-primary px-2 py-1 font-mono text-[0.68rem] uppercase text-primary-foreground">
                    Selected
                  </span>
                ) : null}
              </label>
            );
          })}
        </div>
      )}
    </section>
  );
}

export function Upload2062Flow({ handReceiptId }: { handReceiptId: string }) {
  const router = useRouter();
  const utilities = trpc.useUtils();
  const [step, setStep] = useState<Step>("contact");
  const [selectedContactId, setSelectedContactId] = useState("");
  const [selectedContactDisplayName, setSelectedContactDisplayName] =
    useState("");
  const [newContactDisplayName, setNewContactDisplayName] = useState("");
  const [selectedDocumentId, setSelectedDocumentId] = useState("");
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const handReceiptQuery = trpc.handReceipts.getById.useQuery({
    id: handReceiptId,
  });
  const capabilitiesQuery = trpc.billing.capabilities.useQuery();
  const documentsQuery = trpc.documents.list.useQuery({ handReceiptId });
  const itemsQuery = trpc.items.listByHandReceipt.useQuery({
    handReceiptId,
    status: "active",
  });
  const handReceipt = handReceiptQuery.data;
  const documents = documentsQuery.data ?? [];
  const items = itemsQuery.data ?? [];
  const selectedItems = items.filter(
    (item) => selectedItemIds.includes(item.id) && !item.active2062Coverage,
  );
  const validSelectedItemIds = selectedItems.map((item) => item.id);
  const selectedDocument = documents.find(
    (document) => document.id === selectedDocumentId,
  );
  const selectedContactName = useMemo(() => {
    if (newContactDisplayName) {
      return newContactDisplayName;
    }

    return selectedContactId
      ? selectedContactDisplayName || "Selected contact"
      : null;
  }, [newContactDisplayName, selectedContactDisplayName, selectedContactId]);
  const isReadOnly = capabilitiesQuery.data?.isReadOnly ?? false;
  const isArchived = handReceipt?.status === "archived";
  const isDisabled = isReadOnly || isArchived;
  const createAssignment = trpc.assignments2062.createWithItems.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utilities.items.listByHandReceipt.invalidate({ handReceiptId }),
        utilities.items.search.invalidate(),
        utilities.handReceipts.getById.invalidate({ id: handReceiptId }),
        utilities.audit.listRecentActivity.invalidate(),
        utilities.audit.listTargetActivity.invalidate({
          targetType: "hand_receipt",
          targetId: handReceiptId,
        }),
      ]);
      router.push(`/app/hand-receipts/${handReceiptId}`);
    },
    onError: (error) => setFormError(error.message),
  });

  if (handReceiptQuery.isLoading) {
    return (
      <section className="space-y-4">
        <div className="h-9 w-40 rounded-lg bg-secondary" />
        <div className="h-24 rounded-lg border bg-card" />
        <div className="h-96 rounded-lg border bg-card" />
      </section>
    );
  }

  if (handReceiptQuery.error || !handReceipt) {
    return (
      <section className="space-y-4">
        <Button asChild variant="outline">
          <Link href="/app/hand-receipts">
            <ArrowLeft aria-hidden="true" className="size-4" />
            Hand Receipts
          </Link>
        </Button>
        <div className="rounded-lg border bg-card p-4">
          <h1 className="text-xl font-semibold tracking-normal">
            Hand receipt not found
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            This upload flow is unavailable or outside the current account.
          </p>
        </div>
      </section>
    );
  }

  function goNext(nextStep: Step) {
    setFormError(null);
    setStep(nextStep);
  }

  function submit() {
    setFormError(null);

    if (!selectedContactId && !newContactDisplayName.trim()) {
      setFormError("Select or create a contact before continuing.");
      setStep("contact");
      return;
    }

    if (!selectedDocumentId) {
      setFormError("Select a private document before creating the 2062.");
      setStep("document");
      return;
    }

    if (validSelectedItemIds.length === 0) {
      setFormError("Select at least one item.");
      setStep("items");
      return;
    }

    createAssignment.mutate(
      selectedContactId
        ? {
            handReceiptId,
            itemIds: validSelectedItemIds,
            contactId: selectedContactId,
            documentId: selectedDocumentId,
          }
        : {
            handReceiptId,
            itemIds: validSelectedItemIds,
            contactDisplayName: newContactDisplayName.trim(),
            documentId: selectedDocumentId,
          },
    );
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <Button asChild size="sm" variant="outline">
            <Link href={`/app/hand-receipts/${handReceiptId}`}>
              <ArrowLeft aria-hidden="true" className="size-4" />
              Hand Receipt
            </Link>
          </Button>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
              Upload 2062
            </p>
            <h1 className="max-w-3xl text-2xl font-semibold tracking-normal md:text-3xl">
              {handReceipt.name}
            </h1>
          </div>
        </div>
        <div className="flex w-fit items-center gap-2 rounded-lg border bg-secondary px-3 py-2 font-mono text-xs text-muted-foreground">
          <ShieldCheck aria-hidden="true" className="size-4" />
          Formal coverage
        </div>
      </div>

      {isDisabled ? (
        <p className="rounded-lg border bg-secondary px-4 py-3 text-sm text-muted-foreground">
          {isReadOnly
            ? "This account is read-only. Existing records remain available, but new 2062 assignments are paused."
            : "Archived hand receipts cannot receive new 2062 assignments."}
        </p>
      ) : null}

      <StepRail currentStep={step} />

      {formError ? (
        <p
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"
          role="alert"
        >
          {formError}
        </p>
      ) : null}

      {step === "contact" ? (
        <div className="space-y-4">
          <ContactPicker
            currentContactName={selectedContactName}
            disabled={isDisabled || createAssignment.isPending}
            disabledReason="2062 creation is unavailable for this hand receipt."
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
          <div className="flex justify-end">
            <Button
              disabled={
                isDisabled ||
                (!selectedContactId && !newContactDisplayName.trim())
              }
              onClick={() => goNext("document")}
              type="button"
            >
              Continue to document
            </Button>
          </div>
        </div>
      ) : null}

      {step === "document" ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
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
                isDisabled ||
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
                Upload a document, then select it here.
              </p>
            ) : null}
            <div className="flex justify-between gap-2">
              <Button
                onClick={() => goNext("contact")}
                type="button"
                variant="outline"
              >
                Back
              </Button>
              <Button
                disabled={isDisabled || !selectedDocumentId}
                onClick={() => goNext("items")}
                type="button"
              >
                Continue to items
              </Button>
            </div>
          </section>
          <DocumentUpload
            disabled={isDisabled}
            handReceiptId={handReceiptId}
            onUploadComplete={() =>
              utilities.documents.list.invalidate({ handReceiptId })
            }
          />
        </div>
      ) : null}

      {step === "items" ? (
        <div className="space-y-4">
          <ItemSelector
            disabled={isDisabled || createAssignment.isPending}
            items={items}
            selectedItemIds={validSelectedItemIds}
            setSelectedItemIds={setSelectedItemIds}
          />
          <div className="flex justify-between gap-2">
            <Button
              onClick={() => goNext("document")}
              type="button"
              variant="outline"
            >
              Back
            </Button>
            <Button
              disabled={isDisabled || validSelectedItemIds.length === 0}
              onClick={() => goNext("summary")}
              type="button"
            >
              Review {validSelectedItemIds.length || ""} items
            </Button>
          </div>
        </div>
      ) : null}

      {step === "summary" ? (
        <section className="space-y-4 rounded-lg border bg-card p-4">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
              <ClipboardCheck aria-hidden="true" className="size-4" />
            </span>
            <div className="min-w-0 space-y-1">
              <h2 className="text-sm font-semibold tracking-normal">
                Filing summary
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Confirm the contact, document, and covered items before creating
                active formal 2062 coverage.
              </p>
            </div>
          </div>
          <dl className="grid gap-3 md:grid-cols-3">
            <div className="rounded-md border bg-background p-3">
              <dt className="font-mono text-[0.68rem] uppercase text-muted-foreground">
                Contact
              </dt>
              <dd className="mt-1 text-sm font-semibold">
                {selectedContactName ?? "Not selected"}
              </dd>
            </div>
            <div className="rounded-md border bg-background p-3">
              <dt className="font-mono text-[0.68rem] uppercase text-muted-foreground">
                Document
              </dt>
              <dd className="mt-1 truncate text-sm font-semibold">
                {selectedDocument?.filename ?? "Not selected"}
              </dd>
            </div>
            <div className="rounded-md border bg-background p-3">
              <dt className="font-mono text-[0.68rem] uppercase text-muted-foreground">
                Items
              </dt>
              <dd className="mt-1 text-sm font-semibold">
                {selectedItems.length} selected
              </dd>
            </div>
          </dl>
          <div className="divide-y rounded-lg border bg-background">
            {selectedItems.map((item) => (
              <div
                className="flex items-start justify-between gap-3 p-3"
                key={item.id}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {item.nomenclature}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {getPrimaryIdentifier(item)}
                  </p>
                </div>
                <span className="rounded-sm border px-2 py-1 font-mono text-[0.68rem] uppercase text-muted-foreground">
                  New 2062
                </span>
              </div>
            ))}
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button
              onClick={() => goNext("items")}
              type="button"
              variant="outline"
            >
              Back
            </Button>
            <Button
              disabled={isDisabled || createAssignment.isPending}
              onClick={submit}
              type="button"
            >
              {createAssignment.isPending ? (
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              ) : (
                <CheckCircle2 aria-hidden="true" className="size-4" />
              )}
              {createAssignment.isPending
                ? "Creating assignment"
                : "Create assignment"}
            </Button>
          </div>
        </section>
      ) : null}
    </section>
  );
}
