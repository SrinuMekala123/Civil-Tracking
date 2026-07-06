"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Shield,
  Calendar,
  CalendarDays,
  GitCommit,
  Bell,
  FileText,
  Search,
  Settings,
  UserCog,
  Activity,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: string;
  badge?: number;
}

export const navItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/ias-database", label: "IAS Database", icon: "Users" },
  { href: "/ips-database", label: "IPS Database", icon: "Shield" },
  { href: "/meetings", label: "Meetings", icon: "Calendar" },
  { href: "/calendar", label: "Calendar", icon: "CalendarDays" },
  { href: "/updates", label: "Updates Log", icon: "GitCommit" },
  { href: "/notifications", label: "Notifications", icon: "Bell", badge: 3 },
  { href: "/reports", label: "Reports", icon: "FileText" },
  { href: "/search", label: "Search Officers", icon: "Search" },
  { href: "/users", label: "User Management", icon: "UserCog" },
  { href: "/activity", label: "Activity Log", icon: "Activity" },
  { href: "/settings", label: "Settings", icon: "Settings" },
];

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  Users,
  Shield,
  Calendar,
  CalendarDays,
  GitCommit,
  Bell,
  FileText,
  Search,
  Settings,
  UserCog,
  Activity,
};

export function NavigationItem({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const Icon = iconMap[item.icon];

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 w-full text-sm font-medium py-1.5 px-2 rounded-lg transition-colors",
        pathname === item.href
          ? "bg-sidebar-primary text-sidebar-primary-foreground"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-white"
      )}
    >
      {Icon ? <Icon className="w-4 h-4" /> : null}
      <span className="flex-1">{item.label}</span>
      {item.badge ? (
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-500 text-white font-semibold">
          {item.badge}
        </span>
      ) : null}
    </Link>
  );
}
