export type Role = "ROLE_USER" | "ROLE_ADMIN";

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  password?: string;
  email: string;
  role: Role;
  salary: number;
  department: string;
}

export interface LeaveRequest {
  id: number;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  user?: User;
}

export interface Event {
  id: number;
  title: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  location: string;
  type: string;
}

export interface SalarySlip {
  month: string;
  year: number;
  hoursWorked: number;
  fixedSalary: number;
  department: string;
  totalPayout: number;
}

export interface WorkLog {
  id: number;
  month: string;
  year: number;
  hoursWorked: number;
  user: User;
}

export interface ProfileResponse {
  fullName: string;
  department: string;
  monthlySalary: number;
  workHistory: SalarySlip[];
}

export interface NotificationItem {
  id: number;
  recipient: string;
  actor: string;
  message: string;
  link: string;
  isRead: boolean;
  createdAt: string;
  type: "REQUEST" | "APPROVE" | "DENY" | "SURVEY";
  localOnly?: boolean;
  surveyId?: number;
}

export interface Survey {
  id: number;
  question: string;
  response: string | null;
  createdAt: string;
  employee: User;
  admin: User;
}

export interface SignInPayload {
  username: string;
  password: string;
}

export interface SignUpPayload {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  salary?: number;
  department?: string;
}

export interface LeaveRequestPayload {
  startDate: string;
  endDate: string;
  reason: string;
}

export interface WorkLogPayload {
  userId: number;
  month: string;
  year: number;
  hoursWorked: number;
}

export interface EventPayload {
  title: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  location: string;
  type: string;
}
