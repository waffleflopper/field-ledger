"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { trpc } from "@/trpc/react";
import { ItemDetail } from "./item-detail";

export function ItemGlobalDetail({ itemId }: { itemId: string }) {
  const itemQuery = trpc.items.getById.useQuery({ id: itemId });

  if (itemQuery.isLoading) {
    return (
      <section className="space-y-4">
        <div className="h-8 w-28 rounded-lg bg-secondary" />
        <div className="h-24 rounded-lg border bg-card" />
        <div className="h-80 rounded-lg border bg-card" />
      </section>
    );
  }

  if (itemQuery.error || !itemQuery.data) {
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
