"use client";

import { AuthGate } from "@/components/auth/AuthGate";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { TopBar } from "@/components/layout/TopBar";
import { NotificationListener } from "@/components/NotificationListener";
import { useMe } from "@/hooks/useAuth";

function ProtectedLayoutContent({ children }: { children: React.ReactNode }) {
  const meQuery = useMe();

  if (!meQuery.data) return null;

  return (
    <div className="min-h-screen md:flex">
      <AppSidebar role={meQuery.data.role} />
      <div className="flex min-h-screen flex-1 flex-col">
        <TopBar me={meQuery.data} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
      <NotificationListener active={Boolean(meQuery.data)} user={meQuery.data} />
    </div>
  );
}

export default function ProtectedLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGate>
      <ProtectedLayoutContent>{children}</ProtectedLayoutContent>
    </AuthGate>
  );
}
