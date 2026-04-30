"use client";

import type { AccountCapabilities } from "@/modules/billing";
import type { HandReceiptRecord } from "@/modules/hand-receipts";
import { trpc } from "@/trpc/react";
import { CreateHandReceiptForm } from "./create-hand-receipt-form";
import { HandReceiptEmptyState } from "./hand-receipt-empty-state";
import { HandReceiptList } from "./hand-receipt-list";

type HandReceiptsWorkspaceProps = {
  initialCapabilities: AccountCapabilities;
  initialHandReceipts: HandReceiptRecord[];
};

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
  const handReceiptsQuery = trpc.handReceipts.list.useQuery(undefined, {
    initialData: initialHandReceipts,
  });
  const capabilitiesQuery = trpc.billing.capabilities.useQuery(undefined, {
    initialData: initialCapabilities,
  });
  const createMutation = trpc.handReceipts.create.useMutation({
    onSuccess: async () => {
      await utilities.handReceipts.list.invalidate();
      await utilities.billing.capabilities.invalidate();
    },
  });

  const handReceipts = handReceiptsQuery.data ?? [];
  const capabilities = capabilitiesQuery.data ?? initialCapabilities;
  const disabledReason = getCreateDisabledReason(
    capabilities,
    handReceipts.length,
  );
  const canCreate = disabledReason === null;

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
            Create and review the account-owned buckets that will hold property
            items and future 2062 workflows.
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

      {handReceiptsQuery.isLoading ? (
        <div className="space-y-2">
          <div className="h-20 rounded-lg border bg-card" />
          <div className="h-20 rounded-lg border bg-card" />
        </div>
      ) : handReceipts.length > 0 ? (
        <HandReceiptList handReceipts={handReceipts} />
      ) : (
        <HandReceiptEmptyState canCreate={canCreate} />
      )}
    </section>
  );
}
