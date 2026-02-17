import { Suspense } from "react";
import Link from "next/link";
import { requireAuth } from "@/lib/auth-utils";
import { getDashboardStats } from "@/actions/tickets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/tickets/status-badge";
import { PriorityBadge } from "@/components/tickets/priority-badge";
import { ROLES, ROLE_LABELS } from "@/lib/constants";
import { timeAgo } from "@/lib/utils";
import {
  Plus,
  AlertCircle,
  UserCheck,
  Play,
  CheckCircle2,
} from "lucide-react";

function DashboardSkeleton() {
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <div className="h-5 w-5" />
                </div>
                <div>
                  <div className="h-7 w-10 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-16 bg-muted rounded animate-pulse mt-1" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg">
                <div className="min-w-0 flex-1">
                  <div className="h-4 w-48 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-32 bg-muted rounded animate-pulse mt-1" />
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <div className="h-5 w-16 bg-muted rounded animate-pulse" />
                  <div className="h-5 w-20 bg-muted rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

async function DashboardContent({ userRole }: { userRole: string }) {
  const stats = await getDashboardStats();

  const statCards = [
    {
      label: "Open",
      value: stats.open,
      icon: AlertCircle,
      color: "text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-950",
      status: "OPEN",
    },
    {
      label: "Assigned",
      value: stats.assigned,
      icon: UserCheck,
      color: "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950",
      status: "ASSIGNED",
    },
    {
      label: "In Progress",
      value: stats.inProgress,
      icon: Play,
      color: "text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-950",
      status: "IN_PROGRESS",
    },
    {
      label: "Completed",
      value: stats.completed,
      icon: CheckCircle2,
      color: "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950",
      status: "COMPLETED",
    },
  ];

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <Link key={stat.label} href={`/tickets?status=${stat.status}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Tickets</CardTitle>
          <Link href="/tickets">
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {stats.recentTickets.length > 0 ? (
            <div className="space-y-3">
              {stats.recentTickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/tickets/${ticket.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">
                      {ticket.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {ticket.property.name} · {ticket.submitter.name}
                      {ticket.assignee && ` → ${ticket.assignee.name}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-2 shrink-0">
                    <PriorityBadge priority={ticket.priority} />
                    <StatusBadge status={ticket.status} />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">
              No tickets yet.
              {userRole === ROLES.TENANT &&
                " Submit your first maintenance request to get started."}
            </p>
          )}
        </CardContent>
      </Card>
    </>
  );
}

export default async function DashboardPage() {
  const user = await requireAuth();

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Welcome back, {user.name} · {ROLE_LABELS[user.role]}
          </p>
        </div>
        {user.role === ROLES.TENANT && (
          <Link href="/tickets/new">
            <Button>
              <Plus className="h-4 w-4 mr-1" />
              New Request
            </Button>
          </Link>
        )}
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent userRole={user.role} />
      </Suspense>
    </div>
  );
}
