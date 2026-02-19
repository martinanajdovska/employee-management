"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { RoleGate } from "@/components/auth/RoleGate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnswerSurvey, useMySurveys } from "@/hooks/useSurveys";

export default function SurveyDetailPage({ params }: { params: { id: string } }) {
  const surveyId = Number(params.id);
  const surveysQuery = useMySurveys();
  const answerMutation = useAnswerSurvey();
  const [answer, setAnswer] = useState("");

  const survey = useMemo(
    () => surveysQuery.data?.find((item) => item.id === surveyId),
    [surveyId, surveysQuery.data]
  );

  async function submitAnswer() {
    const response = answer.trim();
    if (!response || !survey) {
      toast.error("Response is required");
      return;
    }

    try {
      await answerMutation.mutateAsync({ id: survey.id, response });
      toast.success("Survey submitted");
      setAnswer("");
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
          <h1 className="font-heading text-2xl font-bold">Survey Detail</h1>
          <p className="text-sm text-muted-foreground">Survey ID: {params.id}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Assigned survey</CardTitle>
            <CardDescription>Focused survey view for notification deep links.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {surveysQuery.isLoading ? (
              <Skeleton className="h-28 w-full" />
            ) : !Number.isFinite(surveyId) ? (
              <p className="text-sm text-muted-foreground">Invalid survey ID.</p>
            ) : survey ? (
              <div className="rounded-lg border border-border/70 p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Badge variant={survey.response ? "secondary" : "default"}>
                    {survey.response ? "Answered" : "Pending"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(survey.createdAt), "PPp")}
                  </span>
                </div>

                <p className="font-medium">{survey.question}</p>

                {survey.response ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Your response: {survey.response}
                  </p>
                ) : (
                  <div className="mt-3 flex flex-col gap-2 md:flex-row">
                    <Input
                      placeholder="Type your answer"
                      value={answer}
                      onChange={(event) => setAnswer(event.target.value)}
                    />
                    <Button onClick={submitAnswer} disabled={answerMutation.isPending}>
                      {answerMutation.isPending ? "Submitting..." : "Submit"}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                This survey was not found in your queue.
              </p>
            )}

            <Button variant="outline" asChild>
              <Link href="/surveys">Back to surveys</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </RoleGate>
  );
}
