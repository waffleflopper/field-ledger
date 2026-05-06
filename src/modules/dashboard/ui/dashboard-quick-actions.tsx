import { ClipboardList, PackagePlus, ReceiptText, Search } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

const actionIconClasses =
  "flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary text-primary transition-colors group-hover:bg-background";

const secondaryActions = [
  {
    href: "/app/items",
    icon: Search,
    label: "Find an item",
  },
  {
    icon: ReceiptText,
    href: "/app/active-2062s",
    label: "Review active 2062s",
  },
];

export function DashboardQuickActions({
  isReadOnly,
  layout = "full",
}: {
  isReadOnly: boolean;
  layout?: "full" | "rail";
}) {
  if (isReadOnly) {
    return null;
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold tracking-normal">
          Common actions
        </h2>
        <Link
          className="inline-flex min-h-10 items-center gap-1.5 rounded-sm text-sm font-medium text-muted-foreground underline-offset-4 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          href="/app/hand-receipts?view=archived"
        >
          <ClipboardList aria-hidden="true" className="size-3.5" />
          Archived receipts
        </Link>
      </div>
      <div
        className={cn(
          "grid gap-2",
          layout === "full"
            ? "lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]"
            : "",
        )}
      >
        <Link
          className="group flex min-h-16 items-center gap-3 rounded-lg border border-primary/40 bg-primary/10 px-3 py-3 text-card-foreground transition-colors hover:border-primary/60 hover:bg-primary/15 active:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          href="/app/hand-receipts"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <PackagePlus aria-hidden="true" className="size-4" />
          </span>
          <span className="space-y-0.5">
            <span className="block text-sm font-semibold tracking-normal">
              Add property item
            </span>
            <span className="block text-xs text-muted-foreground">
              Open hand receipts and choose where the item belongs.
            </span>
          </span>
        </Link>
        <div
          className={cn(
            "grid gap-2",
            layout === "full" ? "sm:grid-cols-2 lg:grid-cols-1" : "",
          )}
        >
          {secondaryActions.map(({ href, icon: Icon, label }) => (
            <Link
              className="group flex min-h-14 items-center gap-3 rounded-lg border bg-card px-3 py-2 text-card-foreground transition-colors hover:border-primary/30 hover:bg-secondary/60 active:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              href={href}
              key={label}
            >
              <span className={actionIconClasses}>
                <Icon aria-hidden="true" className="size-4" />
              </span>
              <span className="text-sm font-semibold tracking-normal">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
