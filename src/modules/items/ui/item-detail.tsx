"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Archive,
  ArrowLeft,
  ArrowRightLeft,
  AlertTriangle,
  ClipboardList,
  Hash,
  History,
  PackageSearch,
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
import { Label } from "@/components/ui/label";
import { ActivityList } from "@/modules/audit/ui/activity-list";
import { ItemCoverageSection } from "@/modules/assignments-2062/ui/item-coverage-section";
import { ContactPicker } from "@/modules/contacts/ui/contact-picker";
import type { HandReceiptRecord } from "@/modules/hand-receipts";
import type { ItemRecord } from "@/modules/items";
import { RequirementsPanel } from "@/modules/requirements/ui/requirements-list";
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

function DetailSummary({
  item,
  isReadOnly,
  onArchive,
  onEdit,
  onMove,
}: {
  item: ItemRecord;
  isReadOnly: boolean;
  onArchive: () => void;
  onEdit: () => void;
  onMove: () => void;
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
          <div className="flex items-center gap-2">
            {item.status === "active" ? (
              <>
                <Button
                  onClick={onMove}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <ArrowRightLeft aria-hidden="true" className="size-4" />
                  Move
                </Button>
                <Button
                  aria-label="Archive item"
                  onClick={onArchive}
                  size="icon-sm"
                  title="Archive item"
                  type="button"
                  variant="destructive"
                >
                  <Archive aria-hidden="true" className="size-4" />
                </Button>
              </>
            ) : null}
            <Button onClick={onEdit} size="sm" type="button" variant="outline">
              <Pencil aria-hidden="true" className="size-4" />
              Edit item
            </Button>
          </div>
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
        <MetadataRow label="Location" value={item.locationName ?? null} />
        <MetadataRow label="Updated" value={formatDate(item.updatedAt)} />
        <div className="md:col-span-2">
          <MetadataRow label="Notes" value={item.notes} />
        </div>
      </dl>
    </section>
  );
}

