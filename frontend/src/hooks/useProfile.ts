"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import type { ProfileResponse, SalarySlip, WorkLog, WorkLogPayload } from "@/types/api";

export function useProfileData(userId?: number) {
  return useQuery({
    queryKey: ["profile", userId],
    enabled: Boolean(userId),
    queryFn: () => apiRequest<ProfileResponse>(`/api/profile/${userId}`)
  });
}

export function useSalarySlips(userId?: number) {
  return useQuery({
    queryKey: ["salary-slips", userId],
    enabled: Boolean(userId),
    queryFn: () => apiRequest<SalarySlip[]>(`/api/profile/${userId}/slips`)
  });
}

export function usePayrollByMonth(userId?: number, month?: string) {
  return useQuery({
    queryKey: ["payroll", month],
    enabled: Boolean(userId && month),
    queryFn: async () => {
      const slips = await apiRequest<SalarySlip[]>(`/api/profile/${userId}/slips`);
      return slips.find((slip) => slip.month === month) ?? null;
    }
  });
}

export function useLogHours() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: WorkLogPayload) =>
      apiRequest<WorkLog>("/api/profile/log-hours", {
        method: "POST",
        body: payload
      }),
    onSuccess: (_, payload) => {
      void queryClient.invalidateQueries({ queryKey: ["profile", payload.userId] });
      void queryClient.invalidateQueries({ queryKey: ["salary-slips", payload.userId] });
      void queryClient.invalidateQueries({ queryKey: ["payroll"] });
    }
  });
}
