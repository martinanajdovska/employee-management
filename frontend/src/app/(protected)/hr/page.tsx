"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { toast } from "sonner";
import { RoleGate } from "@/components/auth/RoleGate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { useEmployees } from "@/hooks/useEmployees";
import { useLeaves } from "@/hooks/useLeaves";
import { useLogHours } from "@/hooks/useProfile";

const months = [
  "JANUARY",
  "FEBRUARY",
  "MARCH",
  "APRIL",
  "MAY",
  "JUNE",
  "JULY",
  "AUGUST",
  "SEPTEMBER",
  "OCTOBER",
  "NOVEMBER",
  "DECEMBER"
];

export default function HrDashboardPage() {
  const employeesQuery = useEmployees();
  const leavesQuery = useLeaves("ROLE_ADMIN");
  const logHoursMutation = useLogHours();

  const [hoursUserId, setHoursUserId] = useState("");
  const [hoursMonth, setHoursMonth] = useState(format(new Date(), "MMMM").toUpperCase());
  const [hoursYear, setHoursYear] = useState(String(new Date().getFullYear()));
  const [hoursWorked, setHoursWorked] = useState("160");

  const pendingLeaves = leavesQuery.data?.filter((leave) => leave.status === "PENDING") ?? [];
  const upcomingLeaves =
    leavesQuery.data?.filter((leave) => new Date(leave.startDate) >= new Date()) ?? [];

  useEffect(() => {
    if (hoursUserId || !employeesQuery.data?.length) return;
    setHoursUserId(String(employeesQuery.data[0].id));
  }, [employeesQuery.data, hoursUserId]);

  async function handleLogHours(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const userId = Number(hoursUserId);
    const year = Number(hoursYear);
    const hours = Number(hoursWorked);

    if (!Number.isFinite(userId)) {
      toast.error("Select an employee first");
      return;
    }

    if (!Number.isFinite(year)) {
      toast.error("Year must be a valid number");
      return;
    }

    if (!Number.isFinite(hours) || hours < 0) {
      toast.error("Hours must be a valid number");
      return;
    }

    try {
      await logHoursMutation.mutateAsync({
        userId,
        month: hoursMonth,
        year,
        hoursWorked: hours
      });
      toast.success("Hours saved");
    } catch (error) {
      toast.error("Unable to save hours", {
        description: error instanceof Error ? error.message : "Try again"
      });
    }
  }

  return (
    <RoleGate allow={["ROLE_ADMIN"]} fallbackPath="/dashboard">
      <section className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">HR Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Organization overview for staffing, leave requests, and approvals.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardDescription>Total employees</CardDescription>
              <CardTitle className="text-3xl">{employeesQuery.data?.length ?? 0}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Pending leave requests</CardDescription>
              <CardTitle className="text-3xl">{pendingLeaves.length}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Upcoming leaves</CardDescription>
              <CardTitle className="text-3xl">{upcomingLeaves.length}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Add Working Hours</CardTitle>
            <CardDescription>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-3 md:grid-cols-5" onSubmit={handleLogHours}>
              <div className="space-y-1 md:col-span-2">
                <Label>Employee</Label>
                <Select value={hoursUserId} onValueChange={setHoursUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employeesQuery.data?.map((employee) => (
                      <SelectItem key={employee.id} value={String(employee.id)}>
                        {employee.firstName} {employee.lastName} ({employee.username})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Month</Label>
                <Select value={hoursMonth} onValueChange={setHoursMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month} value={month}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Year</Label>
                <Input
                  type="number"
                  value={hoursYear}
                  onChange={(event) => setHoursYear(event.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label>Hours</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  value={hoursWorked}
                  onChange={(event) => setHoursWorked(event.target.value)}
                  required
                />
              </div>

              <div className="md:col-span-5">
                <Button type="submit" disabled={logHoursMutation.isPending}>
                  {logHoursMutation.isPending ? "Saving..." : "Save hours"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending requests</CardTitle>
            <CardDescription>Review and act.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Range</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingLeaves.length ? (
                  pendingLeaves.slice(0, 8).map((leave) => (
                    <TableRow key={leave.id}>
                      <TableCell>{leave.user?.username || "Unknown"}</TableCell>
                      <TableCell>
                        {format(new Date(leave.startDate), "PP")} - {" "}
                        {format(new Date(leave.endDate), "PP")}
                      </TableCell>
                      <TableCell>{leave.reason}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-muted-foreground">
                      No pending leave requests.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <Button variant="outline" asChild>
              <Link href="/hr/leaves">Open leave management</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </RoleGate>
  );
}
