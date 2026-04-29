import {
  Activity,
  ClipboardList,
  CreditCard,
  Home,
  MapPin,
  ReceiptText,
  Search,
  Settings,
  UserRound,
  type LucideIcon,
} from "lucide-react";

export type ShellNavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
};

export const primaryNavItems = [
  {
    href: "/app/dashboard",
    icon: Home,
    label: "Dashboard",
  },
  {
    href: "/app/items",
    icon: Search,
    label: "Items",
  },
  {
    href: "/app/hand-receipts",
    icon: ClipboardList,
    label: "Hand Receipts",
  },
] satisfies ShellNavItem[];

export const secondaryNavItems = [
  {
    href: "/app/active-2062s",
    icon: ReceiptText,
    label: "Active 2062s",
  },
  {
    href: "/app/contacts",
    icon: UserRound,
    label: "Contacts",
  },
  {
    href: "/app/locations",
    icon: MapPin,
    label: "Locations",
  },
  {
    href: "/app/activity",
    icon: Activity,
    label: "Activity",
  },
] satisfies ShellNavItem[];

export const footerNavItems = [
  {
    href: "/app/settings",
    icon: Settings,
    label: "Settings",
  },
  {
    href: "/app/billing",
    icon: CreditCard,
    label: "Billing",
  },
] satisfies ShellNavItem[];

export function isNavItemActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
