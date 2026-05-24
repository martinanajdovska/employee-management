const rawBaseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:8080";

export const BASE_URL = rawBaseUrl.endsWith("/")
  ? rawBaseUrl.slice(0, -1)
  : rawBaseUrl;

export const STORAGE_KEYS = {
  username: "ems_username"
} as const;
``