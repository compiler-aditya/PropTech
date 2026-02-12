import { requireAuth } from "@/lib/auth-utils";
import { ROLE_LABELS } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const user = await requireAuth();

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user.name}
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Your Role</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-medium">
            {ROLE_LABELS[user.role] || user.role}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            You are signed in as {user.email}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
