"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";

import {
  footerNavItems,
  isNavItemActive,
  primaryNavItems,
  secondaryNavItems,
  type ShellNavItem,
} from "@/components/shell/navigation-config";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { FeedbackDialog } from "@/modules/feedback/ui/feedback-dialog";

function SidebarNavItem({
  item,
  pathname,
}: {
  item: ShellNavItem;
  pathname: string;
}) {
  const active = isNavItemActive(pathname, item.href);
  const Icon = item.icon;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
        <Link href={item.href}>
          <Icon aria-hidden="true" />
          <span>{item.label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar
      className="border-sidebar-border"
      collapsible="icon"
      data-testid="desktop-sidebar"
    >
      <SidebarHeader className="border-b border-sidebar-border p-3 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:p-2">
        <div className="flex items-center justify-between gap-2 group-data-[collapsible=icon]:justify-center">
          <Link
            className="flex min-w-0 items-center gap-2 rounded-md px-1 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-data-[collapsible=icon]:hidden"
            data-testid="sidebar-brand"
            href="/app/dashboard"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-primary text-sm font-semibold text-primary-foreground">
              FL
            </span>
            <span className="truncate text-sm font-semibold tracking-normal group-data-[collapsible=icon]:hidden">
              Field Ledger
            </span>
          </Link>
          <SidebarTrigger
            aria-label="Toggle app sidebar"
            data-testid="sidebar-toggle"
          />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {primaryNavItems.map((item) => (
                <SidebarNavItem
                  item={item}
                  key={item.href}
                  pathname={pathname}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupLabel>Records</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryNavItems.map((item) => (
                <SidebarNavItem
                  item={item}
                  key={item.href}
                  pathname={pathname}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <FeedbackDialog triggerClassName="h-8 w-full justify-start px-2 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:[&_span]:hidden" />
        <SidebarMenu>
          {footerNavItems.map((item) => (
            <SidebarNavItem item={item} key={item.href} pathname={pathname} />
          ))}
        </SidebarMenu>
        <form action="/auth/signout" method="post">
          <button
            aria-label="Sign out"
            className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-data-[collapsible=icon]:justify-center"
          >
            <LogOut aria-hidden="true" className="size-4 shrink-0" />
            <span className="group-data-[collapsible=icon]:hidden">
              Sign out
            </span>
          </button>
        </form>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
