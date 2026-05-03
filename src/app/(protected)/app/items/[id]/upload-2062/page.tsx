import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Upload2062Form } from "@/modules/assignments-2062/ui/upload-2062-form";
import { getItem } from "@/modules/items";
import { createTRPCContext } from "@/server/trpc/context";

function ItemUnavailable() {
  return (
    <section className="space-y-4">
      <Button asChild variant="outline">
        <Link href="/app/items">
          <ArrowLeft aria-hidden="true" className="size-4" />
          Items
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
    return <ItemUnavailable />;
  }

  const isReadOnly = ctx.account.accessState === "paused_read_only";

  if (item.status !== "active" || item.active2062Coverage) {
    return <ItemUnavailable />;
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
