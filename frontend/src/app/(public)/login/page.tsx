"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogin } from "@/hooks/useAuth";
import { DEFAULT_ROUTE_BY_ROLE } from "@/lib/nav";

export default function LoginPage() {
  const router = useRouter();
  const loginMutation = useLogin();

  const [form, setForm] = useState({
    username: "",
    password: ""
  });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const me = await loginMutation.mutateAsync(form);
      toast.success("Welcome back");
      router.replace(DEFAULT_ROUTE_BY_ROLE[me.role]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid credentials";
      toast.error("Login failed", { description: message });
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl items-center px-4 py-12">
      <Card className="w-full overflow-hidden">
        <div className="grid md:grid-cols-2">
          <div className="hidden bg-primary/95 p-10 text-primary-foreground md:block">
            <p className="font-heading text-4xl font-bold">EmployeeOS</p>
            <p className="mt-4 text-primary-foreground/90">
              Centralized platform for leaves, salaries, surveys, event scheduling, and team notifications.
            </p>
          </div>

          <div className="p-6 md:p-10">
            <CardHeader className="p-0">
              <CardTitle>Sign in</CardTitle>
              <CardDescription>Use your company credentials.</CardDescription>
            </CardHeader>

            <CardContent className="mt-6 p-0">
              <form className="space-y-4" onSubmit={onSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={form.username}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, username: event.target.value }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={form.password}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, password: event.target.value }))
                    }
                    required
                  />
                </div>

                <Button className="w-full" disabled={loginMutation.isPending}>
                  {loginMutation.isPending ? "Signing in..." : "Sign in"}
                </Button>
              </form>

              <p className="mt-4 text-sm text-muted-foreground">
                No account?{" "}
                <Link className="text-primary underline" href="/register">
                  Create one
                </Link>
              </p>
            </CardContent>
          </div>
        </div>
      </Card>
    </main>
  );
}
