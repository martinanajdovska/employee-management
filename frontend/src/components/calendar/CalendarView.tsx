"use client";

import { useMemo, useState } from "react";
import {
  addDays,
  addHours,
  addMonths,
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths
} from "date-fns";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { useCalendarEvents, useCreateEvent, useDeleteEvent } from "@/hooks/useCalendar";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { EventPayload, Event as CalendarEvent } from "@/types/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

type MainView = "calendar" | "list";
type CalendarDensity = "month" | "week";
type CalendarRole = "EMPLOYEE" | "HR";

interface CalendarViewProps {
  role: CalendarRole;
}

interface EventFormState {
  title: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  location: string;
  type: string;
}

const WEEK_STARTS_ON = 1 as const; // Monday
const EVENT_TYPES = ["Meeting", "Holiday", "Deadline", "Workshop", "Interview"] as const;

const dayNameSeed = startOfWeek(new Date(), { weekStartsOn: WEEK_STARTS_ON });
const WEEKDAY_LABELS = Array.from({ length: 7 }, (_, index) =>
  format(addDays(dayNameSeed, index), "EEE")
);

function toDateTimeInputValue(date: Date) {
  return format(date, "yyyy-MM-dd'T'HH:mm");
}

function makeDefaultFormState(baseDate: Date): EventFormState {
  const start = addHours(startOfDay(baseDate), 9);
  const end = addHours(start, 1);
  return {
    title: "",
    description: "",
    startDateTime: toDateTimeInputValue(start),
    endDateTime: toDateTimeInputValue(end),
    location: "",
    type: "Meeting"
  };
}

function eventTouchesDay(event: CalendarEvent, day: Date) {
  const eventStart = parseISO(event.startDateTime);
  const eventEnd = parseISO(event.endDateTime);
  const range = {
    start: startOfDay(day),
    end: endOfDay(day)
  };

  return (
    isWithinInterval(eventStart, range) ||
    isWithinInterval(eventEnd, range) ||
    (eventStart < range.start && eventEnd > range.end)
  );
}

function eventColor(type: string) {
  switch (type.toLowerCase()) {
    case "holiday":
      return "#16a34a";
    case "deadline":
      return "#dc2626";
    case "interview":
      return "#7c3aed";
    case "workshop":
      return "#0ea5e9";
    case "meeting":
    default:
      return "#2563eb";
  }
}

function formatEventTime(event: CalendarEvent) {
  const start = parseISO(event.startDateTime);
  const end = parseISO(event.endDateTime);
  return `${format(start, "p")} - ${format(end, "p")}`;
}

function buildApiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError && error.status === 403) {
    return "Only HR admins can perform this action.";
  }
  return error instanceof Error ? error.message : fallback;
}

