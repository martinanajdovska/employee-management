"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMe } from "@/hooks/useAuth";
import type { Role } from "@/types/api";

export function RoleGate({
  allow,
  fallbackPath,
  children
}: {
  allow: Role[];
  fallbackPath: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const meQuery = useMe();

  useEffect(() => {
    if (!meQuery.data) return;
    if (!allow.includes(meQuery.data.role)) {
      router.replace(fallbackPath);
    }
  }, [allow, fallbackPath, meQuery.data, router]);

  if (!meQuery.data) return null;
  if (!allow.includes(meQuery.data.role)) return null;

  return <>{children}</>;
}
