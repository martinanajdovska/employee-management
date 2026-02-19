"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { RoleGate } from "@/components/auth/RoleGate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAnswerSurvey, useMySurveys } from "@/hooks/useSurveys";

export default function EmployeeSurveysPage() {
  const surveysQuery = useMySurveys();
  const answerMutation = useAnswerSurvey();
  const [answers, setAnswers] = useState<Record<number, string>>({});

  async function submitAnswer(id: number) {
    const response = answers[id]?.trim();
    if (!response) {
      toast.error("Response is required");
      return;
    }

    try {
      await answerMutation.mutateAsync({ id, response });
      toast.success("Survey submitted");
      setAnswers((prev) => ({ ...prev, [id]: "" }));
    } catch (error) {
      toast.error("Unable to submit answer", {
        description: error instanceof Error ? error.message : "Try again"
      });
    }
  }

  return (
    <RoleGate allow={["ROLE_USER"]} fallbackPath="/hr">
      <section className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">My Surveys</h1>
          <p className="text-sm text-muted-foreground">
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Survey queue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {surveysQuery.data?.length ? (
              surveysQuery.data.map((survey) => {
                const isAnswered = Boolean(survey.response);

                return (
                  <div key={survey.id} className="rounded-lg border border-border/70 p-4">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <Badge variant={isAnswered ? "secondary" : "default"}>
                        {isAnswered ? "Answered" : "Pending"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(survey.createdAt), "PPp")}
                      </span>
                    </div>

                    <p className="font-medium">{survey.question}</p>

                    {isAnswered ? (
                      <p className="mt-2 text-sm text-muted-foreground">
                        Your response: {survey.response}
                      </p>
                    ) : (
                      <div className="mt-3 flex flex-col gap-2 md:flex-row">
                        <Input
                          placeholder="Type your answer"
                          value={answers[survey.id] || ""}
                          onChange={(event) =>
                            setAnswers((prev) => ({
                              ...prev,
                              [survey.id]: event.target.value
                            }))
                          }
                        />
                        <Button onClick={() => submitAnswer(survey.id)}>Submit</Button>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">No surveys assigned yet.</p>
            )}
          </CardContent>
        </Card>
      </section>
    </RoleGate>
  );
}
