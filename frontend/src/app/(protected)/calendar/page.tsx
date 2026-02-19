"use client";

import { RoleGate } from "@/components/auth/RoleGate";
import { CalendarView } from "@/components/calendar/CalendarView";

export default function EmployeeCalendarPage() {
  return (
    <RoleGate allow={["ROLE_USER"]} fallbackPath="/hr">
      <CalendarView role="EMPLOYEE" />
    </RoleGate>
  );
}
