"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import type { SignUpPayload, User } from "@/types/api";

export interface EmployeeFilters {
  search?: string;
  department?: string;
}

export function useEmployees(filters: EmployeeFilters = {}) {
  return useQuery({
    queryKey: ["employees", filters],
    queryFn: async () => {
      const users = await apiRequest<User[]>("/api/users/all-employees");
      const search = filters.search?.toLowerCase().trim();
      const department = filters.department?.trim();

      return users.filter((user) => {
        const matchesSearch =
          !search ||
          `${user.firstName} ${user.lastName}`.toLowerCase().includes(search) ||
          user.username.toLowerCase().includes(search) ||
          user.email.toLowerCase().includes(search);
        const matchesDepartment = !department || user.department === department;
        return matchesSearch && matchesDepartment;
      });
    }
  });
}

export function useEmployee(id?: number) {
  return useQuery({
    queryKey: ["employee", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const users = await apiRequest<User[]>("/api/users/all-employees");
      return users.find((item) => item.id === id) ?? null;
    }
  });
}

export function useAddEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SignUpPayload) =>
      apiRequest<string>("/api/auth/register", {
        method: "POST",
        body: payload
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["employees"] });
    }
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      apiRequest<void>(`/api/users/delete/${id}`, {
        method: "DELETE"
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["employees"] });
    }
  });
}
