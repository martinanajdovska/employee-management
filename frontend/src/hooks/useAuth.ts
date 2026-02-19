"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  clearPersistedAuthIdentity,
  getMe,
  login,
  logout,
  persistUsername,
  register
} from "@/lib/auth";
import type { SignInPayload, SignUpPayload } from "@/types/api";

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: getMe
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (payload: SignUpPayload) => register(payload)
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SignInPayload) => {
      await login(payload);
      persistUsername(payload.username);
      return getMe();
    },
    onSuccess: (me) => {
      queryClient.setQueryData(["me"], me);
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      clearPersistedAuthIdentity();
      queryClient.clear();
    }
  });
}
