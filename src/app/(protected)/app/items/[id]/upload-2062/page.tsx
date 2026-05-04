import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Upload2062Form } from "@/modules/assignments-2062/ui/upload-2062-form";
import { getItem } from "@/modules/items";
import { createTRPCContext } from "@/server/trpc/context";

type ItemUnavailableReason = "not_found" | "archived" | "active_coverage";

function itemUnavailableCopy(reason: ItemUnavailableReason) {
  if (reason === "archived") {
    return {
      title: "This item is archived",
      description:
        "Archived items cannot receive new 2062 assignments. Restore the item before creating new formal coverage.",
    };
  }

  if (reason === "active_coverage") {
    return {
      title: "This item already has active 2062 coverage",
      description: "Close the existing assignment before creating a new one.",
    };
  }

  return {
    title: "Item not found",
    description: "This item is unavailable or outside the current account.",
  };
}

function ItemUnavailable({ reason }: { reason: ItemUnavailableReason }) {
  const copy = itemUnavailableCopy(reason);

  return (
    <section className="space-y-4">
      <Button asChild variant="outline">
        <Link href="/app/items">
          <ArrowLeft aria-hidden="true" className="size-4" />
          Items
        </Link>
      </Button>
      <div className="rounded-lg border bg-card p-4">
        <h1 className="text-xl font-semibold tracking-normal">{copy.title}</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {copy.description}
        </p>
      </div>
    </section>
  );
}

export default async function Upload2062Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await createTRPCContext();

  if (!ctx.account) {
    return null;
  }

  const item = await getItem({
    accountId: ctx.account.id,
    itemId: id,
    repository: ctx.itemRepository,
  });

  if (!item) {
    return <ItemUnavailable reason="not_found" />;
  }

  const isReadOnly = ctx.account.accessState === "paused_read_only";

  if (item.status !== "active") {
    return <ItemUnavailable reason="archived" />;
  }

  if (item.active2062Coverage) {
    return <ItemUnavailable reason="active_coverage" />;
  }

  return (
    <section className="space-y-5">
      <div className="space-y-3">
        <Button asChild size="sm" variant="outline">
          <Link href={`/app/items/${item.id}`}>
            <ArrowLeft aria-hidden="true" className="size-4" />
            Back to item
          </Link>
        </Button>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            Formal 2062 coverage
          </p>
          <h1 className="text-2xl font-semibold tracking-normal md:text-3xl">
            Upload 2062
          </h1>
        </div>
      </div>
      <Upload2062Form isReadOnly={isReadOnly} item={item} />
    </section>
  );
}
