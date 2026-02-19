"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import {
  markLocalNotificationAsRead,
  normalizeServerNotification,
  mergeNotifications,
  readLocalSurveyNotifications
} from "@/lib/notifications";
import type { NotificationItem } from "@/types/api";

const NOTIFICATIONS_QUERY_KEY = ["notifications"] as const;

export function useNotifications() {
  return useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: async () => {
      const payload = await apiRequest<unknown>("/api/notifications");
      const serverNotifications = Array.isArray(payload)
        ? payload
            .map((item) => normalizeServerNotification(item))
            .filter((item): item is NotificationItem => item !== null)
        : [];
      const localNotifications = readLocalSurveyNotifications();
      return mergeNotifications(serverNotifications, localNotifications);
    },
    staleTime: 5000,
    refetchOnReconnect: true
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notification: number | Pick<NotificationItem, "id" | "localOnly">) => {
      const normalized =
        typeof notification === "number"
          ? { id: notification, localOnly: false }
          : notification;

      if (normalized.localOnly) {
        markLocalNotificationAsRead(normalized.id);
        return;
      }

      await apiRequest<void>(`/api/notifications/${normalized.id}`, {
        method: "PATCH"
      });
    },
    onSuccess: (_data, notification) => {
      const id = typeof notification === "number" ? notification : notification.id;
      queryClient.setQueryData<NotificationItem[]>(NOTIFICATIONS_QUERY_KEY, (current) => {
        if (!current) return current;
        return current.map((item) => (item.id === id ? { ...item, isRead: true } : item));
      });
      void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    }
  });
}
