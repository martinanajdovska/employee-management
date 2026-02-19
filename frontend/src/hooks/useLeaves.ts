"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import type { LeaveRequest, LeaveRequestPayload, Role } from "@/types/api";

export interface LeaveFilters {
  status?: string;
}

export function useLeaves(role: Role, filters: LeaveFilters = {}) {
  return useQuery({
    queryKey: ["leaves", role, filters],
    queryFn: async () => {
      if (role !== "ROLE_ADMIN") {
        return [] as LeaveRequest[];
      }

      const items = await apiRequest<LeaveRequest[]>("/api/leave/all");
      if (!filters.status) return items;
      return items.filter((item) => item.status === filters.status);
    }
  });
}

export function useRequestLeave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LeaveRequestPayload) =>
      apiRequest<LeaveRequest>("/api/leave/request", {
        method: "POST",
        body: payload
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["leaves"] });
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      void queryClient.invalidateQueries({ queryKey: ["calendar"] });
    }
  });
}

export function useUpdateLeaveStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest<LeaveRequest>(`/api/leave/status/${id}`, {
        method: "PATCH",
        query: { status }
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["leaves"] });
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      void queryClient.invalidateQueries({ queryKey: ["calendar"] });
    }
  });
}

export function useDeleteLeave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      apiRequest<void>(`/api/leave/delete/${id}`, {
        method: "DELETE"
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["leaves"] });
      void queryClient.invalidateQueries({ queryKey: ["calendar"] });
    }
  });
}
