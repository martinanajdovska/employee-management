import { BASE_URL, STORAGE_KEYS } from "@/lib/constants";

export interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  query?: Record<string, string | number | boolean | null | undefined>;
  suppressAuthRedirect?: boolean;
}

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, data: unknown, fallbackMessage = "Request failed") {
    const message =
      typeof data === "string"
        ? data
        : typeof data === "object" && data !== null && "message" in data
          ? String((data as { message?: unknown }).message)
          : fallbackMessage;

    super(message);
    this.status = status;
    this.data = data;
  }
}

function toQueryString(query?: ApiRequestOptions["query"]) {
  if (!query) return "";

  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    params.append(key, String(value));
  });

  const encoded = params.toString();
  return encoded ? `?${encoded}` : "";
}

function handleAuthRedirect(status: number) {
  if (typeof window === "undefined") return;

  if (status === 401) {
    localStorage.removeItem(STORAGE_KEYS.username);
    if (window.location.pathname !== "/login") {
      window.location.replace("/login");
    }
  }

  if (status === 403 && window.location.pathname !== "/forbidden") {
    window.location.replace("/forbidden");
  }
}

export async function apiRequest<T>(
  path: string,
  { body, query, headers, suppressAuthRedirect = false, ...init }: ApiRequestOptions = {}
): Promise<T> {
  const url = `${BASE_URL}${path}${toQueryString(query)}`;

  const requestHeaders = new Headers(headers);
  if (!(body instanceof FormData) && body !== undefined && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...init,
    headers: requestHeaders,
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body),
    credentials: "include"
  });

  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();
  let parsed: unknown = null;

  if (text.length > 0 && contentType.includes("application/json")) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  } else {
    parsed = text.length > 0 ? text : null;
  }

  if (!response.ok) {
    if (!suppressAuthRedirect) {
      handleAuthRedirect(response.status);
    }
    throw new ApiError(response.status, parsed);
  }

  return parsed as T;
}
