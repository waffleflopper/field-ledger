"use client";

import type { AccountCapabilities } from "@/modules/billing";
import type { HandReceiptRecord } from "@/modules/hand-receipts";
import { trpc } from "@/trpc/react";
import { useState } from "react";
import { CreateHandReceiptForm } from "./create-hand-receipt-form";
import { HandReceiptEmptyState } from "./hand-receipt-empty-state";
import { HandReceiptList } from "./hand-receipt-list";

type HandReceiptsWorkspaceProps = {
  initialCapabilities: AccountCapabilities;
  initialHandReceipts: HandReceiptRecord[];
};

type HandReceiptView = "active" | "archived";

function getCreateDisabledReason(
  capabilities: AccountCapabilities,
  activeCount: number,
) {
  if (capabilities.isReadOnly) {
    return "This account is read-only. Existing records remain available.";
  }

  if (
    capabilities.activeHandReceiptLimit !== null &&
    activeCount >= capabilities.activeHandReceiptLimit
  ) {
    return `Base allows ${capabilities.activeHandReceiptLimit} active hand receipts. Archive one or upgrade before creating another.`;
  }

  return null;
}

export function HandReceiptsWorkspace({
  initialCapabilities,
  initialHandReceipts,
}: HandReceiptsWorkspaceProps) {
  const utilities = trpc.useUtils();
  const [view, setView] = useState<HandReceiptView>("active");
  const activeHandReceiptsQuery = trpc.handReceipts.list.useQuery(
    { status: "active" },
    {
      initialData: initialHandReceipts,
    },
  );
  const archivedHandReceiptsQuery = trpc.handReceipts.listArchived.useQuery();
  const capabilitiesQuery = trpc.billing.capabilities.useQuery(undefined, {
    initialData: initialCapabilities,
  });
  const createMutation = trpc.handReceipts.create.useMutation({
    onSuccess: async () => {
      await utilities.handReceipts.list.invalidate();
      await utilities.handReceipts.listArchived.invalidate();
      await utilities.billing.capabilities.invalidate();
    },
  });
  const restoreMutation = trpc.handReceipts.restore.useMutation({
    onSuccess: async () => {
      await utilities.handReceipts.list.invalidate();
      await utilities.handReceipts.listArchived.invalidate();
      await utilities.billing.capabilities.invalidate();
    },
  });

  const activeHandReceipts = activeHandReceiptsQuery.data ?? [];
  const archivedHandReceipts = archivedHandReceiptsQuery.data ?? [];
  const handReceipts =
    view === "active" ? activeHandReceipts : archivedHandReceipts;
  const currentQuery =
    view === "active" ? activeHandReceiptsQuery : archivedHandReceiptsQuery;
  const capabilities = capabilitiesQuery.data ?? initialCapabilities;
  const disabledReason = getCreateDisabledReason(
    capabilities,
    activeHandReceipts.length,
  );
  const canCreate = disabledReason === null;
  const canRestore = !capabilities.isReadOnly;

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            Active receipts
          </p>
          <h1 className="text-2xl font-semibold tracking-normal md:text-3xl">
            Hand Receipts
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Create and review active buckets, or deliberately switch to archived
            records when you need preserved history.
          </p>
        </div>

        <CreateHandReceiptForm
          canCreate={canCreate}
          disabledReason={disabledReason}
          onSubmit={async (input) => {
            await createMutation.mutateAsync(input);
          }}
        />
      </div>

      {disabledReason ? (
        <p className="rounded-lg border bg-secondary px-4 py-3 text-sm text-muted-foreground">
          {disabledReason}
        </p>
      ) : null}

      <div className="flex w-fit rounded-lg border bg-card p-1">
        <button
          className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors aria-pressed:bg-primary aria-pressed:text-primary-foreground"
          onClick={() => setView("active")}
          aria-pressed={view === "active"}
          type="button"
        >
          Active
        </button>
        <button
          className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors aria-pressed:bg-primary aria-pressed:text-primary-foreground"
          onClick={() => setView("archived")}
          aria-pressed={view === "archived"}
          type="button"
        >
          Archived
        </button>
      </div>

      {currentQuery.isLoading ? (
        <div className="space-y-2">
          <div className="h-20 rounded-lg border bg-card" />
          <div className="h-20 rounded-lg border bg-card" />
        </div>
      ) : handReceipts.length > 0 ? (
        <HandReceiptList
          canRestore={canRestore}
          handReceipts={handReceipts}
          onRestore={(handReceipt) => {
            restoreMutation.mutate({ id: handReceipt.id });
          }}
          restorePendingId={restoreMutation.variables?.id ?? null}
        />
      ) : view === "archived" ? (
        <div className="rounded-lg border bg-card p-4">
          <h2 className="text-base font-semibold tracking-normal">
            No archived hand receipts
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Archived records will appear here after they leave active workflows.
          </p>
        </div>
      ) : (
        <HandReceiptEmptyState canCreate={canCreate} />
      )}
    </section>
  );
}
