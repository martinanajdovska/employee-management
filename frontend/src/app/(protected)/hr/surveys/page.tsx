"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { RoleGate } from "@/components/auth/RoleGate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useEmployees } from "@/hooks/useEmployees";
import { useEmployeeSurveys, useSendSurvey } from "@/hooks/useSurveys";

export default function HrSurveysPage() {
  const searchParams = useSearchParams();
  const employeesQuery = useEmployees();
  const sendSurveyMutation = useSendSurvey();

  const employees = useMemo(
    () => employeesQuery.data?.filter((item) => item.role === "ROLE_USER") ?? [],
    [employeesQuery.data]
  );

  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [question, setQuestion] = useState("");
  const employeeSurveysQuery = useEmployeeSurveys(
    selectedEmployeeId ? Number(selectedEmployeeId) : undefined
  );

  useEffect(() => {
    if (!selectedEmployeeId && employees.length) {
      setSelectedEmployeeId(String(employees[0].id));
    }
  }, [employees, selectedEmployeeId]);

  useEffect(() => {
    const employeeIdFromQuery = searchParams.get("employeeId");
    if (!employeeIdFromQuery) return;

    const normalized = Number(employeeIdFromQuery);
    if (!Number.isFinite(normalized)) return;
    if (!employees.some((employee) => employee.id === normalized)) return;

    if (selectedEmployeeId !== String(normalized)) {
      setSelectedEmployeeId(String(normalized));
    }
  }, [employees, searchParams, selectedEmployeeId]);

  async function sendSurvey(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedEmployeeId) return;

    try {
      await sendSurveyMutation.mutateAsync({
        employeeId: Number(selectedEmployeeId),
        question
      });
      toast.success("Survey sent");
      setQuestion("");
    } catch (error) {
      toast.error("Unable to send survey", {
        description: error instanceof Error ? error.message : "Try again"
      });
    }
  }

  return (
    <RoleGate allow={["ROLE_ADMIN"]} fallbackPath="/dashboard">
      <section className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">HR Surveys</h1>
          <p className="text-sm text-muted-foreground">
            Assign survey questions directly to employees.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Send survey</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-3" onSubmit={sendSurvey}>
                <div className="space-y-1">
                  <Label>Employee</Label>
                  <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={String(employee.id)}>
                          {employee.firstName} {employee.lastName} (@{employee.username})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label>Question</Label>
                  <Input
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    placeholder="How do you rate workload this week?"
                    required
                  />
                </div>

                <Button className="w-full" disabled={sendSurveyMutation.isPending}>
                  {sendSurveyMutation.isPending ? "Sending..." : "Send survey"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Employee survey responses</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void employeeSurveysQuery.refetch()}
                  disabled={!selectedEmployeeId || employeeSurveysQuery.isFetching}
                >
                  {employeeSurveysQuery.isFetching ? "Refreshing..." : "Refresh responses"}
                </Button>
              </div>
              {employeeSurveysQuery.isLoading ? (
                <>
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </>
              ) : employeeSurveysQuery.error ? (
                <p className="text-sm text-destructive">
                  Failed to load survey responses.
                </p>
              ) : employeeSurveysQuery.data?.length ? (
                employeeSurveysQuery.data.map((survey) => (
                  <div key={survey.id} className="rounded-lg border border-border/70 p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <Badge variant={survey.response ? "secondary" : "default"}>
                        {survey.response ? "Answered" : "Pending"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(survey.createdAt), "PPp")}
                      </span>
                    </div>
                    <p className="text-sm font-medium">{survey.question}</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {survey.response ? `Response: ${survey.response}` : "Response: No answer yet."}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No surveys found for the selected employee.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </RoleGate>
  );
}
