"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Archive,
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  History,
  Pencil,
  RotateCcw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ActivityList } from "@/modules/audit/ui/activity-list";
import { HandReceipt2062Context } from "@/modules/assignments-2062/ui/hand-receipt-2062-context";
import { DocumentList } from "@/modules/documents/ui/document-list";
import { DocumentUpload } from "@/modules/documents/ui/document-upload";
import type { HandReceiptRecord } from "@/modules/hand-receipts";
import type { ItemRecord } from "@/modules/items";
import { CreateItemForm } from "@/modules/items/ui/create-item-form";
import { ItemList } from "@/modules/items/ui/item-list";
import { trpc } from "@/trpc/react";
import { HandReceiptEditForm } from "./hand-receipt-edit-form";

type HandReceiptDetailProps = {
  handReceiptId: string;
};

type ItemView = "active" | "archived";

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

function DetailSummary({
  handReceipt,
  isReadOnly,
  onEdit,
  onArchive,
}: {
  handReceipt: HandReceiptRecord;
  isReadOnly: boolean;
  onEdit: () => void;
  onArchive: () => void;
}) {
  return (
    <section className="rounded-lg border bg-card p-4 text-card-foreground">
      <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
            <ClipboardList aria-hidden="true" className="size-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold tracking-normal">
              Receipt Details
            </h2>
            <p className="text-sm text-muted-foreground">
              Current formal metadata for this bucket.
            </p>
          </div>
        </div>
        {isReadOnly ? (
          <span className="w-fit rounded-sm border bg-secondary px-2 py-1 font-mono text-[0.68rem] uppercase text-muted-foreground">
            Read only
          </span>
        ) : (
          <div className="flex items-center gap-2">
            {handReceipt.status === "active" ? (
              <Button
                aria-label="Archive hand receipt"
                onClick={onArchive}
                size="icon-sm"
                title="Archive hand receipt"
                type="button"
                variant="destructive"
              >
                <Archive aria-hidden="true" className="size-4" />
              </Button>
            ) : null}
            <Button onClick={onEdit} size="sm" type="button" variant="outline">
              <Pencil aria-hidden="true" className="size-4" />
              Edit details
            </Button>
          </div>
        )}
      </div>
      <dl className="grid gap-x-5 md:grid-cols-2">
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
    </section>
  );
}

function getCreateItemDisabledReason({
  handReceipt,
  isReadOnly,
}: {
  handReceipt: HandReceiptRecord;
  isReadOnly: boolean;
}) {
  if (isReadOnly) {
    return "This account is read-only. Existing records remain available.";
  }

  if (handReceipt.status !== "active") {
    return "Archived hand receipts cannot receive new items.";
  }

  return null;
}

