"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useMe } from "@/hooks/useAuth";
import { useLogHours, useProfileData, useSalarySlips } from "@/hooks/useProfile";

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

export default function ProfilePage() {
  const meQuery = useMe();

  const profileQuery = useProfileData(meQuery.data?.id);
  const slipsQuery = useSalarySlips(meQuery.data?.id);
  const logHoursMutation = useLogHours();

  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "MMMM").toUpperCase());
  const [hoursWorked, setHoursWorked] = useState("160");
  const [year, setYear] = useState(String(new Date().getFullYear()));

  const selectedSlip = useMemo(
    () =>
      slipsQuery.data?.find(
        (slip) => slip.month === selectedMonth && String(slip.year) === year
      ) ?? null,
    [selectedMonth, slipsQuery.data, year]
  );

  async function handleLogHours(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!meQuery.data) return;

    try {
      await logHoursMutation.mutateAsync({
        userId: meQuery.data.id,
        month: selectedMonth,
        year: Number(year),
        hoursWorked: Number(hoursWorked)
      });
      toast.success("Hours saved successfully");
    } catch (error) {
      toast.error("Unable to save hours", {
        description: error instanceof Error ? error.message : "Try again"
      });
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">My Profile</h1>
        <p className="text-sm text-muted-foreground">
          Track your monthly work logs and salary payouts.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Profile details</CardTitle>
          </CardHeader>
          <CardContent>
            {profileQuery.isLoading ? (
              <Skeleton className="h-28 w-full" />
            ) : (
              <div className="grid gap-2 text-sm md:grid-cols-2">
                <p>
                  <span className="font-semibold">Name:</span> {profileQuery.data?.fullName}
                </p>
                <p>
                  <span className="font-semibold">Department:</span>{" "}
                  {profileQuery.data?.department || "N/A"}
                </p>
                <p>
                  <span className="font-semibold">Monthly Salary:</span> $
                  {Number(profileQuery.data?.monthlySalary ?? 0).toFixed(2)}
                </p>
                <p>
                  <span className="font-semibold">Role:</span> {meQuery.data?.role}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Month summary</CardTitle>
            <CardDescription>Worked hours + payout by month.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="space-y-2">
              <Label>Month</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Select month" />
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

            <div className="space-y-2">
              <Label>Year</Label>
              <Input value={year} onChange={(event) => setYear(event.target.value)} />
            </div>

            <div className="rounded-lg border border-border/70 p-3">
              <p>
                <span className="font-semibold">Hours:</span>{" "}
                {selectedSlip?.hoursWorked?.toFixed(1) ?? "0.0"}
              </p>
              <p>
                <span className="font-semibold">Payout:</span> $
                {Number(selectedSlip?.totalPayout ?? 0).toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
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
                      <TableCell>{slip.hoursWorked.toFixed(1)}</TableCell>
                      <TableCell>${Number(slip.totalPayout).toFixed(2)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground">
                      No slips available yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Log work hours</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={handleLogHours}>
              <div className="space-y-2">
                <Label htmlFor="hoursWorked">Hours worked</Label>
                <Input
                  id="hoursWorked"
                  type="number"
                  min="0"
                  step="0.1"
                  value={hoursWorked}
                  onChange={(event) => setHoursWorked(event.target.value)}
                  required
                />
              </div>

              <Button className="w-full" disabled={logHoursMutation.isPending}>
                {logHoursMutation.isPending ? "Saving..." : "Save hours"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
