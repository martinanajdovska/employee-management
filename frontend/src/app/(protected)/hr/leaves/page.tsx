"use client";

import { format } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import { RoleGate } from "@/components/auth/RoleGate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useDeleteLeave, useLeaves, useUpdateLeaveStatus } from "@/hooks/useLeaves";

export default function HrLeavesPage() {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const leavesQuery = useLeaves("ROLE_ADMIN", {
    status: statusFilter === "ALL" ? undefined : statusFilter
  });

  const updateStatusMutation = useUpdateLeaveStatus();
  const deleteLeaveMutation = useDeleteLeave();

  async function updateStatus(id: number, status: "APPROVED" | "REJECTED") {
    try {
      await updateStatusMutation.mutateAsync({ id, status });
      toast.success(`Leave ${status.toLowerCase()}`);
    } catch (error) {
      toast.error("Unable to update leave", {
        description: error instanceof Error ? error.message : "Try again"
      });
    }
  }

  async function removeLeave(id: number) {
    if (!confirm("Delete this leave request?")) return;

    try {
      await deleteLeaveMutation.mutateAsync(id);
      toast.success("Leave request deleted");
    } catch (error) {
      toast.error("Unable to delete leave", {
        description: error instanceof Error ? error.message : "Try again"
      });
    }
  }

  return (
    <RoleGate allow={["ROLE_ADMIN"]} fallbackPath="/dashboard">
      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl font-bold">Leave Requests</h1>
            <p className="text-sm text-muted-foreground">
              Approve/reject/delete requests.
            </p>
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Queue</CardTitle>
            <CardDescription>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leavesQuery.data?.length ? (
                  leavesQuery.data.map((leave) => (
                    <TableRow key={leave.id}>
                      <TableCell>{leave.user?.username || "Unknown"}</TableCell>
                      <TableCell>{format(new Date(leave.startDate), "PP")}</TableCell>
                      <TableCell>{format(new Date(leave.endDate), "PP")}</TableCell>
                      <TableCell>{leave.reason}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            leave.status === "APPROVED"
                              ? "secondary"
                              : leave.status === "REJECTED"
                                ? "destructive"
                                : "default"
                          }
                        >
                          {leave.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="flex flex-wrap gap-2">
                        {leave.status === "PENDING" ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() => updateStatus(leave.id, "APPROVED")}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateStatus(leave.id, "REJECTED")}
                            >
                              Reject
                            </Button>
                          </>
                        ) : null}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeLeave(leave.id)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-muted-foreground">
                      No leave requests found.
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
