"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal } from "lucide-react";

import {
  footerNavItems,
  isNavItemActive,
  primaryNavItems,
  secondaryNavItems,
  type ShellNavItem,
} from "@/components/shell/navigation-config";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

function BottomNavLink({
  item,
  pathname,
}: {
  item: ShellNavItem;
  pathname: string;
}) {
  const active = isNavItemActive(pathname, item.href);
  const Icon = item.icon;

  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-md px-1 py-2 text-[0.68rem] font-semibold leading-none text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active && "bg-primary text-primary-foreground",
      )}
      href={item.href}
    >
      <Icon aria-hidden="true" className="size-5 shrink-0" />
      <span className="max-w-full truncate">{item.label}</span>
    </Link>
  );
}

function MoreSheetLink({ item }: { item: ShellNavItem }) {
  const Icon = item.icon;

  return (
    <SheetClose asChild>
      <Link
        className="flex min-h-11 items-center gap-3 rounded-md border border-border bg-card px-3 text-sm font-medium text-card-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        href={item.href}
      >
        <Icon aria-hidden="true" className="size-4 shrink-0 text-primary" />
        <span>{item.label}</span>
      </Link>
    </SheetClose>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const moreItems = [...secondaryNavItems, ...footerNavItems];
  const moreActive = moreItems.some((item) =>
    isNavItemActive(pathname, item.href),
  );

  return (
    <nav
      aria-label="Primary mobile navigation"
      className="fixed inset-x-0 bottom-0 z-30 border-t bg-card/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 text-card-foreground backdrop-blur md:hidden"
      data-testid="mobile-bottom-nav"
    >
      <div className="mx-auto flex max-w-md items-stretch gap-1">
        {primaryNavItems.map((item) => (
          <BottomNavLink item={item} key={item.href} pathname={pathname} />
        ))}
        <Sheet>
          <SheetTrigger asChild>
            <button
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-md px-1 py-2 text-[0.68rem] font-semibold leading-none text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                moreActive && "bg-primary text-primary-foreground",
              )}
              type="button"
            >
              <MoreHorizontal aria-hidden="true" className="size-5 shrink-0" />
              <span>More</span>
            </button>
          </SheetTrigger>
          <SheetContent className="rounded-t-lg px-4 pb-6" side="bottom">
            <SheetHeader className="px-0">
              <SheetTitle>More</SheetTitle>
              <SheetDescription>
                Additional Field Ledger surfaces.
              </SheetDescription>
            </SheetHeader>
            <div className="grid gap-2">
              {moreItems.map((item) => (
                <MoreSheetLink item={item} key={item.href} />
              ))}
              <form action="/auth/signout" method="post">
                <Button
                  className="w-full justify-start"
                  type="submit"
                  variant="outline"
                >
                  Sign out
                </Button>
              </form>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
