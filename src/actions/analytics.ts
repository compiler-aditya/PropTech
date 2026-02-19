"use server";

import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth-utils";
import { CATEGORY_LABELS, PRIORITY_LABELS, STATUS_LABELS } from "@/lib/constants";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

export type AnalyticsData = Awaited<ReturnType<typeof getAnalyticsData>>;

export async function getAnalyticsData(
  filters: {
    from?: string;
    to?: string;
    propertyId?: string;
    technicianId?: string;
  } = {}
) {
  await requireRole(["MANAGER"]);

  // Default date range: last 30 days
  const now = new Date();
  const defaultFrom = new Date(now);
  defaultFrom.setDate(defaultFrom.getDate() - 30);
  defaultFrom.setHours(0, 0, 0, 0);

  const dateFrom = filters.from ? new Date(filters.from + "T00:00:00") : defaultFrom;
  const dateTo = filters.to
    ? new Date(filters.to + "T23:59:59")
    : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  // Single fetch — all tickets + properties + technicians in parallel
  const [allTickets, properties, technicians] = await Promise.all([
    prisma.maintenanceTicket.findMany({
      select: {
        id: true,
        status: true,
        priority: true,
        category: true,
        propertyId: true,
        assigneeId: true,
        createdAt: true,
        completedAt: true,
      },
    }),
    prisma.property.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { role: "TECHNICIAN" },
      select: { id: true, name: true },
    }),
  ]);

  // Apply property / technician scope filters in JS so the property table
  // can always show all-property totals (using allTickets) while charts
  // respect the active filters (using tickets)
  const tickets = allTickets.filter((t) => {
    if (filters.propertyId && t.propertyId !== filters.propertyId) return false;
    if (filters.technicianId && t.assigneeId !== filters.technicianId) return false;
    return true;
  });

  // ── Summary ──────────────────────────────────────────────────────────────
  const total = tickets.length;
  const active = tickets.filter((t) =>
    ["OPEN", "ASSIGNED", "IN_PROGRESS"].includes(t.status)
  ).length;
  const completedInRange = tickets.filter(
    (t) =>
      t.status === "COMPLETED" &&
      t.completedAt &&
      t.completedAt >= dateFrom &&
      t.completedAt <= dateTo
  ).length;
  const urgentOpen = tickets.filter(
    (t) => t.priority === "URGENT" && t.status !== "COMPLETED"
  ).length;

  const completedWithTime = tickets.filter(
    (t) => t.status === "COMPLETED" && t.completedAt !== null
  );
  const avgResolutionDays =
    completedWithTime.length > 0
      ? Math.round(
          completedWithTime.reduce(
            (sum, t) =>
              sum +
              (t.completedAt!.getTime() - t.createdAt.getTime()) /
                (1000 * 60 * 60 * 24),
            0
          ) / completedWithTime.length
        )
      : null;

  // ── By Status (donut) ─────────────────────────────────────────────────────
  const STATUS_COLORS: Record<string, string> = {
    OPEN: "#60a5fa",      // blue-400
    ASSIGNED: "#facc15",  // yellow-400
    IN_PROGRESS: "#fb923c", // orange-400
    COMPLETED: "#4ade80", // green-400
  };
  const byStatus = Object.entries(STATUS_LABELS).map(([status, label]) => ({
    status,
    label,
    count: tickets.filter((t) => t.status === status).length,
    color: STATUS_COLORS[status],
  }));

  // ── By Priority (bar) ─────────────────────────────────────────────────────
  const PRIORITY_COLORS: Record<string, string> = {
    LOW: "#86efac",     // green-300
    MEDIUM: "#fde047",  // yellow-300
    HIGH: "#fb923c",    // orange-400
    URGENT: "#f87171",  // red-400
  };
  const byPriority = Object.entries(PRIORITY_LABELS).map(([priority, label]) => ({
    priority,
    label,
    count: tickets.filter((t) => t.priority === priority).length,
    color: PRIORITY_COLORS[priority],
  }));

  // ── By Category (bar) ─────────────────────────────────────────────────────
  const byCategory = Object.entries(CATEGORY_LABELS)
    .map(([category, label]) => ({
      category,
      label,
      count: tickets.filter((t) => t.category === category).length,
    }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count);

  // ── Monthly Trend (last 6 months, scoped to filters) ─────────────────────
  const monthlyTrend = Array.from({ length: 6 }).map((_, i) => {
    const monthDate = subMonths(now, 5 - i);
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    return {
      month: format(monthDate, "MMM"),
      created: tickets.filter(
        (t) => t.createdAt >= monthStart && t.createdAt <= monthEnd
      ).length,
      completed: tickets.filter(
        (t) =>
          t.completedAt &&
          t.completedAt >= monthStart &&
          t.completedAt <= monthEnd
      ).length,
    };
  });

  // ── By Property (always all properties, unfiltered) ───────────────────────
  const byProperty = properties
    .map((p) => {
      const propTickets = allTickets.filter((t) => t.propertyId === p.id);
      return {
        propertyId: p.id,
        name: p.name,
        total: propTickets.length,
        open: propTickets.filter((t) => t.status !== "COMPLETED").length,
        completed: propTickets.filter((t) => t.status === "COMPLETED").length,
      };
    })
    .sort((a, b) => b.total - a.total);

  // ── Technician Workload (always all technicians, unfiltered) ─────────────
  const technicianWorkload = technicians
    .map((tech) => ({
      name: tech.name,
      active: allTickets.filter(
        (t) =>
          t.assigneeId === tech.id &&
          ["ASSIGNED", "IN_PROGRESS"].includes(t.status)
      ).length,
      completed: allTickets.filter(
        (t) => t.assigneeId === tech.id && t.status === "COMPLETED"
      ).length,
    }))
    .sort(
      (a, b) => b.active + b.completed - (a.active + a.completed)
    );

  return {
    summary: { total, active, completedInRange, urgentOpen, avgResolutionDays },
    byStatus,
    byPriority,
    byCategory,
    monthlyTrend,
    byProperty,
    technicianWorkload,
    properties,
    technicians,
  };
}
