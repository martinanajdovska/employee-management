"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import {
  Bell,
  Briefcase,
  CalendarDays,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  UserRound,
  Users
} from "lucide-react";
import { useMemo } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import type { Role } from "@/types/api";

interface SidebarLink {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

const employeeLinks: SidebarLink[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/profile", label: "Profile", icon: UserRound },
  { href: "/leave/request", label: "Leave Request", icon: Briefcase },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/surveys", label: "Surveys", icon: ClipboardCheck },
  { href: "/notifications", label: "Notifications", icon: Bell }
];

const hrLinks: SidebarLink[] = [
  { href: "/hr", label: "HR Dashboard", icon: LayoutDashboard },
  { href: "/hr/employees", label: "Employees", icon: Users },
  { href: "/hr/leaves", label: "Leaves", icon: Briefcase },
  { href: "/hr/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/hr/surveys", label: "Surveys", icon: ClipboardCheck },
  { href: "/notifications", label: "Notifications", icon: Bell }
];

export function AppSidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const links = role === "ROLE_ADMIN" ? hrLinks : employeeLinks;
  const notificationsQuery = useNotifications();
  const unreadCount = useMemo(
    () => notificationsQuery.data?.filter((item) => !item.isRead).length ?? 0,
    [notificationsQuery.data]
  );

  return (
    <aside className="w-full border-r border-border/70 bg-card/90 backdrop-blur md:h-screen md:w-64">
      <div className="border-b border-border/70 p-5">
        <p className="font-heading text-xl font-bold text-primary">EmployeeOS</p>
        <p className="text-xs text-muted-foreground">Management Workspace</p>
      </div>
      <nav className="flex flex-row overflow-x-auto p-3 md:flex-col md:gap-1 md:overflow-visible">
        {links.map((link) => {
          const isActive =
            pathname === link.href ||
            (link.href !== "/dashboard" &&
              link.href !== "/hr" &&
              pathname.startsWith(`${link.href}/`));
          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "mr-2 flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors md:mr-0",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{link.label}</span>
              {link.href === "/notifications" && unreadCount > 0 ? (
                <span
                  className={cn(
                    "ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    isActive ? "bg-primary-foreground/20" : "bg-primary text-primary-foreground"
                  )}
                >
                  {unreadCount}
                </span>
              ) : null}
            </Link>
          );
        })}

        <Link
          href="/logout"
          className="mr-2 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:mr-0"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </Link>
      </nav>
    </aside>
  );
}
