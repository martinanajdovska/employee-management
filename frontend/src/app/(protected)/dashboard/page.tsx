"use client";

import Link from "next/link";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RoleGate } from "@/components/auth/RoleGate";
import { useMe } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { useProfileData, usePayrollByMonth } from "@/hooks/useProfile";

export default function EmployeeDashboardPage() {
  const meQuery = useMe();
  const notificationsQuery = useNotifications();

  const currentMonth = format(new Date(), "MMMM").toUpperCase();
  const profileQuery = useProfileData(meQuery.data?.id);
  const payrollQuery = usePayrollByMonth(meQuery.data?.id, currentMonth);

  const approvedThisMonth =
    notificationsQuery.data?.filter(
      (n) => n.type === "APPROVE" && new Date(n.createdAt).getMonth() === new Date().getMonth()
    ).length ?? 0;

  const deniedThisMonth =
    notificationsQuery.data?.filter(
      (n) => n.type === "DENY" && new Date(n.createdAt).getMonth() === new Date().getMonth()
    ).length ?? 0;

  return (
    <RoleGate allow={["ROLE_USER"]} fallbackPath="/hr">
      <section className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Employee Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Snapshot of your monthly updates, payroll, and alerts.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {/*<Card>*/}
          {/*  <CardHeader>*/}
          {/*    <CardDescription>Pending leave requests</CardDescription>*/}
          {/*    <CardTitle className="text-3xl">N/A</CardTitle>*/}
          {/*  </CardHeader>*/}
          {/*  <CardContent className="text-xs text-muted-foreground">*/}
          {/*    Backend currently has no "my leave requests" list endpoint.*/}
          {/*  </CardContent>*/}
          {/*</Card>*/}

          <Card>
            <CardHeader>
              <CardDescription>Approved leave updates ({format(new Date(), "MMM")})</CardDescription>
              <CardTitle className="text-3xl">{approvedThisMonth}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Worked hours ({currentMonth})</CardDescription>
              <CardTitle className="text-3xl">
                {payrollQuery.data?.hoursWorked?.toFixed(1) ?? "0.0"}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Salary payout ({currentMonth})</CardDescription>
              <CardTitle className="text-3xl">
                ${Number(payrollQuery.data?.totalPayout ?? 0).toFixed(2)}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent notifications</CardTitle>
              <CardDescription>Live updates from requests and approvals.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {notificationsQuery.isLoading ? (
                <Skeleton className="h-28 w-full" />
              ) : notificationsQuery.data?.length ? (
                notificationsQuery.data.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-border/60 bg-background p-3"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <Badge variant={item.isRead ? "outline" : "default"}>
                        {item.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(item.createdAt), "PPp")}
                      </span>
                    </div>
                    <p className="text-sm">{item.message}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No notifications yet.</p>
              )}

              <Button variant="outline" asChild>
                <Link href="/notifications">Open notifications</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Profile summary</CardTitle>
              <CardDescription>Department and base salary details.</CardDescription>
            </CardHeader>
            <CardContent>
              {profileQuery.isLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-semibold">Full name:</span> {profileQuery.data?.fullName}
                  </p>
                  <p>
                    <span className="font-semibold">Department:</span>{" "}
                    {profileQuery.data?.department || "N/A"}
                  </p>
                  <p>
                    <span className="font-semibold">Monthly salary:</span> $
                    {Number(profileQuery.data?.monthlySalary ?? 0).toFixed(2)}
                  </p>
                </div>
              )}

              <Button variant="outline" className="mt-4" asChild>
                <Link href="/profile">View full profile</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </RoleGate>
  );
}
