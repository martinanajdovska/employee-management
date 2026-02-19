"use client";

import { formatDistanceToNow } from "date-fns";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMarkNotificationRead, useNotifications } from "@/hooks/useNotifications";
import { resolveNotificationHref } from "@/lib/notifications";
import { cn } from "@/lib/utils";
import type { NotificationItem } from "@/types/api";

export default function NotificationsPage() {
  const router = useRouter();
  const notificationsQuery = useNotifications();
  const markReadMutation = useMarkNotificationRead();
  const unreadCount = useMemo(
    () => notificationsQuery.data?.filter((item) => !item.isRead).length ?? 0,
    [notificationsQuery.data]
  );

  async function markRead(notification: NotificationItem) {
    try {
      await markReadMutation.mutateAsync({
        id: notification.id,
        localOnly: notification.localOnly
      });
      toast.success("Notification marked as read");
    } catch (error) {
      toast.error("Unable to update notification", {
        description: error instanceof Error ? error.message : "Try again"
      });
    }
  }

  async function openNotification(notification: NotificationItem) {
    if (!notification.isRead) {
      await markRead(notification);
    }

    router.push(resolveNotificationHref(notification));
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Notifications</h1>
        <p className="text-sm text-muted-foreground">
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {unreadCount} unread of {notificationsQuery.data?.length ?? 0} total
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inbox</CardTitle>
          <CardDescription>
            {notificationsQuery.isFetching ? " • Syncing..." : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {notificationsQuery.isLoading ? (
            <>
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </>
          ) : notificationsQuery.data?.length ? (
            notificationsQuery.data.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "rounded-lg border border-border/70 bg-background p-4",
                  !notification.isRead && "border-primary/40 bg-primary/5"
                )}
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge variant={notification.isRead ? "outline" : "default"}>
                    {notification.type === "SURVEY" ? "Survey" : notification.type}
                  </Badge>
                  <Badge variant={notification.isRead ? "outline" : "secondary"}>
                    {notification.isRead ? "Read" : "Unread"}
                  </Badge>
                  {!notification.isRead ? (
                    <span
                      className="inline-flex h-2 w-2 rounded-full bg-primary"
                      aria-label="Unread notification"
                      title="Unread"
                    />
                  ) : null}
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.createdAt), {
                      addSuffix: true
                    })}
                  </span>
                </div>

                <p className="text-sm">{notification.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  from: {notification.actor || "system"}
                </p>

                {!notification.isRead ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={markReadMutation.isPending}
                      onClick={() => markRead(notification)}
                    >
                      Mark as read
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => openNotification(notification)}
                    >
                      Open
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => openNotification(notification)}
                  >
                    Open
                  </Button>
                )}
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-border/70 p-6 text-sm text-muted-foreground">
              No notifications yet.
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
