"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { publishSurveyAssignmentSignal } from "@/lib/notifications";
import type { Survey } from "@/types/api";

export function useMySurveys() {
  return useQuery({
    queryKey: ["surveys", "mine"],
    queryFn: () => apiRequest<Survey[]>("/api/surveys/my-surveys")
  });
}

export function useEmployeeSurveys(employeeId?: number) {
  return useQuery({
    queryKey: ["surveys", "employee", employeeId],
    enabled: Boolean(employeeId),
    queryFn: () => apiRequest<Survey[]>(`/api/surveys/employee/${employeeId}`),
    refetchOnWindowFocus: true,
    refetchInterval: 20_000
  });
}

export function useSendSurvey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ question, employeeId }: { question: string; employeeId: number }) =>
      apiRequest<Survey>("/api/surveys/send", {
        method: "POST",
        query: { question, employeeId }
      }),
    onSuccess: (survey) => {
      publishSurveyAssignmentSignal({
        surveyId: survey.id,
        employeeId: survey.employee?.id ?? 0,
        question: survey.question,
        createdAt: survey.createdAt,
        adminUsername: survey.admin?.username
      });

      void queryClient.invalidateQueries({ queryKey: ["surveys"] });
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });
}

export function useAnswerSurvey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, response }: { id: number; response: string }) =>
      apiRequest<Survey>(`/api/surveys/answer/${id}`, {
        method: "PATCH",
        query: { response }
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["surveys"] });
    }
  });
}
