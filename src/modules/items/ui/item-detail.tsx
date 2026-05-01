"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ClipboardList,
  FileText,
  Hash,
  History,
  PackageSearch,
  Pencil,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ActivityList } from "@/modules/audit/ui/activity-list";
import type { ItemRecord } from "@/modules/items";
import { trpc } from "@/trpc/react";
import { ItemEditForm } from "./item-edit-form";

type ItemDetailProps = {
  handReceiptId: string;
  itemId: string;
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
  isMono = false,
}: {
  label: string;
  value: string | null;
  isMono?: boolean;
}) {
  return (
    <div className="border-b border-border/70 py-3 last:border-b-0">
      <dt className="font-mono text-[0.68rem] uppercase text-muted-foreground">
        {label}
      </dt>
      <dd
        className={
          isMono
            ? "mt-1 break-words font-mono text-sm text-foreground"
            : "mt-1 text-sm font-medium text-foreground"
        }
      >
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
  icon: typeof FileText;
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

function DetailSummary({
  item,
  isReadOnly,
  onEdit,
}: {
  item: ItemRecord;
  isReadOnly: boolean;
  onEdit: () => void;
}) {
  return (
    <section className="rounded-lg border bg-card p-4 text-card-foreground">
      <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
            <PackageSearch aria-hidden="true" className="size-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold tracking-normal">
              Item Details
            </h2>
            <p className="text-sm text-muted-foreground">
              Current identifiers and item notes.
            </p>
          </div>
        </div>
        {isReadOnly ? (
          <span className="w-fit rounded-sm border bg-secondary px-2 py-1 font-mono text-[0.68rem] uppercase text-muted-foreground">
            Read only
          </span>
        ) : (
          <Button onClick={onEdit} size="sm" type="button" variant="outline">
            <Pencil aria-hidden="true" className="size-4" />
            Edit item
          </Button>
        )}
      </div>
      <dl className="grid gap-x-5 md:grid-cols-2">
        <MetadataRow label="Nomenclature" value={item.nomenclature} />
        <MetadataRow label="Status" value={item.status} />
        <MetadataRow isMono label="ECN" value={item.ecn} />
        <MetadataRow isMono label="Serial number" value={item.serialNumber} />
        <MetadataRow
          isMono
          label="Generated Field Ledger ID"
          value={item.generatedId}
        />
        <MetadataRow label="Updated" value={formatDate(item.updatedAt)} />
        <div className="md:col-span-2">
          <MetadataRow label="Notes" value={item.notes} />
        </div>
      </dl>
    </section>
  );
}

export function ItemDetail({ handReceiptId, itemId }: ItemDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const itemQuery = trpc.items.getById.useQuery({ id: itemId });
  const owningHandReceiptId = itemQuery.data?.handReceiptId ?? handReceiptId;
  const handReceiptQuery = trpc.handReceipts.getById.useQuery({
    id: owningHandReceiptId,
  });
  const activityQuery = trpc.audit.listTargetActivity.useQuery({
    targetType: "item",
    targetId: itemId,
    limit: 6,
  });
  const capabilitiesQuery = trpc.billing.capabilities.useQuery();
  const item = itemQuery.data;
  const handReceipt = handReceiptQuery.data;
  const isReadOnly = capabilitiesQuery.data?.isReadOnly ?? false;

  if (itemQuery.isLoading || handReceiptQuery.isLoading) {
    return (
      <section className="space-y-4">
        <div className="h-8 w-36 rounded-lg bg-secondary" />
        <div className="h-24 rounded-lg border bg-card" />
        <div className="h-80 rounded-lg border bg-card" />
      </section>
    );
  }

  if (itemQuery.error || !item) {
    return (
      <section className="space-y-4">
        <Button asChild variant="outline">
          <Link href={`/app/hand-receipts/${handReceiptId}`}>
            <ArrowLeft aria-hidden="true" className="size-4" />
            Hand receipt
          </Link>
        </Button>
        <div className="rounded-lg border bg-card p-4">
          <h1 className="text-xl font-semibold tracking-normal">
            Item not found
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            This item is unavailable or outside the current account.
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
            <Link href={`/app/hand-receipts/${owningHandReceiptId}`}>
              <ArrowLeft aria-hidden="true" className="size-4" />
              Back to hand receipt
            </Link>
          </Button>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
              {item.status} property item
            </p>
            <h1 className="max-w-3xl text-2xl font-semibold tracking-normal md:text-3xl">
              {item.nomenclature}
            </h1>
          </div>
        </div>

        <div className="flex w-fit items-center gap-2 rounded-lg border bg-secondary px-3 py-2 font-mono text-xs text-muted-foreground">
          <Hash aria-hidden="true" className="size-4" />
          {item.ecn ?? item.serialNumber ?? item.generatedId ?? "No identifier"}
        </div>
      </div>

      {isReadOnly ? (
        <p className="rounded-lg border bg-secondary px-4 py-3 text-sm text-muted-foreground">
          This account is read-only. Item details remain available, but edits
          are paused until access is restored.
        </p>
      ) : null}

      <section className="rounded-lg border bg-card p-4 text-card-foreground">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
            <ClipboardList aria-hidden="true" className="size-4" />
          </span>
          <div className="min-w-0 space-y-1">
            <h2 className="text-sm font-semibold tracking-normal">
              Hand Receipt Context
            </h2>
            {handReceipt ? (
              <Link
                className="inline-flex max-w-full items-center text-sm font-medium text-primary underline-offset-4 hover:underline"
                href={`/app/hand-receipts/${handReceipt.id}`}
              >
                <span className="truncate">{handReceipt.name}</span>
              </Link>
            ) : (
              <p className="text-sm text-muted-foreground">
                Parent hand receipt unavailable.
              </p>
            )}
            <p className="text-sm leading-6 text-muted-foreground">
              This item stays owned by the hand receipt shown here.
            </p>
          </div>
        </div>
      </section>

      {isEditing ? (
        <ItemEditForm
          isReadOnly={isReadOnly}
          item={item}
          onCancel={() => setIsEditing(false)}
          onSaved={() => setIsEditing(false)}
        />
      ) : (
        <DetailSummary
          isReadOnly={isReadOnly}
          item={item}
          onEdit={() => setIsEditing(true)}
        />
      )}

      <div className="grid gap-3 md:grid-cols-2">
        <FutureSection
          icon={ShieldCheck}
          label="Requirements"
          text="Future item-level recurring requirements will live here without depending on item photos."
        />
        <FutureSection
          icon={FileText}
          label="Active 2062s"
          text="Formal 2062 assignment coverage will appear here when the document workflow lands."
        />
      </div>

      <section className="space-y-3">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
            <History aria-hidden="true" className="size-4" />
          </span>
          <div className="space-y-1">
            <h2 className="text-sm font-semibold tracking-normal">
              Recent Activity
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Recent changes to this item. Use the Activity route for broader
              account history.
            </p>
          </div>
        </div>
        {activityQuery.isLoading ? (
          <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
            Loading activity...
          </div>
        ) : (
          <ActivityList
            activity={activityQuery.data ?? []}
            emptyDescription="Create and edit events for this item will appear here."
            emptyTitle="No activity for this item"
            isCompact
            showTarget={false}
          />
        )}
      </section>
    </section>
  );
}
