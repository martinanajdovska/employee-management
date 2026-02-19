"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useLogout } from "@/hooks/useAuth";

export default function LogoutPage() {
  const router = useRouter();
  const logoutMutation = useLogout();
  const toastId = "logout-success";
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    (async () => {
      try {
        await logoutMutation.mutateAsync();
      } finally {
        toast.success("You have been logged out.", { id: toastId });
        router.replace("/login");
      }
    })();
  }, [logoutMutation, router]);

  return <p className="text-sm text-muted-foreground">Signing you out...</p>;
}
