"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { RoleGate } from "@/components/auth/RoleGate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { useEmployee } from "@/hooks/useEmployees";
import { useLogHours, useProfileData, useSalarySlips } from "@/hooks/useProfile";

export default function HrEmployeeDetailsPage() {
  const params = useParams<{ id: string }>();
  const userId = Number(params.id);

  const employeeQuery = useEmployee(userId);
  const profileQuery = useProfileData(userId);
  const slipsQuery = useSalarySlips(userId);
  const logHoursMutation = useLogHours();

  const [hoursWorked, setHoursWorked] = useState("160");
  const [month, setMonth] = useState("JANUARY");
  const [year, setYear] = useState(String(new Date().getFullYear()));

  async function saveHours(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await logHoursMutation.mutateAsync({
        userId,
        month,
        year: Number(year),
        hoursWorked: Number(hoursWorked)
      });
      toast.success("Hours updated");
    } catch (error) {
      toast.error("Unable to log hours", {
        description: error instanceof Error ? error.message : "Try again"
      });
    }
  }

  return (
    <RoleGate allow={["ROLE_ADMIN"]} fallbackPath="/dashboard">
      <section className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Employee Details</h1>
          <p className="text-sm text-muted-foreground">ID: {userId}</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Identity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <span className="font-semibold">Name:</span> {employeeQuery.data?.firstName} {" "}
                {employeeQuery.data?.lastName}
              </p>
              <p>
                <span className="font-semibold">Username:</span> {employeeQuery.data?.username}
              </p>
              <p>
                <span className="font-semibold">Email:</span> {employeeQuery.data?.email}
              </p>
              <p>
                <span className="font-semibold">Department:</span>{" "}
                {profileQuery.data?.department || employeeQuery.data?.department || "N/A"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Log hours</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-3" onSubmit={saveHours}>
                <div className="space-y-1">
                  <Label>Month</Label>
                  <Input value={month} onChange={(event) => setMonth(event.target.value)} required />
                </div>
                <div className="space-y-1">
                  <Label>Year</Label>
                  <Input value={year} onChange={(event) => setYear(event.target.value)} required />
                </div>
                <div className="space-y-1">
                  <Label>Hours</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={hoursWorked}
                    onChange={(event) => setHoursWorked(event.target.value)}
                    required
                  />
                </div>

                <Button className="w-full" disabled={logHoursMutation.isPending}>
                  {logHoursMutation.isPending ? "Saving..." : "Save"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Salary slips</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Payout</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slipsQuery.data?.length ? (
                  slipsQuery.data.map((slip) => (
                    <TableRow key={`${slip.month}-${slip.year}`}>
                      <TableCell>{slip.month}</TableCell>
                      <TableCell>{slip.year}</TableCell>
                      <TableCell>{slip.hoursWorked}</TableCell>
                      <TableCell>${Number(slip.totalPayout).toFixed(2)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground">
                      No salary slips available.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    </RoleGate>
  );
}
