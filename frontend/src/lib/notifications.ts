"use client";

import { STORAGE_KEYS } from "@/lib/constants";
import type { NotificationItem, Survey } from "@/types/api";

const LOCAL_SURVEY_NOTIFICATIONS_KEY_PREFIX = "ems_local_survey_notifications";
export const SURVEY_ASSIGNMENT_SIGNAL_KEY = "ems_survey_assignment_signal";

type SurveyNotificationSource = Pick<Survey, "id" | "question" | "createdAt" | "response"> & {
  admin?: { username?: string };
};

function normalizeNotificationType(
  value: unknown,
  message: string,
  link: string
): NotificationItem["type"] {
  const upper = typeof value === "string" ? value.toUpperCase() : "";
  if (upper === "REQUEST" || upper === "APPROVE" || upper === "DENY" || upper === "SURVEY") {
    return upper;
  }
  if (/survey|anketa/i.test(message) || /\/surveys\/\d+/.test(link)) {
    return "SURVEY";
  }
  return "REQUEST";
}

function getActiveUsername() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEYS.username);
}

function getLocalStorageKey(username: string) {
  return `${LOCAL_SURVEY_NOTIFICATIONS_KEY_PREFIX}:${username}`;
}

function toTimestamp(value: string) {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function normalizeLocalNotification(item: NotificationItem): NotificationItem {
  return {
    ...item,
    id: Number(item.id),
    recipient: String(item.recipient ?? ""),
    actor: String(item.actor ?? ""),
    message: String(item.message ?? ""),
    link: String(item.link ?? ""),
    type: "SURVEY",
    localOnly: true,
    isRead: Boolean(item.isRead),
    surveyId: item.surveyId ?? extractSurveyIdFromNotification(item) ?? undefined
  };
}

export function normalizeServerNotification(item: unknown): NotificationItem | null {
  if (!item || typeof item !== "object") return null;
  const raw = item as Partial<NotificationItem> & { read?: boolean };

  const id = Number(raw.id);
  if (!Number.isFinite(id)) return null;

  const message = String(raw.message ?? "");
  const link = String(raw.link ?? "");

  return {
    id,
    recipient: String(raw.recipient ?? ""),
    actor: String(raw.actor ?? ""),
    message,
    link,
    isRead: Boolean(raw.isRead ?? raw.read ?? false),
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    type: normalizeNotificationType(raw.type, message, link),
    localOnly: Boolean(raw.localOnly),
    surveyId: typeof raw.surveyId === "number" ? raw.surveyId : undefined
  };
}

export function isSurveyNotification(
  notification: Pick<NotificationItem, "type" | "message" | "link">
) {
  return (
    notification.type === "SURVEY" ||
    /survey|anketa/i.test(notification.message || "") ||
    /\/surveys\/\d+/.test(notification.link || "")
  );
}

export function extractSurveyIdFromNotification(
  notification: Pick<NotificationItem, "link" | "message"> & Partial<NotificationItem>
) {
  if (typeof notification.surveyId === "number") {
    return notification.surveyId;
  }

  const linkMatch = notification.link?.match(/\/surveys\/(\d+)/);
  if (linkMatch?.[1]) {
    return Number(linkMatch[1]);
  }

  const messageMatch = notification.message?.match(/survey\s+#?(\d+)/i);
  if (messageMatch?.[1]) {
    return Number(messageMatch[1]);
  }

  return null;
}

export function resolveNotificationHref(notification: NotificationItem) {
  if (notification.link?.startsWith("/hr/")) {
    return notification.link;
  }

  if (isSurveyNotification(notification)) {
    const surveyId = extractSurveyIdFromNotification(notification);
    return surveyId ? `/surveys/${surveyId}` : "/surveys";
  }

  if (notification.link === "/my-requests") {
    return "/leave/request";
  }

  if (notification.link?.startsWith("/")) {
    return notification.link;
  }

  return "/notifications";
}

export function readLocalSurveyNotifications(username?: string) {
  if (typeof window === "undefined") return [] as NotificationItem[];

  const targetUsername = username ?? getActiveUsername();
  if (!targetUsername) return [] as NotificationItem[];

  try {
    const raw = localStorage.getItem(getLocalStorageKey(targetUsername));
    if (!raw) return [] as NotificationItem[];

    const parsed = JSON.parse(raw) as NotificationItem[];
    if (!Array.isArray(parsed)) return [] as NotificationItem[];

    return parsed
      .map(normalizeLocalNotification)
      .sort((a, b) => toTimestamp(b.createdAt) - toTimestamp(a.createdAt));
  } catch {
    return [] as NotificationItem[];
  }
}

function writeLocalSurveyNotifications(username: string, notifications: NotificationItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(getLocalStorageKey(username), JSON.stringify(notifications));
}

export function upsertSurveyFallbackNotification(
  survey: SurveyNotificationSource,
  username?: string
): NotificationItem | null {
  const targetUsername = username ?? getActiveUsername();
  if (!targetUsername) return null;

  const existing = readLocalSurveyNotifications(targetUsername);
  const existingIndex = existing.findIndex(
    (item) =>
      (typeof item.surveyId === "number" && item.surveyId === survey.id) ||
      extractSurveyIdFromNotification(item) === survey.id
  );

  if (existingIndex >= 0) {
    const current = existing[existingIndex];
    const next = [...existing];
    next[existingIndex] = {
      ...current,
      actor: survey.admin?.username || current.actor || "HR",
      message: `New survey assigned: ${survey.question}`,
      link: `/surveys/${survey.id}`,
      surveyId: survey.id,
      createdAt: survey.createdAt || current.createdAt,
      isRead: survey.response ? true : current.isRead
    };
    writeLocalSurveyNotifications(targetUsername, next);
    return null;
  }

  if (survey.response) {
    return null;
  }

  const localNotification: NotificationItem = {
    id: Date.now() * 1000 + Math.floor(Math.random() * 1000),
    recipient: targetUsername,
    actor: survey.admin?.username || "HR",
    message: `New survey assigned: ${survey.question}`,
    link: `/surveys/${survey.id}`,
    isRead: false,
    createdAt: survey.createdAt || new Date().toISOString(),
    type: "SURVEY",
    localOnly: true,
    surveyId: survey.id
  };

  const next = [localNotification, ...existing].sort(
    (a, b) => toTimestamp(b.createdAt) - toTimestamp(a.createdAt)
  );
  writeLocalSurveyNotifications(targetUsername, next);
  return localNotification;
}

export function markLocalNotificationAsRead(id: number, username?: string) {
  const targetUsername = username ?? getActiveUsername();
  if (!targetUsername) return false;

  const existing = readLocalSurveyNotifications(targetUsername);
  const itemIndex = existing.findIndex((item) => item.id === id);
  if (itemIndex < 0) return false;

  if (!existing[itemIndex].isRead) {
    const next = [...existing];
    next[itemIndex] = { ...next[itemIndex], isRead: true };
    writeLocalSurveyNotifications(targetUsername, next);
  }

  return true;
}

export function mergeNotifications(
  serverNotifications: NotificationItem[],
  localNotifications: NotificationItem[]
) {
  const serverSurveyIds = new Set(
    serverNotifications
      .map((item) => extractSurveyIdFromNotification(item))
      .filter((id): id is number => typeof id === "number")
  );

  const filteredLocal = localNotifications.filter((item) => {
    const surveyId = extractSurveyIdFromNotification(item);
    if (typeof surveyId !== "number") return true;
    return !serverSurveyIds.has(surveyId);
  });

  return [...serverNotifications, ...filteredLocal].sort(
    (a, b) => toTimestamp(b.createdAt) - toTimestamp(a.createdAt)
  );
}

export function publishSurveyAssignmentSignal(payload: {
  surveyId: number;
  employeeId: number;
  question: string;
  createdAt: string;
  adminUsername?: string;
}) {
  if (typeof window === "undefined") return;

  localStorage.setItem(
    SURVEY_ASSIGNMENT_SIGNAL_KEY,
    JSON.stringify({
      ...payload,
      emittedAt: Date.now()
    })
  );
}

export function parseSurveyAssignmentSignal(raw: string | null) {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as {
      surveyId: number;
      employeeId: number;
      question: string;
      createdAt: string;
      adminUsername?: string;
    };

    if (
      !parsed ||
      typeof parsed.surveyId !== "number" ||
      typeof parsed.employeeId !== "number" ||
      typeof parsed.question !== "string"
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}
