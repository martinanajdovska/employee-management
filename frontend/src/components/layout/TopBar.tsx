"use client";

import { BellDot } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { ROLE_LABEL } from "@/lib/nav";
import { Badge } from "@/components/ui/badge";
import type { User } from "@/types/api";

export function TopBar({ me }: { me: User }) {
  const notificationsQuery = useNotifications();

  const unreadCount = useMemo(
    () => notificationsQuery.data?.filter((item) => !item.isRead).length ?? 0,
    [notificationsQuery.data]
  );

  return (
    <header className="flex h-16 items-center justify-between border-b border-border/70 bg-background/90 px-4 backdrop-blur md:px-6">
      <div>
        <p className="font-heading text-lg font-bold">Welcome, {me.firstName}</p>
        <p className="text-sm text-muted-foreground">Role: {ROLE_LABEL[me.role]}</p>
      </div>

      <div className="flex items-center gap-3">
        <Badge variant="secondary" className="px-3 py-1 text-xs">
          {me.department || "No department"}
        </Badge>
        <Link
          href="/notifications"
          className="relative rounded-md border border-border/70 p-2 hover:bg-muted"
        >
          <BellDot className="h-5 w-5" />
          {unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
              {unreadCount}
            </span>
          ) : null}
        </Link>
      </div>
    </header>
  );
}
