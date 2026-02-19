import { apiRequest, ApiError } from "@/lib/api";
import { STORAGE_KEYS } from "@/lib/constants";
import type { SignInPayload, SignUpPayload, User } from "@/types/api";

export function persistUsername(username: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.username, username);
}

export function readPersistedUsername() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEYS.username);
}

export function clearPersistedAuthIdentity() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.username);
}

export async function register(payload: SignUpPayload) {
  return apiRequest<string>("/api/auth/register", {
    method: "POST",
    body: payload,
    suppressAuthRedirect: true
  });
}

export async function login(payload: SignInPayload) {
  return apiRequest<string>("/api/auth/login", {
    method: "POST",
    body: payload,
    suppressAuthRedirect: true
  });
}

export async function logout() {
  const result = await apiRequest<string>("/api/auth/logout", {
    method: "POST",
    suppressAuthRedirect: true
  }).catch(() => "Logged out");

  clearPersistedAuthIdentity();
  return result;
}

export async function getMe() {
  const username = readPersistedUsername();
  if (!username) {
    throw new ApiError(401, "Please log in again.");
  }

  const users = await apiRequest<User[]>("/api/users");
  const me = users.find((user) => user.username === username);

  if (!me) {
    throw new ApiError(401, "Session user not found. Please log in again.");
  }

  return me;
}
