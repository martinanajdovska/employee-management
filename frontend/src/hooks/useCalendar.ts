"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createEvent as createEventRequest, deleteEvent as deleteEventRequest, getEvents } from "@/lib/events-api";
import type { EventPayload } from "@/types/api";

const CALENDAR_EVENTS_QUERY_KEY = ["calendar", "events"] as const;

export function useCalendarEvents() {
  return useQuery({
    queryKey: CALENDAR_EVENTS_QUERY_KEY,
    queryFn: getEvents
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: EventPayload) => createEventRequest(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CALENDAR_EVENTS_QUERY_KEY });
    }
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteEventRequest(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CALENDAR_EVENTS_QUERY_KEY });
    }
  });
}