function MoveItemDialog({
  isOpen,
  item,
  isMoving,
  isMoveBlocked,
  moveCoverageError,
  isMoveCoverageLoading,
  moveTargets,
  onMove,
  onOpenChange,
  onTargetChange,
  targetHandReceiptId,
}: {
  isOpen: boolean;
  item: ItemRecord;
  isMoving: boolean;
  isMoveBlocked: boolean;
  moveCoverageError: string | null;
  isMoveCoverageLoading: boolean;
  moveTargets: HandReceiptRecord[];
  onMove: () => void;
  onOpenChange: (isOpen: boolean) => void;
  onTargetChange: (targetHandReceiptId: string) => void;
  targetHandReceiptId: string;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move item</DialogTitle>
          <DialogDescription>
            Move {item.nomenclature} to another active hand receipt. The item
            record, identifiers, and activity history stay preserved.
          </DialogDescription>
        </DialogHeader>
        {isMoveCoverageLoading ? (
          <p className="rounded-lg border bg-secondary px-3 py-2 text-sm text-muted-foreground">
            Checking active 2062 coverage...
          </p>
        ) : moveCoverageError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-3 text-sm text-destructive">
            <div className="flex items-start gap-2">
              <AlertTriangle
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0"
              />
              <div className="space-y-1">
                <p className="font-medium">Coverage check failed</p>
                <p className="leading-6">{moveCoverageError}</p>
              </div>
            </div>
          </div>
        ) : isMoveBlocked ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-3 text-sm text-destructive">
            <div className="flex items-start gap-2">
              <AlertTriangle
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0"
              />
              <div className="space-y-1">
                <p className="font-medium">Move blocked by active 2062</p>
                <p className="leading-6">
                  Close this item&apos;s active 2062 link before moving it to
                  another hand receipt. Use the 2062 Coverage section on this
                  item to review the active assignment.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="target-hand-receipt">Target hand receipt</Label>
            {moveTargets.length > 0 ? (
              <select
                className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                id="target-hand-receipt"
                onChange={(event) => onTargetChange(event.target.value)}
                value={targetHandReceiptId}
              >
                <option value="">Select active receipt</option>
                {moveTargets.map((receipt) => (
                  <option key={receipt.id} value={receipt.id}>
                    {receipt.name}
                  </option>
                ))}
              </select>
            ) : (
              <p className="rounded-lg border bg-secondary px-3 py-2 text-sm text-muted-foreground">
                Create another active hand receipt before moving this item.
              </p>
            )}
          </div>
        )}
        <DialogFooter>
          <Button
            disabled={isMoving}
            onClick={() => onOpenChange(false)}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            disabled={
              !targetHandReceiptId ||
              isMoving ||
              isMoveCoverageLoading ||
              Boolean(moveCoverageError) ||
              isMoveBlocked
            }
            onClick={onMove}
            type="button"
          >
            <ArrowRightLeft aria-hidden="true" className="size-4" />
            {isMoving ? "Moving" : "Move"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ItemDetail({ handReceiptId, itemId }: ItemDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [targetHandReceiptId, setTargetHandReceiptId] = useState("");
  const [lifecycleError, setLifecycleError] = useState<string | null>(null);
  const utilities = trpc.useUtils();
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
  const activeHandReceiptsQuery = trpc.handReceipts.list.useQuery({
    status: "active",
  });
  const capabilitiesQuery = trpc.billing.capabilities.useQuery();
  const moveCoverageQuery = trpc.items.hasActive2062Coverage.useQuery(
    { id: itemId },
    { enabled: isMoveDialogOpen },
  );
  const archiveCoverageQuery = trpc.items.getActive2062CoverageInfo.useQuery(
    { id: itemId },
    { enabled: isArchiveDialogOpen },
  );
  const item = itemQuery.data;
  const handReceipt = handReceiptQuery.data;
  const moveTargets =
    activeHandReceiptsQuery.data?.filter(
      (receipt) => receipt.id !== item?.handReceiptId,
    ) ?? [];
  const isReadOnly = capabilitiesQuery.data?.isReadOnly ?? false;
  const archiveCoverage = archiveCoverageQuery.data;
  const archiveHasActive2062 = archiveCoverage?.hasActiveCoverage === true;
  const archiveCoverageError = archiveCoverageQuery.error?.message ?? null;
  const archiveMutation = trpc.items.archive.useMutation({
    onSuccess: async (archived) => {
      setIsArchiveDialogOpen(false);
      await refreshItemLifecycleContext(archived);
    },
    onError: (error) => {
      setLifecycleError(error.message);
    },
  });
  const restoreMutation = trpc.items.restore.useMutation({
    onSuccess: async (restored) => {
      await refreshItemLifecycleContext(restored);
    },
    onError: (error) => {
      setLifecycleError(error.message);
    },
  });
  const moveMutation = trpc.items.move.useMutation({
    onSuccess: async (moved) => {
      const previousHandReceiptId = item?.handReceiptId ?? handReceiptId;

      setIsMoveDialogOpen(false);
      setTargetHandReceiptId("");
      await refreshItemLifecycleContext(moved, previousHandReceiptId);
    },
    onError: (error) => {
      setLifecycleError(error.message);
    },
  });
  const assignSignedToMutation = trpc.items.assignSignedTo.useMutation({
    onSuccess: async (assigned) => {
      await refreshItemLifecycleContext(assigned);
    },
    onError: (error) => {
      setLifecycleError(error.message);
    },
  });
  const assignSignedToWithNewContactMutation =
    trpc.items.assignSignedToWithNewContact.useMutation({
      onSuccess: async (assigned) => {
        await Promise.all([
          refreshItemLifecycleContext(assigned),
          utilities.contacts.list.invalidate(),
          utilities.contacts.search.invalidate(),
        ]);
      },
      onError: (error) => {
        setLifecycleError(error.message);
      },
    });
  const clearSignedToMutation = trpc.items.clearSignedTo.useMutation({
    onSuccess: async (cleared) => {
      await refreshItemLifecycleContext(cleared);
    },
    onError: (error) => {
      setLifecycleError(error.message);
    },
  });
  const signedToMutationPending =
    assignSignedToMutation.isPending ||
    assignSignedToWithNewContactMutation.isPending ||
    clearSignedToMutation.isPending;

  async function refreshItemLifecycleContext(
    updated: ItemRecord,
    previousHandReceiptId = updated.handReceiptId,
  ) {
    setLifecycleError(null);
    utilities.items.getById.setData({ id: itemId }, updated);
    await Promise.all([
      utilities.items.getById.invalidate({ id: itemId }),
      utilities.items.search.invalidate(),
      utilities.items.list.invalidate(),
      utilities.items.listByHandReceipt.invalidate({
        handReceiptId: previousHandReceiptId,
        status: "active",
      }),
      utilities.items.listByHandReceipt.invalidate({
        handReceiptId: previousHandReceiptId,
        status: "archived",
      }),
      utilities.items.listByHandReceipt.invalidate({
        handReceiptId: updated.handReceiptId,
        status: "active",
      }),
      utilities.items.listByHandReceipt.invalidate({
        handReceiptId: updated.handReceiptId,
        status: "archived",
      }),
      utilities.handReceipts.getById.invalidate({ id: updated.handReceiptId }),
      utilities.audit.listRecentActivity.invalidate(),
      utilities.audit.listTargetActivity.invalidate({
        targetType: "item",
        targetId: itemId,
      }),
      utilities.assignments2062.getItemCoverage.invalidate({ itemId }),
      utilities.assignments2062.list.invalidate(),
      utilities.items.hasActive2062Coverage.invalidate({ id: itemId }),
      utilities.items.getActive2062CoverageInfo.invalidate({ id: itemId }),
    ]);
  }

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
          and lifecycle changes are paused until access is restored.
        </p>
      ) : null}

      {lifecycleError ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          {lifecycleError}
        </p>
      ) : null}

      {!isReadOnly && item.status === "archived" ? (
        <Button
          disabled={restoreMutation.isPending}
          onClick={() => restoreMutation.mutate({ id: item.id })}
          size="sm"
          type="button"
          variant="outline"
        >
          <RotateCcw aria-hidden="true" className="size-4" />
          {restoreMutation.isPending ? "Restoring" : "Restore item"}
        </Button>
      ) : null}

      <MoveItemDialog
        isMoveBlocked={moveCoverageQuery.data?.hasActiveCoverage ?? false}
        moveCoverageError={moveCoverageQuery.error?.message ?? null}
        isMoveCoverageLoading={moveCoverageQuery.isFetching}
        isMoving={moveMutation.isPending}
        isOpen={isMoveDialogOpen}
        item={item}
        moveTargets={moveTargets}
        onMove={() =>
          moveMutation.mutate({
            id: item.id,
            targetHandReceiptId,
          })
        }
        onOpenChange={setIsMoveDialogOpen}
        onTargetChange={setTargetHandReceiptId}
        targetHandReceiptId={targetHandReceiptId}
      />

      <Dialog open={isArchiveDialogOpen} onOpenChange={setIsArchiveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive this item?</DialogTitle>
            <DialogDescription>
              {item.nomenclature} will leave active hand receipt workflows. The
              item record, identifiers, notes, and activity history stay
              preserved and can be restored later.
            </DialogDescription>
          </DialogHeader>
          {archiveCoverageQuery.isFetching ? (
            <p className="rounded-lg border bg-secondary px-3 py-2 text-sm text-muted-foreground">
              Checking active 2062 coverage...
            </p>
          ) : archiveCoverageError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-3 text-sm text-destructive">
              <div className="flex items-start gap-2">
                <AlertTriangle
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0"
                />
                <div className="space-y-1">
                  <p className="font-medium">Coverage check failed</p>
                  <p className="leading-6">{archiveCoverageError}</p>
                </div>
              </div>
            </div>
          ) : archiveHasActive2062 ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-3 text-sm text-destructive">
              <div className="flex items-start gap-2">
                <AlertTriangle
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0"
                />
                <div className="space-y-1">
                  <p className="font-medium">
                    Archiving will close the active 2062 link
                  </p>
                  <p className="leading-6">
                    The linked document and item history stay preserved.
                    {archiveCoverage?.isLastActiveLink
                      ? " This is the last active item on the 2062, so the assignment will close."
                      : " Other active items on the same 2062 stay covered."}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
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
              disabled={
                archiveMutation.isPending ||
                archiveCoverageQuery.isFetching ||
                Boolean(archiveCoverageError)
              }
              onClick={() => archiveMutation.mutate({ id: item.id })}
              type="button"
              variant="destructive"
            >
              <Archive aria-hidden="true" className="size-4" />
              {archiveMutation.isPending
                ? "Archiving"
                : archiveHasActive2062
                  ? "Archive and close link"
                  : "Archive"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
          onArchive={() => {
            setLifecycleError(null);
            setIsArchiveDialogOpen(true);
          }}
          onEdit={() => setIsEditing(true)}
          onMove={() => {
            setLifecycleError(null);
            setTargetHandReceiptId(moveTargets[0]?.id ?? "");
            setIsMoveDialogOpen(true);
          }}
        />
      )}

      {item.active2062Coverage ? null : (
        <ContactPicker
          currentContactName={item.signedToContactName ?? null}
          disabled={isReadOnly || item.status !== "active"}
          disabledReason={
            isReadOnly
              ? "Signed-to changes are paused while this account is read-only."
              : "Signed-to changes are unavailable for archived items."
          }
          isPending={signedToMutationPending}
          onAssignExisting={(contact) =>
            assignSignedToMutation.mutate({
              id: item.id,
              contactId: contact.id,
            })
          }
          onAssignNew={(contactDisplayName) =>
            assignSignedToWithNewContactMutation.mutate({
              id: item.id,
              contactDisplayName,
            })
          }
          onClear={() =>
            clearSignedToMutation.mutate({
              id: item.id,
            })
          }
        />
      )}

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <RequirementsPanel
          isItemActive={item.status === "active"}
          isReadOnly={isReadOnly}
          itemId={item.id}
        />
        <ItemCoverageSection
          isReadOnly={isReadOnly}
          itemId={item.id}
          itemStatus={item.status}
          signedToContactName={item.signedToContactName ?? null}
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
