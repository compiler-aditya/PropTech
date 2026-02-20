import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockPrisma } from "../setup";
import { requireRole } from "@/lib/auth-utils";
import { getAnalyticsData } from "@/actions/analytics";

function createTicket(overrides: Record<string, unknown> = {}) {
  return {
    id: "t-1",
    status: "OPEN",
    priority: "MEDIUM",
    category: "OTHER",
    propertyId: "prop-1",
    assigneeId: null,
    createdAt: new Date("2026-02-01"),
    completedAt: null,
    ...overrides,
  };
}

describe("getAnalyticsData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireRole).mockResolvedValue(undefined as never);
  });

  it("requires MANAGER role", async () => {
    mockPrisma.maintenanceTicket.findMany.mockResolvedValue([]);
    mockPrisma.property.findMany.mockResolvedValue([]);
    mockPrisma.user.findMany.mockResolvedValue([]);

    await getAnalyticsData();
    expect(requireRole).toHaveBeenCalledWith(["MANAGER"]);
  });

  it("returns correct summary shape", async () => {
    mockPrisma.maintenanceTicket.findMany.mockResolvedValue([
      createTicket({ id: "t-1", status: "OPEN" }),
      createTicket({ id: "t-2", status: "ASSIGNED", assigneeId: "tech-1" }),
      createTicket({
        id: "t-3",
        status: "COMPLETED",
        completedAt: new Date("2026-02-10"),
        createdAt: new Date("2026-02-05"),
      }),
    ]);
    mockPrisma.property.findMany.mockResolvedValue([]);
    mockPrisma.user.findMany.mockResolvedValue([]);

    const result = await getAnalyticsData();

    expect(result.summary.total).toBe(3);
    expect(result.summary.active).toBe(2);
    expect(result.summary.urgentOpen).toBe(0);
    expect(result.summary.avgResolutionDays).toBeTypeOf("number");
    expect(result).toHaveProperty("byStatus");
    expect(result).toHaveProperty("byPriority");
    expect(result).toHaveProperty("byCategory");
    expect(result).toHaveProperty("monthlyTrend");
    expect(result).toHaveProperty("byProperty");
    expect(result).toHaveProperty("technicianWorkload");
  });

  it("calculates avg resolution days correctly", async () => {
    mockPrisma.maintenanceTicket.findMany.mockResolvedValue([
      createTicket({
        id: "t-1",
        status: "COMPLETED",
        createdAt: new Date("2026-02-01"),
        completedAt: new Date("2026-02-03"), // 2 days
      }),
      createTicket({
        id: "t-2",
        status: "COMPLETED",
        createdAt: new Date("2026-02-01"),
        completedAt: new Date("2026-02-05"), // 4 days
      }),
    ]);
    mockPrisma.property.findMany.mockResolvedValue([]);
    mockPrisma.user.findMany.mockResolvedValue([]);

    const result = await getAnalyticsData();
    // (2 + 4) / 2 = 3
    expect(result.summary.avgResolutionDays).toBe(3);
  });

  it("returns null avgResolutionDays when no completed tickets", async () => {
    mockPrisma.maintenanceTicket.findMany.mockResolvedValue([
      createTicket({ status: "OPEN" }),
    ]);
    mockPrisma.property.findMany.mockResolvedValue([]);
    mockPrisma.user.findMany.mockResolvedValue([]);

    const result = await getAnalyticsData();
    expect(result.summary.avgResolutionDays).toBeNull();
  });

  it("counts urgent open tickets", async () => {
    mockPrisma.maintenanceTicket.findMany.mockResolvedValue([
      createTicket({ priority: "URGENT", status: "OPEN" }),
      createTicket({ priority: "URGENT", status: "COMPLETED", completedAt: new Date() }),
      createTicket({ priority: "HIGH", status: "OPEN" }),
    ]);
    mockPrisma.property.findMany.mockResolvedValue([]);
    mockPrisma.user.findMany.mockResolvedValue([]);

    const result = await getAnalyticsData();
    expect(result.summary.urgentOpen).toBe(1);
  });

  it("filters tickets by propertyId", async () => {
    mockPrisma.maintenanceTicket.findMany.mockResolvedValue([
      createTicket({ id: "t-1", propertyId: "prop-1" }),
      createTicket({ id: "t-2", propertyId: "prop-2" }),
      createTicket({ id: "t-3", propertyId: "prop-1" }),
    ]);
    mockPrisma.property.findMany.mockResolvedValue([]);
    mockPrisma.user.findMany.mockResolvedValue([]);

    const result = await getAnalyticsData({ propertyId: "prop-1" });
    expect(result.summary.total).toBe(2);
  });

  it("filters tickets by technicianId", async () => {
    mockPrisma.maintenanceTicket.findMany.mockResolvedValue([
      createTicket({ id: "t-1", assigneeId: "tech-1" }),
      createTicket({ id: "t-2", assigneeId: "tech-2" }),
      createTicket({ id: "t-3", assigneeId: "tech-1" }),
    ]);
    mockPrisma.property.findMany.mockResolvedValue([]);
    mockPrisma.user.findMany.mockResolvedValue([]);

    const result = await getAnalyticsData({ technicianId: "tech-1" });
    expect(result.summary.total).toBe(2);
  });

  it("byStatus covers all 4 statuses", async () => {
    mockPrisma.maintenanceTicket.findMany.mockResolvedValue([]);
    mockPrisma.property.findMany.mockResolvedValue([]);
    mockPrisma.user.findMany.mockResolvedValue([]);

    const result = await getAnalyticsData();
    const statuses = result.byStatus.map((s) => s.status);
    expect(statuses).toContain("OPEN");
    expect(statuses).toContain("ASSIGNED");
    expect(statuses).toContain("IN_PROGRESS");
    expect(statuses).toContain("COMPLETED");
  });

  it("byPriority covers all 4 priorities", async () => {
    mockPrisma.maintenanceTicket.findMany.mockResolvedValue([]);
    mockPrisma.property.findMany.mockResolvedValue([]);
    mockPrisma.user.findMany.mockResolvedValue([]);

    const result = await getAnalyticsData();
    const priorities = result.byPriority.map((p) => p.priority);
    expect(priorities).toContain("LOW");
    expect(priorities).toContain("MEDIUM");
    expect(priorities).toContain("HIGH");
    expect(priorities).toContain("URGENT");
  });

  it("byCategory only includes categories with count > 0", async () => {
    mockPrisma.maintenanceTicket.findMany.mockResolvedValue([
      createTicket({ category: "PLUMBING" }),
      createTicket({ category: "PLUMBING" }),
      createTicket({ category: "ELECTRICAL" }),
    ]);
    mockPrisma.property.findMany.mockResolvedValue([]);
    mockPrisma.user.findMany.mockResolvedValue([]);

    const result = await getAnalyticsData();
    expect(result.byCategory.length).toBe(2);
    expect(result.byCategory[0].category).toBe("PLUMBING");
    expect(result.byCategory[0].count).toBe(2);
  });

  it("byProperty uses allTickets (unfiltered) for property breakdown", async () => {
    mockPrisma.maintenanceTicket.findMany.mockResolvedValue([
      createTicket({ id: "t-1", propertyId: "prop-1", assigneeId: "tech-1" }),
      createTicket({ id: "t-2", propertyId: "prop-2", assigneeId: "tech-2" }),
    ]);
    mockPrisma.property.findMany.mockResolvedValue([
      { id: "prop-1", name: "Building A" },
      { id: "prop-2", name: "Building B" },
    ]);
    mockPrisma.user.findMany.mockResolvedValue([]);

    // Filter to tech-1 — summary should be 1, but byProperty should show both
    const result = await getAnalyticsData({ technicianId: "tech-1" });
    expect(result.summary.total).toBe(1);
    expect(result.byProperty.length).toBe(2);
  });

  it("technicianWorkload uses allTickets (unfiltered)", async () => {
    mockPrisma.maintenanceTicket.findMany.mockResolvedValue([
      createTicket({ assigneeId: "tech-1", status: "ASSIGNED", propertyId: "prop-1" }),
      createTicket({ assigneeId: "tech-1", status: "COMPLETED", completedAt: new Date(), propertyId: "prop-2" }),
    ]);
    mockPrisma.property.findMany.mockResolvedValue([]);
    mockPrisma.user.findMany.mockResolvedValue([
      { id: "tech-1", name: "John Smith" },
    ]);

    const result = await getAnalyticsData({ propertyId: "prop-1" });
    // Workload should include both tickets (unfiltered)
    expect(result.technicianWorkload[0].active).toBe(1);
    expect(result.technicianWorkload[0].completed).toBe(1);
  });

  it("monthlyTrend returns 6 months", async () => {
    mockPrisma.maintenanceTicket.findMany.mockResolvedValue([]);
    mockPrisma.property.findMany.mockResolvedValue([]);
    mockPrisma.user.findMany.mockResolvedValue([]);

    const result = await getAnalyticsData();
    expect(result.monthlyTrend).toHaveLength(6);
    result.monthlyTrend.forEach((m) => {
      expect(m).toHaveProperty("month");
      expect(m).toHaveProperty("created");
      expect(m).toHaveProperty("completed");
    });
  });

  it("returns properties and technicians lists", async () => {
    mockPrisma.maintenanceTicket.findMany.mockResolvedValue([]);
    mockPrisma.property.findMany.mockResolvedValue([
      { id: "p1", name: "Apt A" },
    ]);
    mockPrisma.user.findMany.mockResolvedValue([
      { id: "t1", name: "Tech 1" },
    ]);

    const result = await getAnalyticsData();
    expect(result.properties).toHaveLength(1);
    expect(result.technicians).toHaveLength(1);
  });
});
