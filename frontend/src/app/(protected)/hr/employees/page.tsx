"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { RoleGate } from "@/components/auth/RoleGate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { useAddEmployee, useDeleteEmployee, useEmployees } from "@/hooks/useEmployees";
import { useMe } from "@/hooks/useAuth";

export default function HrEmployeesPage() {
  const meQuery = useMe();
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");

  const employeesQuery = useEmployees({
    search,
    department: departmentFilter === "ALL" ? undefined : departmentFilter
  });

  const addEmployeeMutation = useAddEmployee();
  const deleteEmployeeMutation = useDeleteEmployee();

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    salary: "3000",
    department: "Engineering"
  });

  const departments = useMemo(() => {
    const list = employeesQuery.data?.map((item) => item.department).filter(Boolean) ?? [];
    return Array.from(new Set(list));
  }, [employeesQuery.data]);

  async function addEmployee(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await addEmployeeMutation.mutateAsync({
        ...form,
        salary: Number(form.salary)
      });
      toast.success("Employee added");
      setCreateOpen(false);
      setForm({
        username: "",
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        salary: "3000",
        department: "Engineering"
      });
    } catch (error) {
      toast.error("Unable to add employee", {
        description: error instanceof Error ? error.message : "Try again"
      });
    }
  }

  async function deleteEmployee(id: number) {
    if (!confirm("Delete this employee?")) return;

    try {
      await deleteEmployeeMutation.mutateAsync(id);
      toast.success("Employee deleted");
    } catch (error) {
      toast.error("Unable to delete employee", {
        description: error instanceof Error ? error.message : "Try again"
      });
    }
  }

  return (
    <RoleGate allow={["ROLE_ADMIN"]} fallbackPath="/dashboard">
      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl font-bold">Employees</h1>
            <p className="text-sm text-muted-foreground">
              Search, filter, add, inspect, and delete employee records.
            </p>
          </div>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>Add employee</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create employee</DialogTitle>
                <DialogDescription>
                </DialogDescription>
              </DialogHeader>

              <form className="space-y-3" onSubmit={addEmployee}>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label>First name</Label>
                    <Input
                      value={form.firstName}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, firstName: event.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Last name</Label>
                    <Input
                      value={form.lastName}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, lastName: event.target.value }))
                      }
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>Username</Label>
                  <Input
                    value={form.username}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, username: event.target.value }))
                    }
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, email: event.target.value }))
                    }
                    required
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label>Password</Label>
                    <Input
                      type="password"
                      value={form.password}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, password: event.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Salary</Label>
                    <Input
                      type="number"
                      value={form.salary}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, salary: event.target.value }))
                      }
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>Department</Label>
                  <Input
                    value={form.department}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, department: event.target.value }))
                    }
                    required
                  />
                </div>

                <Button className="w-full" disabled={addEmployeeMutation.isPending}>
                  {addEmployeeMutation.isPending ? "Creating..." : "Create employee"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Employee directory</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, username, or email"
              />

              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All departments</SelectItem>
                  {departments.map((department) => (
                    <SelectItem key={department} value={department}>
                      {department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Salary</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employeesQuery.data?.length ? (
                  employeesQuery.data.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <p className="font-medium">
                          {employee.firstName} {employee.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">@{employee.username}</p>
                      </TableCell>
                      <TableCell>{employee.department || "N/A"}</TableCell>
                      <TableCell>${Number(employee.salary ?? 0).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">Active</Badge>
                      </TableCell>
                      <TableCell className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/hr/employees/${employee.id}`}>View</Link>
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={employee.id === meQuery.data?.id}
                          onClick={() => deleteEmployee(employee.id)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground">
                      No employees found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    </RoleGate>
  );
}
