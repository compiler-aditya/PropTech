import { Suspense } from "react";
import { requireRole } from "@/lib/auth-utils";
import { getAnalyticsData } from "@/actions/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusDonut } from "@/components/analytics/status-donut";
import { PriorityBar } from "@/components/analytics/priority-bar";
import { CategoryBar } from "@/components/analytics/category-bar";
import { MonthlyTrend } from "@/components/analytics/monthly-trend";
import { TechnicianBar } from "@/components/analytics/technician-bar";
import { AnalyticsFilters } from "@/components/analytics/analytics-filters";
import { ExportButton } from "@/components/analytics/export-button";
import {
  Ticket,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from "lucide-react";

interface PageProps {
  searchParams: Promise<{
    from?: string;
    to?: string;
    propertyId?: string;
    technicianId?: string;
  }>;
}

export default async function AnalyticsPage({ searchParams }: PageProps) {
  await requireRole(["MANAGER"]);

  const params = await searchParams;
  const data = await getAnalyticsData({
    from: params.from,
    to: params.to,
    propertyId: params.propertyId,
    technicianId: params.technicianId,
  });

  const { summary, byStatus, byPriority, byCategory, monthlyTrend, byProperty, technicianWorkload, properties, technicians } = data;

  // Active filter label for sub-heading
  const activeProperty = properties.find((p) => p.id === params.propertyId);
  const activeTechnician = technicians.find((t) => t.id === params.technicianId);
  const scopeLabel = [
    activeProperty?.name,
    activeTechnician?.name,
    params.from && params.to
      ? `${params.from} – ${params.to}`
      : params.from
      ? `From ${params.from}`
      : params.to
      ? `To ${params.to}`
      : "Last 30 days",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-sm text-muted-foreground">{scopeLabel}</p>
        </div>
        <ExportButton data={data} scopeLabel={scopeLabel} />
      </div>

      {/* Filters */}
      <Suspense>
        <AnalyticsFilters properties={properties} technicians={technicians} />
      </Suspense>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard
          label="Total Tickets"
          value={summary.total}
          icon={<Ticket className="h-4 w-4 text-blue-500" />}
          sub={activeProperty ? activeProperty.name : "All properties"}
        />
        <StatCard
          label="Active"
          value={summary.active}
          icon={<Activity className="h-4 w-4 text-orange-500" />}
          sub="Open + In Progress"
        />
        <StatCard
          label="Completed"
          value={summary.completedInRange}
          icon={<CheckCircle2 className="h-4 w-4 text-green-500" />}
          sub="In selected range"
        />
        <StatCard
          label="Urgent Open"
          value={summary.urgentOpen}
          icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
          sub="Needs attention"
          highlight={summary.urgentOpen > 0}
        />
        <StatCard
          label="Avg Resolution"
          value={summary.avgResolutionDays !== null ? `${summary.avgResolutionDays}d` : "—"}
          icon={<Clock className="h-4 w-4 text-violet-500" />}
          sub="Days to close"
          className="col-span-2 md:col-span-1"
        />
      </div>

      {/* Status + Priority row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <StatusDonut data={byStatus} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">By Priority</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <PriorityBar data={byPriority} />
          </CardContent>
        </Card>
      </div>

      {/* Monthly trend — full width */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Monthly Ticket Volume (last 6 months)</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <MonthlyTrend data={monthlyTrend} />
        </CardContent>
      </Card>

      {/* Category + Technician row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">By Category</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <CategoryBar data={byCategory} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Technician Workload</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <TechnicianBar data={technicianWorkload} />
          </CardContent>
        </Card>
      </div>

      {/* Property summary table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Property Summary</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-left py-2 pr-4 font-medium">Property</th>
                <th className="text-right py-2 px-3 font-medium">Total</th>
                <th className="text-right py-2 px-3 font-medium">Active</th>
                <th className="text-right py-2 px-3 font-medium">Completed</th>
                <th className="text-right py-2 pl-3 font-medium">Done %</th>
              </tr>
            </thead>
            <tbody>
              {byProperty.map((p) => {
                const pct = p.total > 0 ? Math.round((p.completed / p.total) * 100) : 0;
                const isActive = p.propertyId === params.propertyId;
                return (
                  <tr
                    key={p.propertyId}
                    className={`border-b last:border-0 transition-colors ${
                      isActive ? "bg-primary/5" : "hover:bg-muted/40"
                    }`}
                  >
                    <td className="py-2.5 pr-4 font-medium">
                      {isActive && (
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary mr-2 align-middle" />
                      )}
                      {p.name}
                    </td>
                    <td className="text-right py-2.5 px-3 tabular-nums">{p.total}</td>
                    <td className="text-right py-2.5 px-3 tabular-nums text-orange-600 dark:text-orange-400">
                      {p.open}
                    </td>
                    <td className="text-right py-2.5 px-3 tabular-nums text-green-600 dark:text-green-400">
                      {p.completed}
                    </td>
                    <td className="text-right py-2.5 pl-3">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden hidden sm:block">
                          <div
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="tabular-nums text-muted-foreground">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {byProperty.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    No properties found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Stat card helper ──────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon,
  sub,
  highlight,
  className,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  sub?: string;
  highlight?: boolean;
  className?: string;
}) {
  return (
    <Card className={`${highlight ? "border-red-500/50 bg-red-500/5 dark:bg-red-500/10" : ""} ${className ?? ""}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {label}
          </span>
          {icon}
        </div>
        <div className="text-2xl font-bold tabular-nums">{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-0.5 truncate">{sub}</div>}
      </CardContent>
    </Card>
  );
}
