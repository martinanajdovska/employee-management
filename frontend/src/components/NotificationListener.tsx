"use client";

import { Client, type StompSubscription } from "@stomp/stompjs";
import { useEffect } from "react";
import SockJS from "sockjs-client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api";
import { BASE_URL } from "@/lib/constants";
import {
  isSurveyNotification,
  mergeNotifications,
  normalizeServerNotification,
  parseSurveyAssignmentSignal,
  readLocalSurveyNotifications,
  SURVEY_ASSIGNMENT_SIGNAL_KEY,
  upsertSurveyFallbackNotification
} from "@/lib/notifications";
import type { NotificationItem, Survey, User } from "@/types/api";

const NOTIFICATIONS_QUERY_KEY = ["notifications"] as const;
const NOTIFICATIONS_SUBSCRIPTION_PATH = "/user/queue/notifications";
const SURVEYS_QUERY_KEY = ["surveys", "mine"] as const;
const FALLBACK_NOTIFICATION_POLL_INTERVAL_MS = 15_000;
const FALLBACK_SURVEY_SYNC_INTERVAL_MS = 12_000;

function parseNotificationPayload(body: string): NotificationItem | null {
  if (!body) return null;

  try {
    return normalizeServerNotification(JSON.parse(body));
  } catch {
    return null;
  }
}