export function HandReceiptDetail({ handReceiptId }: HandReceiptDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  const [lifecycleError, setLifecycleError] = useState<string | null>(null);
  const [itemView, setItemView] = useState<ItemView>("active");
  const [itemLifecycleError, setItemLifecycleError] = useState<string | null>(
    null,
  );
  const [createItemError, setCreateItemError] = useState<string | null>(null);
  const utilities = trpc.useUtils();
  const handReceiptQuery = trpc.handReceipts.getById.useQuery({
    id: handReceiptId,
  });
  const activityQuery = trpc.audit.listTargetActivity.useQuery({
    targetType: "hand_receipt",
    targetId: handReceiptId,
    limit: 6,
  });
  const itemsQuery = trpc.items.listByHandReceipt.useQuery({
    handReceiptId,
    status: itemView,
  });
  const capabilitiesQuery = trpc.billing.capabilities.useQuery();
  const handReceipt = handReceiptQuery.data;
  const isReadOnly = capabilitiesQuery.data?.isReadOnly ?? false;
  const isViewingArchivedItems = itemView === "archived";
  const itemListEmptyDescription = isViewingArchivedItems
    ? "Archived items from this hand receipt will appear here after they leave active workflows."
    : "Add the first physical item for this hand receipt when you are ready to track accountable property.";

  async function refreshHandReceiptContext(updated: HandReceiptRecord) {
    setLifecycleError(null);
    utilities.handReceipts.getById.setData({ id: handReceiptId }, updated);
    await Promise.all([
      utilities.handReceipts.getById.invalidate({ id: handReceiptId }),
      utilities.handReceipts.list.invalidate(),
      utilities.handReceipts.listArchived.invalidate(),
      utilities.audit.listRecentActivity.invalidate(),
      utilities.audit.listTargetActivity.invalidate({
        targetType: "hand_receipt",
        targetId: handReceiptId,
      }),
      utilities.items.listByHandReceipt.invalidate({ handReceiptId }),
      utilities.items.search.invalidate(),
      utilities.billing.capabilities.invalidate(),
      utilities.documents.list.invalidate(),
    ]);
  }

  async function refreshItemLifecycleContext(updated: ItemRecord) {
    setItemLifecycleError(null);
    utilities.items.getById.setData({ id: updated.id }, updated);
    await Promise.all([
      utilities.items.getById.invalidate({ id: updated.id }),
      utilities.items.search.invalidate(),
      utilities.items.list.invalidate(),
      utilities.items.listByHandReceipt.invalidate({
        handReceiptId,
        status: "active",
      }),
      utilities.items.listByHandReceipt.invalidate({
        handReceiptId,
        status: "archived",
      }),
      utilities.audit.listRecentActivity.invalidate(),
      utilities.audit.listTargetActivity.invalidate({
        targetType: "item",
        targetId: updated.id,
      }),
      utilities.audit.listTargetActivity.invalidate({
        targetType: "hand_receipt",
        targetId: handReceiptId,
      }),
    ]);
  }

  const createItemDisabledReason = handReceipt
    ? getCreateItemDisabledReason({ handReceipt, isReadOnly })
    : null;

  const archiveMutation = trpc.handReceipts.archive.useMutation({
    onSuccess: async (archived) => {
      setIsArchiveDialogOpen(false);
      await refreshHandReceiptContext(archived);
    },
    onError: (error) => {
      setLifecycleError(error.message);
    },
  });
  const restoreMutation = trpc.handReceipts.restore.useMutation({
    onSuccess: async (restored) => {
      await refreshHandReceiptContext(restored);
    },
    onError: (error) => {
      setLifecycleError(error.message);
    },
  });
  const createItemMutation = trpc.items.create.useMutation({
    onSuccess: async (result) => {
      setCreateItemError(null);

      if (result.item) {
        await Promise.all([
          utilities.items.listByHandReceipt.invalidate({
            handReceiptId,
            status: "active",
          }),
          utilities.items.search.invalidate(),
          utilities.audit.listRecentActivity.invalidate(),
          utilities.audit.listTargetActivity.invalidate({
            targetType: "hand_receipt",
            targetId: handReceiptId,
          }),
        ]);
      }
    },
    onError: (error) => {
      setCreateItemError(error.message || "Item could not be created.");
    },
  });
  const restoreItemMutation = trpc.items.restore.useMutation({
    onSuccess: async (restored) => {
      await refreshItemLifecycleContext(restored);
    },
    onError: (error) => {
      setItemLifecycleError(error.message);
    },
  });

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
              {handReceipt.status} receipt
            </p>
            <h1 className="max-w-3xl text-2xl font-semibold tracking-normal md:text-3xl">
              {handReceipt.name}
            </h1>
          </div>
        </div>

        <div className="flex flex-col items-start gap-2 md:items-end">
          <div className="flex w-fit items-center gap-2 rounded-lg border bg-secondary px-3 py-2 font-mono text-xs text-muted-foreground">
            <CalendarDays aria-hidden="true" className="size-4" />
            Updated {formatDate(handReceipt.updatedAt)}
          </div>
          {!isReadOnly && handReceipt.status === "archived" ? (
            <Button
              disabled={restoreMutation.isPending}
              onClick={() => restoreMutation.mutate({ id: handReceipt.id })}
              size="sm"
              type="button"
              variant="outline"
            >
              <RotateCcw aria-hidden="true" className="size-4" />
              {restoreMutation.isPending ? "Restoring" : "Restore"}
            </Button>
          ) : null}
        </div>
      </div>

      {isReadOnly ? (
        <p className="rounded-lg border bg-secondary px-4 py-3 text-sm text-muted-foreground">
          Detail records remain available, but edits and lifecycle changes are
          paused until access is restored.
        </p>
      ) : null}

      {lifecycleError ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          {lifecycleError}
        </p>
      ) : null}

      <Dialog open={isArchiveDialogOpen} onOpenChange={setIsArchiveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive this hand receipt?</DialogTitle>
            <DialogDescription>
              {handReceipt.name} will leave active workflows and disappear from
              normal hand receipt lists. It stays reviewable in Archived and can
              be restored later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              disabled={archiveMutation.isPending}
              onClick={() => setIsArchiveDialogOpen(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={archiveMutation.isPending}
              onClick={() => archiveMutation.mutate({ id: handReceipt.id })}
              type="button"
              variant="destructive"
            >
              <Archive aria-hidden="true" className="size-4" />
              {archiveMutation.isPending ? "Archiving" : "Archive"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-5">
        {isEditing ? (
          <HandReceiptEditForm
            handReceipt={handReceipt}
            isReadOnly={isReadOnly}
            onCancel={() => setIsEditing(false)}
            onSaved={() => setIsEditing(false)}
          />
        ) : (
          <DetailSummary
            handReceipt={handReceipt}
            isReadOnly={isReadOnly}
            onArchive={() => setIsArchiveDialogOpen(true)}
            onEdit={() => setIsEditing(true)}
          />
        )}

        <div className="grid gap-3 md:grid-cols-[minmax(0,1.4fr)_minmax(260px,0.8fr)]">
          <section className="space-y-3 rounded-lg border bg-card p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <h2 className="text-sm font-semibold tracking-normal">
                  Property Items
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  Review active property by default, or switch to archived
                  records when you need preserved item history.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {!isViewingArchivedItems ? (
                  <>
                    <CreateItemForm
                      canCreate={!isReadOnly && handReceipt.status === "active"}
                      disabledReason={createItemDisabledReason}
                      onSubmit={(input) => {
                        setCreateItemError(null);

                        return createItemMutation.mutateAsync({
                          handReceiptId,
                          ...input,
                        });
                      }}
                    />
                  </>
                ) : null}
              </div>
            </div>
            {createItemError ? (
              <p
                className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"
                role="alert"
              >
                {createItemError}
              </p>
            ) : null}
            <div className="flex w-fit rounded-lg border bg-background p-1">
              <button
                aria-pressed={itemView === "active"}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors aria-pressed:bg-primary aria-pressed:text-primary-foreground"
                onClick={() => {
                  setItemLifecycleError(null);
                  setItemView("active");
                }}
                type="button"
              >
                Active
              </button>
              <button
                aria-pressed={itemView === "archived"}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors aria-pressed:bg-primary aria-pressed:text-primary-foreground"
                onClick={() => {
                  setItemLifecycleError(null);
                  setItemView("archived");
                }}
                type="button"
              >
                Archived
              </button>
            </div>
            {itemLifecycleError ? (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                {itemLifecycleError}
              </p>
            ) : null}
            {itemsQuery.isLoading ? (
              <div className="h-24 rounded-lg border bg-secondary" />
            ) : itemsQuery.error ? (
              <div
                className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
                role="alert"
              >
                <p className="font-medium">Items could not be loaded.</p>
                <p className="leading-6">
                  {itemsQuery.error.message ||
                    "Refresh this item list before making changes."}
                </p>
                <Button
                  onClick={() => void itemsQuery.refetch()}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Retry
                </Button>
              </div>
            ) : (
              <ItemList
                canRestore={!isReadOnly && isViewingArchivedItems}
                emptyDescription={itemListEmptyDescription}
                items={itemsQuery.data ?? []}
                onRestore={(item) => {
                  setItemLifecycleError(null);
                  restoreItemMutation.mutate({ id: item.id });
                }}
                restorePendingId={restoreItemMutation.variables?.id ?? null}
              />
            )}
          </section>
          <div className="space-y-3">
            <HandReceipt2062Context
              handReceiptId={handReceiptId}
              isReadOnly={isReadOnly}
              isReceiptActive={handReceipt.status === "active"}
            />
            <DocumentUpload
              disabled={isReadOnly || handReceipt.status !== "active"}
              handReceiptId={handReceiptId}
              onUploadComplete={() => {
                void Promise.all([
                  utilities.documents.list.invalidate({ handReceiptId }),
                  utilities.audit.listRecentActivity.invalidate(),
                  utilities.audit.listTargetActivity.invalidate({
                    targetType: "hand_receipt",
                    targetId: handReceiptId,
                  }),
                ]);
              }}
            />
            <DocumentList handReceiptId={handReceiptId} />
          </div>
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
                Recent changes to this hand receipt. Use the Activity route for
                the broader account history.
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
              emptyDescription="Create, edit, archive, and restore events for this receipt will appear here."
              emptyTitle="No activity for this receipt"
              isCompact
              showTarget={false}
            />
          )}
        </section>
      </div>
    </section>
  );
}
