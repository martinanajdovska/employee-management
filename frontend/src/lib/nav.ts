import type { Role } from "@/types/api";

export const ROLE_LABEL: Record<Role, "EMPLOYEE" | "HR"> = {
  ROLE_USER: "EMPLOYEE",
  ROLE_ADMIN: "HR"
};

export const DEFAULT_ROUTE_BY_ROLE: Record<Role, string> = {
  ROLE_USER: "/dashboard",
  ROLE_ADMIN: "/hr"
};

export const PUBLIC_ROUTES = ["/login", "/register", "/forbidden"];
