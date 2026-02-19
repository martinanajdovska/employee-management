import { apiRequest } from "@/lib/api";
import type { Event, EventPayload } from "@/types/api";

export function getEvents() {
  return apiRequest<Event[]>("/api/events");
}

export function createEvent(payload: EventPayload) {
  return apiRequest<Event>("/api/events", {
    method: "POST",
    body: payload
  });
}

export function deleteEvent(id: number) {
  return apiRequest<void>(`/api/events/${id}`, {
    method: "DELETE"
  });
}
