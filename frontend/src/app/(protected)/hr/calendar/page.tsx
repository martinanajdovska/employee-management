"use client";

import { RoleGate } from "@/components/auth/RoleGate";
import { CalendarView } from "@/components/calendar/CalendarView";

export default function HrCalendarPage() {
  return (
    <RoleGate allow={["ROLE_ADMIN"]} fallbackPath="/dashboard">
      <CalendarView role="HR" />
    </RoleGate>
  );
}
