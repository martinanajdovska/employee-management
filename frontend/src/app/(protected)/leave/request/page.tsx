"use client";

import { useState } from "react";
import { toast } from "sonner";
import { RoleGate } from "@/components/auth/RoleGate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRequestLeave } from "@/hooks/useLeaves";

export default function LeaveRequestPage() {
  const requestMutation = useRequestLeave();

  const [form, setForm] = useState({
    startDate: "",
    endDate: "",
    reason: ""
  });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await requestMutation.mutateAsync(form);
      toast.success("Leave request sent");
      setForm({ startDate: "", endDate: "", reason: "" });
    } catch (error) {
      toast.error("Unable to submit leave request", {
        description: error instanceof Error ? error.message : "Try again"
      });
    }
  }

  return (
    <RoleGate allow={["ROLE_USER"]} fallbackPath="/hr">
      <main className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Request Leave</h1>
          <p className="text-sm text-muted-foreground">
            Submit a leave request for HR approval.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Leave form</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={form.startDate}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, startDate: event.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={form.endDate}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, endDate: event.target.value }))
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason</Label>
                <Textarea
                  id="reason"
                  value={form.reason}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, reason: event.target.value }))
                  }
                  placeholder="Annual leave, sick leave, travel..."
                  required
                />
              </div>

              <Button disabled={requestMutation.isPending}>
                {requestMutation.isPending ? "Submitting..." : "Submit leave request"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </RoleGate>
  );
}