export function CalendarView({ role }: CalendarViewProps) {
  const isAdmin = role === "HR";
  const eventsQuery = useCalendarEvents();
  const createEventMutation = useCreateEvent();
  const deleteEventMutation = useDeleteEvent();

  const [mainView, setMainView] = useState<MainView>("calendar");
  const [calendarDensity, setCalendarDensity] = useState<CalendarDensity>("month");
  const [focusDate, setFocusDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [form, setForm] = useState<EventFormState>(() => makeDefaultFormState(new Date()));

  const title = role === "HR" ? "HR Calendar" : "Team Calendar";
  const subtitle = role === "HR" ? "Create and manage company events." : "Browse all scheduled company events.";

  const events = useMemo(() => {
    const list = eventsQuery.data ?? [];
    return [...list].sort(
      (a, b) => parseISO(a.startDateTime).getTime() - parseISO(b.startDateTime).getTime()
    );
  }, [eventsQuery.data]);

  const monthGridRange = useMemo(() => {
    const monthStart = startOfMonth(focusDate);
    const monthEnd = endOfMonth(focusDate);
    const start = startOfWeek(monthStart, { weekStartsOn: WEEK_STARTS_ON });
    const end = endOfWeek(monthEnd, { weekStartsOn: WEEK_STARTS_ON });
    return { start, end };
  }, [focusDate]);

  const monthGridDays = useMemo(
    () => eachDayOfInterval({ start: monthGridRange.start, end: monthGridRange.end }),
    [monthGridRange]
  );

  const weekRange = useMemo(() => {
    const start = startOfWeek(focusDate, { weekStartsOn: WEEK_STARTS_ON });
    const end = endOfWeek(focusDate, { weekStartsOn: WEEK_STARTS_ON });
    return { start, end };
  }, [focusDate]);

  const weekDays = useMemo(
    () => eachDayOfInterval({ start: weekRange.start, end: weekRange.end }),
    [weekRange]
  );

  const visibleDays = calendarDensity === "month" ? monthGridDays : weekDays;

  const eventsByDay = useMemo(() => {
    const result = new Map<string, CalendarEvent[]>();
    visibleDays.forEach((day) => {
      result.set(format(day, "yyyy-MM-dd"), []);
    });

    events.forEach((event) => {
      visibleDays.forEach((day) => {
        if (!eventTouchesDay(event, day)) return;
        const key = format(day, "yyyy-MM-dd");
        const list = result.get(key);
        if (!list) return;
        list.push(event);
      });
    });

    result.forEach((list, key) => {
      result.set(
        key,
        [...list].sort(
          (a, b) => parseISO(a.startDateTime).getTime() - parseISO(b.startDateTime).getTime()
        )
      );
    });

    return result;
  }, [events, visibleDays]);

  const filteredListEvents = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    if (!search) return events;

    return events.filter((event) =>
      [event.title, event.description || "", event.location || "", event.type]
        .join(" ")
        .toLowerCase()
        .includes(search)
    );
  }, [events, searchTerm]);

  const groupedListEvents = useMemo(() => {
    const buckets = new Map<string, CalendarEvent[]>();
    filteredListEvents.forEach((event) => {
      const key = format(parseISO(event.startDateTime), "yyyy-MM-dd");
      const list = buckets.get(key) ?? [];
      list.push(event);
      buckets.set(key, list);
    });

    return Array.from(buckets.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredListEvents]);

  function openCreateDialog(day: Date) {
    if (!isAdmin) return;
    setForm(makeDefaultFormState(day));
    setCreateDialogOpen(true);
  }

  function openDetailsDialog(event: CalendarEvent) {
    setSelectedEvent(event);
    setDetailsDialogOpen(true);
  }

  function mapFormToPayload(): EventPayload {
    const title = form.title.trim();
    if (!title) throw new Error("Title is required.");

    const start = new Date(form.startDateTime);
    const end = new Date(form.endDateTime);
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) {
      throw new Error("Start and end date-time are required.");
    }
    if (end.getTime() <= start.getTime()) {
      throw new Error("End must be after start.");
    }

    return {
      title,
      description: form.description.trim(),
      startDateTime: form.startDateTime,
      endDateTime: form.endDateTime,
      location: form.location.trim(),
      type: form.type.trim() || "Meeting"
    };
  }

  async function submitCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const payload = mapFormToPayload();
      await createEventMutation.mutateAsync(payload);
      toast.success("Event created");
      setCreateDialogOpen(false);
    } catch (error) {
      toast.error("Unable to create event", {
        description: buildApiErrorMessage(error, "Please try again.")
      });
    }
  }

  async function removeEvent() {
    if (!selectedEvent) return;

    try {
      await deleteEventMutation.mutateAsync(selectedEvent.id);
      toast.success("Event deleted");
      setDetailsDialogOpen(false);
      setSelectedEvent(null);
    } catch (error) {
      toast.error("Unable to delete event", {
        description: buildApiErrorMessage(error, "Please try again.")
      });
    }
  }

  if (eventsQuery.isLoading) {
    return (
      <section className="space-y-4">
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-[560px] w-full" />
      </section>
    );
  }

  if (eventsQuery.error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Calendar unavailable</CardTitle>
          <CardDescription>
            Failed to load events from `/api/events`. Check backend auth/cookies and try again.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>

        {isAdmin ? (
          <Button onClick={() => openCreateDialog(new Date())}>
            <Plus className="mr-2 h-4 w-4" />
            Add event
          </Button>
        ) : null}
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={mainView === "calendar" ? "default" : "outline"}
                onClick={() => setMainView("calendar")}
              >
                Calendar View
              </Button>
              <Button
                variant={mainView === "list" ? "default" : "outline"}
                onClick={() => setMainView("list")}
              >
                List View
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={() => setFocusDate((prev) => subMonths(prev, 1))}>
                Previous
              </Button>
              <Button variant="outline" onClick={() => setFocusDate(new Date())}>
                Today
              </Button>
              <Button variant="outline" onClick={() => setFocusDate((prev) => addMonths(prev, 1))}>
                Next
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>
              {mainView === "calendar"
                ? calendarDensity === "month"
                  ? format(focusDate, "MMMM yyyy")
                  : `${format(weekRange.start, "MMM d")} - ${format(weekRange.end, "MMM d, yyyy")}`
                : "Agenda"}
            </CardTitle>

            {mainView === "calendar" ? (
              <div className="flex gap-2">
                <Button
                  variant={calendarDensity === "month" ? "default" : "outline"}
                  onClick={() => setCalendarDensity("month")}
                >
                  Month
                </Button>
                <Button
                  variant={calendarDensity === "week" ? "default" : "outline"}
                  onClick={() => setCalendarDensity("week")}
                >
                  Week
                </Button>
              </div>
            ) : (
              <div className="relative w-full max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
            )}
          </div>

          <CardDescription>
             {isAdmin ? "Click day to add event." : "View scheduled events."}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {events.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/70 p-8 text-center text-sm text-muted-foreground">
              No events yet.
            </div>
          ) : mainView === "calendar" ? (
            calendarDensity === "month" ? (
              <div className="overflow-hidden rounded-xl border border-border/70">
                <div className="grid grid-cols-7 border-b border-border/70 bg-muted/50">
                  {WEEKDAY_LABELS.map((label) => (
                    <div
                      key={label}
                      className="p-2 text-center text-xs font-semibold uppercase text-muted-foreground"
                    >
                      {label}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7">
                  {monthGridDays.map((day) => {
                    const key = format(day, "yyyy-MM-dd");
                    const dayEvents = eventsByDay.get(key) ?? [];
                    const isToday = isSameDay(day, new Date());
                    const inMonth = isSameMonth(day, focusDate);

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => openCreateDialog(day)}
                        className={cn(
                          "min-h-[130px] border-b border-r border-border/60 p-2 text-left align-top transition-colors",
                          isAdmin && "hover:bg-muted/40",
                          !inMonth && "bg-muted/20 text-muted-foreground",
                          isToday && "bg-primary/5"
                        )}
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span
                            className={cn(
                              "inline-flex h-7 w-7 items-center justify-center rounded-full text-sm",
                              isToday && "bg-primary text-primary-foreground"
                            )}
                          >
                            {format(day, "d")}
                          </span>
                        </div>

                        <div className="space-y-1">
                          {dayEvents.slice(0, 3).map((eventItem) => (
                            <button
                              key={`${eventItem.id}-${key}`}
                              type="button"
                              onClick={(clickEvent) => {
                                clickEvent.stopPropagation();
                                openDetailsDialog(eventItem);
                              }}
                              className="w-full truncate rounded px-2 py-1 text-left text-[11px] font-medium text-white"
                              style={{ backgroundColor: eventColor(eventItem.type) }}
                              title={`${eventItem.title} • ${formatEventTime(eventItem)}`}
                            >
                              {eventItem.title}
                            </button>
                          ))}
                          {dayEvents.length > 3 ? (
                            <p className="text-[11px] text-muted-foreground">+{dayEvents.length - 3} more</p>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-7">
                {weekDays.map((day) => {
                  const key = format(day, "yyyy-MM-dd");
                  const dayEvents = eventsByDay.get(key) ?? [];
                  const isToday = isSameDay(day, new Date());

                  return (
                    <div
                      key={key}
                      className={cn(
                        "rounded-xl border border-border/70 bg-card p-3",
                        isToday && "border-primary/50 bg-primary/5"
                      )}
                    >
                      <button
                        type="button"
                        className={cn("mb-3 w-full rounded-md px-2 py-1 text-left", isAdmin && "hover:bg-muted/60")}
                        onClick={() => openCreateDialog(day)}
                      >
                        <p className="text-xs uppercase text-muted-foreground">{format(day, "EEE")}</p>
                        <p className="font-semibold">{format(day, "MMM d")}</p>
                      </button>

                      <div className="space-y-2">
                        {dayEvents.length ? (
                          dayEvents.map((eventItem) => (
                            <button
                              key={`${eventItem.id}-${key}`}
                              type="button"
                              className="w-full rounded-lg border border-white/20 px-2 py-2 text-left text-xs text-white shadow-sm"
                              style={{ backgroundColor: eventColor(eventItem.type) }}
                              onClick={() => openDetailsDialog(eventItem)}
                            >
                              <p className="truncate font-semibold">{eventItem.title}</p>
                              <p className="truncate opacity-90">{formatEventTime(eventItem)}</p>
                            </button>
                          ))
                        ) : (
                          <p className="rounded-lg border border-dashed border-border/70 px-2 py-3 text-center text-xs text-muted-foreground">
                            No events
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : groupedListEvents.length ? (
            <div className="space-y-5">
              {groupedListEvents.map(([dateKey, dateEvents]) => (
                <div key={dateKey} className="space-y-2">
                  <h3 className="text-sm font-semibold text-muted-foreground">
                    {format(new Date(`${dateKey}T00:00:00`), "EEEE, MMMM d, yyyy")}
                  </h3>

                  <div className="space-y-2">
                    {dateEvents.map((eventItem) => (
                      <button
                        key={eventItem.id}
                        type="button"
                        className="w-full rounded-xl border border-border/70 bg-card p-3 text-left hover:bg-muted/40"
                        onClick={() => openDetailsDialog(eventItem)}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className="inline-flex h-3 w-3 rounded-full"
                              style={{ backgroundColor: eventColor(eventItem.type) }}
                            />
                            <p className="font-semibold">{eventItem.title}</p>
                            <Badge variant="outline">{eventItem.type}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{formatEventTime(eventItem)}</p>
                        </div>

                        {eventItem.description ? (
                          <p className="mt-2 text-sm text-muted-foreground">{eventItem.description}</p>
                        ) : null}

                        {eventItem.location ? (
                          <p className="mt-1 text-xs text-muted-foreground">Location: {eventItem.location}</p>
                        ) : null}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border/70 p-8 text-center text-sm text-muted-foreground">
              No events match your search.
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create event</DialogTitle>

          </DialogHeader>

          <form className="space-y-3" onSubmit={submitCreate}>
            <div className="space-y-1">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                required
              />
            </div>

            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label>Start</Label>
                <Input
                  type="datetime-local"
                  value={form.startDateTime}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, startDateTime: event.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>End</Label>
                <Input
                  type="datetime-local"
                  value={form.endDateTime}
                  onChange={(event) => setForm((prev) => ({ ...prev, endDateTime: event.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label>Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Location</Label>
                <Input
                  value={form.location}
                  onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createEventMutation.isPending}>
                {createEventMutation.isPending ? "Creating..." : "Create event"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title || "Event details"}</DialogTitle>
            <DialogDescription>Details from backend event record.</DialogDescription>
          </DialogHeader>

          {selectedEvent ? (
            <div className="space-y-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{selectedEvent.type}</Badge>
                <span className="text-muted-foreground">{formatEventTime(selectedEvent)}</span>
              </div>

              {selectedEvent.description ? <p>{selectedEvent.description}</p> : null}
              {selectedEvent.location ? (
                <p className="text-muted-foreground">Location: {selectedEvent.location}</p>
              ) : null}
              <p className="text-muted-foreground">
                {format(parseISO(selectedEvent.startDateTime), "PPpp")} -{" "}
                {format(parseISO(selectedEvent.endDateTime), "PPpp")}
              </p>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setDetailsDialogOpen(false)}>
                  Close
                </Button>
                {isAdmin ? (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={removeEvent}
                    disabled={deleteEventMutation.isPending}
                  >
                    {deleteEventMutation.isPending ? "Deleting..." : "Delete"}
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
