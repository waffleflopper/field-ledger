import { ClipboardList, PackagePlus, ReceiptText, Search } from "lucide-react";
import Link from "next/link";

const actionIconClasses =
  "flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary text-primary";

const dashboardActions = [
  {
    href: "/app/hand-receipts",
    icon: PackagePlus,
    label: "Add item",
  },
  {
    href: "/app/items",
    icon: Search,
    label: "Search items",
  },
  {
    icon: ReceiptText,
    href: "/app/active-2062s",
    label: "Review 2062s",
  },
  {
    href: "/app/hand-receipts?view=archived",
    icon: ClipboardList,
    label: "Review archived receipts",
  },
];

export function DashboardQuickActions({ isReadOnly }: { isReadOnly: boolean }) {
  if (isReadOnly) {
    return null;
  }

  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold tracking-normal">Quick Actions</h2>
      <div className="grid gap-2 sm:grid-cols-2">
        {dashboardActions.map(({ href, icon: Icon, label }) => (
          <Link
            className="flex min-h-14 items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-card-foreground transition-colors hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
    </section>
  );
}
