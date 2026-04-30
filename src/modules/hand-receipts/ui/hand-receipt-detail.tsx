"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  FileUp,
  History,
  PackageSearch,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { trpc } from "@/trpc/react";
import { HandReceiptEditForm } from "./hand-receipt-edit-form";

type HandReceiptDetailProps = {
  handReceiptId: string;
};

function formatDate(value: Date | string | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function MetadataRow({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="border-b border-border/70 py-3 last:border-b-0">
      <dt className="font-mono text-[0.68rem] uppercase text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-foreground">
        {value || "Not set"}
      </dd>
    </div>
  );
}

function FutureSection({
  icon: Icon,
  label,
  text,
}: {
  icon: typeof PackageSearch;
  label: string;
  text: string;
}) {
  return (
    <section className="rounded-lg border bg-card p-4">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
          <Icon aria-hidden="true" className="size-4" />
        </span>
        <div className="min-w-0 space-y-1">
          <h2 className="text-sm font-semibold tracking-normal">{label}</h2>
          <p className="text-sm leading-6 text-muted-foreground">{text}</p>
        </div>
      </div>
    </section>
  );
}

export function HandReceiptDetail({ handReceiptId }: HandReceiptDetailProps) {
  const handReceiptQuery = trpc.handReceipts.getById.useQuery({
    id: handReceiptId,
  });
  const capabilitiesQuery = trpc.billing.capabilities.useQuery();
  const handReceipt = handReceiptQuery.data;
  const isReadOnly = capabilitiesQuery.data?.isReadOnly ?? false;

  if (handReceiptQuery.isLoading) {
    return (
      <section className="space-y-4">
        <div className="h-8 w-36 rounded-lg bg-secondary" />
        <div className="h-28 rounded-lg border bg-card" />
        <div className="h-80 rounded-lg border bg-card" />
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
            This record is unavailable or outside the current account.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <Button asChild size="sm" variant="outline">
            <Link href="/app/hand-receipts">
              <ArrowLeft aria-hidden="true" className="size-4" />
              Hand Receipts
            </Link>
          </Button>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
              Active receipt
            </p>
            <h1 className="max-w-3xl text-2xl font-semibold tracking-normal md:text-3xl">
              {handReceipt.name}
            </h1>
          </div>
        </div>

        <div className="flex w-fit items-center gap-2 rounded-lg border bg-secondary px-3 py-2 font-mono text-xs text-muted-foreground">
          <CalendarDays aria-hidden="true" className="size-4" />
          Updated {formatDate(handReceipt.updatedAt)}
        </div>
      </div>

      {isReadOnly ? (
        <p className="rounded-lg border bg-secondary px-4 py-3 text-sm text-muted-foreground">
          This account is read-only. Detail records remain available, but edits
          are paused until access is restored.
        </p>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-5">
          <HandReceiptEditForm
            handReceipt={handReceipt}
            isReadOnly={isReadOnly}
          />

          <div className="grid gap-3 md:grid-cols-3">
            <FutureSection
              icon={PackageSearch}
              label="Linked Items"
              text="Item records for this hand receipt will appear here after the item slice lands."
            />
            <FutureSection
              icon={FileUp}
              label="Upload 2062"
              text="The future upload flow starts from this receipt and keeps the selected bucket in context."
            />
            <FutureSection
              icon={History}
              label="Recent Activity"
              text="Scoped activity will show changes for this hand receipt when the activity slice connects it."
            />
          </div>
        </div>

        <aside className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-3 border-b pb-4">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
              <ClipboardList aria-hidden="true" className="size-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold tracking-normal">
                Snapshot
              </h2>
              <p className="text-sm text-muted-foreground">
                Current formal metadata.
              </p>
            </div>
          </div>
          <dl>
            <MetadataRow
              label="Hand receipt number"
              value={handReceipt.handReceiptNumber}
            />
            <MetadataRow label="Holder" value={handReceipt.holderName} />
            <MetadataRow label="Unit" value={handReceipt.unitName} />
            <MetadataRow label="UIC" value={handReceipt.uic} />
            <MetadataRow
              label="Effective date"
              value={formatDate(handReceipt.effectiveDate)}
            />
            <MetadataRow label="Notes" value={handReceipt.notes} />
          </dl>
        </aside>
      </div>
    </section>
  );
}