export function NotificationListener({ active, user }: { active: boolean; user: User | null }) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!active || !user) return;

    const isDev = process.env.NODE_ENV !== "production";
    const isEmployee = user.role === "ROLE_USER";
    let subscription: StompSubscription | null = null;
    let socketConnected = false;
    const seenNotificationIds = new Set<number>();

    const toastNotification = (
      payload: Pick<NotificationItem, "message" | "actor" | "type" | "link">
    ) => {
      if (isSurveyNotification(payload as NotificationItem)) {
        toast.info("New Survey Assigned", {
          description: payload.message || "A new survey has been assigned to you."
        });
        return;
      }

      toast.info(payload.message || "New notification received", {
        description: payload.actor ? `From: ${payload.actor}` : undefined
      });
    };

    const fetchMergedNotifications = async () => {
      const payload = await apiRequest<unknown>("/api/notifications");
      const serverNotifications = Array.isArray(payload)
        ? payload
            .map((item) => normalizeServerNotification(item))
            .filter((item): item is NotificationItem => item !== null)
        : [];
      const localNotifications = readLocalSurveyNotifications(user.username);
      return mergeNotifications(serverNotifications, localNotifications);
    };

    const pullNotifications = async (showToastsForNew: boolean) => {
      const items = await queryClient.fetchQuery({
        queryKey: NOTIFICATIONS_QUERY_KEY,
        queryFn: fetchMergedNotifications
      });
      let hasSurveyUpdates = false;

      items.forEach((item) => {
        const isNew = !seenNotificationIds.has(item.id);
        seenNotificationIds.add(item.id);

        if (isNew && isSurveyNotification(item)) {
          hasSurveyUpdates = true;
        }

        if (showToastsForNew && isNew) {
          toastNotification(item);
        }
      });

      if (hasSurveyUpdates) {
        void queryClient.invalidateQueries({ queryKey: ["surveys"] });
      }
    };

    const syncSurveyFallbackNotifications = async (showToastsForNew: boolean) => {
      if (!isEmployee) return;

      const surveys = await queryClient.fetchQuery({
        queryKey: SURVEYS_QUERY_KEY,
        queryFn: () => apiRequest<Survey[]>("/api/surveys/my-surveys")
      });

      let hasNewLocalNotifications = false;
      surveys.forEach((survey) => {
        const created = upsertSurveyFallbackNotification(survey, user.username);
        if (!created) return;

        hasNewLocalNotifications = true;
        seenNotificationIds.add(created.id);

        if (showToastsForNew) {
          toastNotification(created);
        }
      });

      if (!hasNewLocalNotifications) return;

      const merged = await fetchMergedNotifications();
      queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, merged);
      void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    };

    const handleSurveySignal = (
      signal: { surveyId: number; employeeId: number; question: string; createdAt: string; adminUsername?: string } | null,
      showToast: boolean
    ) => {
      if (!isEmployee || !signal || signal.employeeId !== user.id) return;

      const created = upsertSurveyFallbackNotification(
        {
          id: signal.surveyId,
          question: signal.question,
          createdAt: signal.createdAt,
          response: null,
          admin: signal.adminUsername ? { username: signal.adminUsername } : undefined
        },
        user.username
      );

      if (!created) return;

      seenNotificationIds.add(created.id);
      const existing = queryClient.getQueryData<NotificationItem[]>(NOTIFICATIONS_QUERY_KEY) ?? [];
      queryClient.setQueryData(
        NOTIFICATIONS_QUERY_KEY,
        mergeNotifications(
          existing.filter((item) => !item.localOnly),
          readLocalSurveyNotifications(user.username)
        )
      );
      void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });

      if (showToast) {
        toastNotification(created);
      }
    };

    const client = new Client({
      reconnectDelay: 5000,
      webSocketFactory: () => new SockJS(`${BASE_URL}/ws`),
      debug: isDev ? (message) => console.debug(`[notifications:stomp] ${message}`) : undefined,
      onConnect: () => {
        socketConnected = true;

        if (isDev) {
          console.info("[notifications] connected");
        }

        subscription = client.subscribe(NOTIFICATIONS_SUBSCRIPTION_PATH, (message) => {
          const payload = parseNotificationPayload(message.body);
          if (payload) {
            const isNew = !seenNotificationIds.has(payload.id);
            seenNotificationIds.add(payload.id);
            if (isNew) {
              toastNotification(payload);
            }
          } else {
            toast.info("New notification received");
          }

          if (payload && isSurveyNotification(payload)) {
            void queryClient.invalidateQueries({ queryKey: ["surveys"] });
          }

          if (payload) {
            queryClient.setQueryData<NotificationItem[]>(NOTIFICATIONS_QUERY_KEY, (current) => {
              const list = current ?? [];
              const existing = list.findIndex((item) => item.id === payload.id);

              if (existing >= 0) {
                const next = [...list];
                next[existing] = { ...next[existing], ...payload };
                return next;
              }

              return [payload, ...list];
            });
          }

          void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
        });
      },
      onDisconnect: () => {
        socketConnected = false;

        if (isDev) {
          console.info("[notifications] disconnected");
        }
      },
      onWebSocketClose: (event) => {
        socketConnected = false;

        if (isDev) {
          console.warn("[notifications] websocket closed", {
            code: event.code,
            reason: event.reason
          });
        }
      },
      onWebSocketError: (event) => {
        if (isDev) {
          console.error("[notifications] websocket error", event);
        }
      },
      onStompError: (frame) => {
        socketConnected = false;

        toast.error("Notification channel error", {
          description: frame.headers.message
        });

        if (isDev) {
          console.error("[notifications] STOMP error", frame.headers, frame.body);
        }
      }
    });

    void pullNotifications(false).catch((error) => {
      if (isDev) {
        console.warn("[notifications] initial sync failed", error);
      }
    });

    void syncSurveyFallbackNotifications(false).catch((error) => {
      if (isDev) {
        console.warn("[notifications] initial survey sync failed", error);
      }
    });

    const fallbackPollTimer = window.setInterval(() => {
      if (socketConnected) return;

      void pullNotifications(true).catch((error) => {
        if (isDev) {
          console.warn("[notifications] fallback polling failed", error);
        }
      });
    }, FALLBACK_NOTIFICATION_POLL_INTERVAL_MS);

    const surveySyncTimer = window.setInterval(() => {
      void syncSurveyFallbackNotifications(true).catch((error) => {
        if (isDev) {
          console.warn("[notifications] fallback survey sync failed", error);
        }
      });
    }, FALLBACK_SURVEY_SYNC_INTERVAL_MS);

    const onStorage = (event: StorageEvent) => {
      if (event.key !== SURVEY_ASSIGNMENT_SIGNAL_KEY) return;
      handleSurveySignal(parseSurveyAssignmentSignal(event.newValue), true);
    };
    window.addEventListener("storage", onStorage);

    client.activate();

    return () => {
      window.clearInterval(fallbackPollTimer);
      window.clearInterval(surveySyncTimer);
      window.removeEventListener("storage", onStorage);
      subscription?.unsubscribe();
      subscription = null;
      void client.deactivate();
    };
  }, [active, queryClient, user]);

  return null;
}
