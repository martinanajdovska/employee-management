import Link from "next/link";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ForbiddenPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center px-4 py-12">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <ShieldX className="h-6 w-6" />
            Access denied
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You do not have permission to access this page.
          </p>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/dashboard">Go to employee dashboard</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/hr">Go to HR dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
