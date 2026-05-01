"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { trpc } from "@/trpc/react";
import { ItemDetail } from "./item-detail";

export function ItemGlobalDetail({ itemId }: { itemId: string }) {
  const itemQuery = trpc.items.getById.useQuery({ id: itemId });
  const isNotFound = itemQuery.error?.data?.code === "NOT_FOUND";

  if (itemQuery.isLoading) {
    return (
      <section className="space-y-4">
        <div className="h-8 w-28 rounded-lg bg-secondary" />
        <div className="h-24 rounded-lg border bg-card" />
        <div className="h-80 rounded-lg border bg-card" />
      </section>
    );
  }

  if (itemQuery.error && !isNotFound) {
    return (
      <section className="space-y-4">
        <Button asChild variant="outline">
          <Link href="/app/items">
            <ArrowLeft aria-hidden="true" className="size-4" />
            Items
          </Link>
        </Button>
        <div
          className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4"
          role="alert"
        >
          <div>
            <h1 className="text-xl font-semibold tracking-normal text-destructive">
              Item could not be loaded
            </h1>
            <p className="mt-2 text-sm leading-6 text-destructive">
              Retry before treating this item as missing.
            </p>
          </div>
          <Button
            onClick={() => void itemQuery.refetch()}
            size="sm"
            type="button"
            variant="outline"
          >
            Retry
          </Button>
        </div>
      </section>
    );
  }

  if (isNotFound || !itemQuery.data) {
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

  return (
    <ItemDetail
      handReceiptId={itemQuery.data.handReceiptId}
      itemId={itemQuery.data.id}
    />
  );
}
