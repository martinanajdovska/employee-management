"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { useMe } from "@/hooks/useAuth";
import { ApiError } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const meQuery = useMe();

  useEffect(() => {
    if (!meQuery.error) return;

    const status = meQuery.error instanceof ApiError ? meQuery.error.status : 500;
    if (status === 401) {
      router.replace("/login");
    } else if (status === 403) {
      router.replace("/forbidden");
    }
  }, [meQuery.error, router]);

  if (meQuery.isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (meQuery.error) {
    const status = meQuery.error instanceof ApiError ? meQuery.error.status : 500;
    if (status === 401 || status === 403) {
      return null;
    }

    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Unable to load your session
            </CardTitle>
          </CardHeader>
          <CardContent>Please log in again.</CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
