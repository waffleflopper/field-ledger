"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ReceiptText, Undo2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  ActiveAssignmentItemSummary,
  ActiveAssignmentSummary,
} from "@/modules/assignments-2062";
import { trpc } from "@/trpc/react";

function todayDateOnly() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function CloseAssignmentDialog({
  assignment,
  disabled,
  onClosed,
}: {
  assignment: ActiveAssignmentSummary;
  disabled: boolean;
  onClosed: () => Promise<void>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [closedOn, setClosedOn] = useState(todayDateOnly());
  const [error, setError] = useState<string | null>(null);
  const closeMutation = trpc.assignments2062.close.useMutation({
    onSuccess: async () => {
      setIsOpen(false);
      setError(null);
      setClosedOn(todayDateOnly());
      await onClosed();
    },
    onError: (mutationError) => {
      setError(mutationError.message);
    },
  });
  const today = todayDateOnly();
  const isFutureDate = closedOn > today;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isFutureDate) {
      setError("Close date cannot be in the future.");
      return;
    }

    closeMutation.mutate({
      assignmentId: assignment.id,
      closedOn,
    });
  }

  return (
    <>
      <Button
        disabled={disabled}
        onClick={() => setIsOpen(true)}
        size="sm"
        title={disabled ? "This account is read-only." : "Close assignment"}
        type="button"
        variant="outline"
      >
        <Undo2 aria-hidden="true" className="size-4" />
        Close
      </Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <form className="space-y-4" onSubmit={submit}>
            <DialogHeader>
              <DialogTitle>Close this 2062 assignment?</DialogTitle>
              <DialogDescription>
                All {assignment.itemCount} active{" "}
                {assignment.itemCount === 1 ? "item" : "items"} for{" "}
                {assignment.contactName} will be released. The document and
                assignment history stay preserved.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor={`close-${assignment.id}`}>Close date</Label>
              <Input
                id={`close-${assignment.id}`}
                max={today}
                onChange={(event) => {
                  setClosedOn(event.target.value);
                  setError(null);
                }}
                required
                type="date"
                value={closedOn}
              />
            </div>
            {error || isFutureDate ? (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error ?? "Close date cannot be in the future."}
              </p>
            ) : null}
            <DialogFooter>
              <Button
                disabled={closeMutation.isPending}
                onClick={() => setIsOpen(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                disabled={closeMutation.isPending || isFutureDate}
                type="submit"
                variant="destructive"
              >
                {closeMutation.isPending ? "Closing" : "Close assignment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function RemoveItemLinkDialog({
  assignment,
  disabled,
  item,
  onRemoved,
}: {
  assignment: ActiveAssignmentSummary;
  disabled: boolean;
  item: ActiveAssignmentItemSummary;
  onRemoved: () => Promise<void>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [closedOn, setClosedOn] = useState(todayDateOnly());
  const [error, setError] = useState<string | null>(null);
  const removeMutation = trpc.assignments2062.removeItemLink.useMutation({
    onSuccess: async () => {
      setIsOpen(false);
      setError(null);
      setClosedOn(todayDateOnly());
      await onRemoved();
    },
    onError: (mutationError) => {
      setError(mutationError.message);
    },
  });
  const today = todayDateOnly();
  const isFutureDate = closedOn > today;
  const isLastItem = assignment.itemCount === 1;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isFutureDate) {
      setError("Close date cannot be in the future.");
      return;
    }

    removeMutation.mutate({
      itemLinkId: item.linkId,
      closedOn,
    });
  }

  return (
    <>
      <Button
        aria-label={`Remove ${item.nomenclature} from 2062`}
        disabled={disabled}
        onClick={() => setIsOpen(true)}
        size="icon-sm"
        title={
          disabled ? "This account is read-only." : "Remove item from 2062"
        }
        type="button"
        variant="ghost"
      >
        <X aria-hidden="true" className="size-4" />
      </Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <form className="space-y-4" onSubmit={submit}>
            <DialogHeader>
              <DialogTitle>Remove item from 2062?</DialogTitle>
              <DialogDescription>
                {item.nomenclature} will be released from this assignment and
                its current signed-to state will be cleared.
              </DialogDescription>
            </DialogHeader>
            {isLastItem ? (
              <p className="rounded-lg border bg-secondary px-3 py-2 text-sm text-muted-foreground">
                This is the last active item, so the assignment will close too.
              </p>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor={`remove-${item.linkId}`}>Remove date</Label>
              <Input
                id={`remove-${item.linkId}`}
                max={today}
                onChange={(event) => {
                  setClosedOn(event.target.value);
                  setError(null);
                }}
                required
                type="date"
                value={closedOn}
              />
            </div>
            {error || isFutureDate ? (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error ?? "Close date cannot be in the future."}
              </p>
            ) : null}
            <DialogFooter>
              <Button
                disabled={removeMutation.isPending}
                onClick={() => setIsOpen(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                disabled={removeMutation.isPending || isFutureDate}
                type="submit"
                variant="destructive"
              >
                {removeMutation.isPending ? "Removing" : "Remove item"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function HandReceipt2062Context({
  handReceiptId,
  isReadOnly,
  isReceiptActive,
}: {
  handReceiptId: string;
  isReadOnly: boolean;
  isReceiptActive: boolean;
}) {
  const assignmentsQuery =
    trpc.assignments2062.getHandReceiptAssignments.useQuery({
      handReceiptId,
    });
  const utilities = trpc.useUtils();
  const assignments = assignmentsQuery.data ?? [];
  const canUpload = !isReadOnly && isReceiptActive;
  const canCloseOrRemove = !isReadOnly;

  async function refresh2062Context() {
    await Promise.all([
      assignmentsQuery.refetch(),
      utilities.assignments2062.list.invalidate(),
      utilities.assignments2062.getHandReceiptAssignments.invalidate({
        handReceiptId,
      }),
      utilities.items.listByHandReceipt.invalidate({ handReceiptId }),
      utilities.items.search.invalidate(),
      utilities.audit.listRecentActivity.invalidate(),
      utilities.audit.listTargetActivity.invalidate({
        targetType: "hand_receipt",
        targetId: handReceiptId,
      }),
    ]);
  }

  return (
    <section className="space-y-3 rounded-lg border bg-card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
            <ReceiptText aria-hidden="true" className="size-4" />
          </span>
          <div className="space-y-1">
            <h2 className="text-sm font-semibold tracking-normal">
              Active 2062s
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Formal assignments tied to this hand receipt.
            </p>
          </div>
        </div>
        <Button
          asChild={canUpload}
          disabled={!canUpload}
          size="sm"
          title={
            isReadOnly
              ? "2062 creation is paused while this account is read-only."
              : isReceiptActive
                ? "Upload a 2062 for multiple items"
                : "Archived hand receipts cannot receive new 2062 assignments."
          }
          type="button"
          variant="outline"
        >
          {canUpload ? (
            <Link href={`/app/hand-receipts/${handReceiptId}/upload-2062`}>
              Upload 2062
            </Link>
          ) : (
            <>Upload 2062</>
          )}
        </Button>
      </div>

      {assignmentsQuery.isLoading ? (
        <div className="h-24 rounded-lg border bg-secondary" />
      ) : assignmentsQuery.error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {assignmentsQuery.error.message}
        </p>
      ) : assignments.length === 0 ? (
        <p className="rounded-lg border bg-background px-3 py-2 text-sm leading-6 text-muted-foreground">
          No active 2062 assignments for this hand receipt.
        </p>
      ) : (
        <div className="divide-y rounded-lg border bg-background">
          {assignments.map((assignment) => (
            <div className="space-y-3 px-3 py-3" key={assignment.id}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {assignment.contactName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {assignment.itemCount}{" "}
                    {assignment.itemCount === 1 ? "item" : "items"} covered
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <CloseAssignmentDialog
                    assignment={assignment}
                    disabled={!canCloseOrRemove}
                    onClosed={refresh2062Context}
                  />
                  <Button asChild size="sm" variant="ghost">
                    <Link href="/app/active-2062s">View</Link>
                  </Button>
                </div>
              </div>
              {assignment.activeItems.length > 0 ? (
                <div className="space-y-2">
                  {assignment.activeItems.map((item) => (
                    <div
                      className="flex min-w-0 items-center justify-between gap-2 rounded-md border bg-card px-2 py-1.5"
                      key={item.linkId}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {item.nomenclature}
                        </p>
                        <p className="font-mono text-[0.68rem] uppercase text-muted-foreground">
                          {item.identifier}
                        </p>
                      </div>
                      <RemoveItemLinkDialog
                        assignment={assignment}
                        disabled={!canCloseOrRemove}
                        item={item}
                        onRemoved={refresh2062Context}
                      />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
