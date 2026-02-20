import { describe, it, expect, vi, beforeEach } from "vitest";
import { requireAuth, requireRole } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Mock rate limiter -- always allow
vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn().mockResolvedValue({ success: true, remaining: 10 }),
}));

import {
  createTicket,
  getTickets,
  getTicketById,
  assignTicket,
  updateTicketStatus,
  updateTicketPriority,
  getDashboardStats,
} from "@/actions/tickets";
import { createMockUser, createMockFormData, createMockTicket } from "../helpers";

const mockRequireAuth = vi.mocked(requireAuth);
const mockRequireRole = vi.mocked(requireRole);
const mockPrisma = vi.mocked(prisma, true);
const mockRevalidatePath = vi.mocked(revalidatePath);

describe("tickets actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default $transaction mock: handles both callback and array styles
    mockPrisma.$transaction.mockImplementation(async (input: unknown) => {
      if (typeof input === "function") {
        // Callback-style transaction: pass a mock tx that delegates to mockPrisma
        return input(mockPrisma);
      }
      // Array-style transaction: resolve the promises (they are already mocked)
      return Promise.all(input as Promise<unknown>[]);
    });
  });

  describe("createTicket", () => {
    const tenant = createMockUser({ id: "tenant-1", role: "TENANT", name: "Sarah" });

    beforeEach(() => {
      mockRequireRole.mockResolvedValue(tenant);
      mockPrisma.maintenanceTicket.create.mockResolvedValue(
        createMockTicket({ id: "new-ticket-1" }) as never
      );
      mockPrisma.ticketActivityLog.create.mockResolvedValue({} as never);
      mockPrisma.user.findMany.mockResolvedValue([] as never);
      mockPrisma.notification.create.mockResolvedValue({} as never);
    });

    it("creates ticket with valid data", async () => {
      const formData = createMockFormData({
        title: "Leaking faucet",
        description: "The kitchen faucet has been dripping for days",
        propertyId: "prop-1",
        category: "PLUMBING",
        priority: "HIGH",
      });

      const result = await createTicket(formData);

      expect(result).toEqual({ success: true, ticketId: "new-ticket-1" });
      expect(mockPrisma.maintenanceTicket.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: "Leaking faucet",
          description: "The kitchen faucet has been dripping for days",
          propertyId: "prop-1",
          category: "PLUMBING",
          priority: "HIGH",
          submitterId: "tenant-1",
        }),
      });
    });

    it("returns validation error for short title", async () => {
      const formData = createMockFormData({
        title: "ab",
        description: "A valid description that is long enough",
        propertyId: "prop-1",
        category: "PLUMBING",
      });

      const result = await createTicket(formData);

      expect(result).toEqual({ error: expect.stringContaining("3") });
      expect(mockPrisma.maintenanceTicket.create).not.toHaveBeenCalled();
    });

    it("returns validation error for short description", async () => {
      const formData = createMockFormData({
        title: "Valid Title",
        description: "short",
        propertyId: "prop-1",
        category: "PLUMBING",
      });

      const result = await createTicket(formData);

      expect(result).toEqual({ error: expect.stringContaining("10") });
    });

    it("creates activity log entry", async () => {
      const formData = createMockFormData({
        title: "Fix the sink",
        description: "The bathroom sink is clogged badly",
        propertyId: "prop-1",
        category: "PLUMBING",
      });

      await createTicket(formData);

      expect(mockPrisma.ticketActivityLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ticketId: "new-ticket-1",
          performedBy: "tenant-1",
          action: "CREATED",
        }),
      });
    });

    it("notifies all managers", async () => {
      mockPrisma.user.findMany.mockResolvedValue([
        { id: "mgr-1" },
        { id: "mgr-2" },
      ] as never);

      const formData = createMockFormData({
        title: "Fix the door",
        description: "The front door lock is broken completely",
        propertyId: "prop-1",
        category: "STRUCTURAL",
      });

      await createTicket(formData);

      expect(mockPrisma.notification.create).toHaveBeenCalledTimes(2);
    });

    it("calls revalidatePath", async () => {
      const formData = createMockFormData({
        title: "Fix the light",
        description: "The hallway light stopped working entirely",
        propertyId: "prop-1",
        category: "ELECTRICAL",
      });

      await createTicket(formData);

      expect(mockRevalidatePath).toHaveBeenCalledWith("/tickets");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
    });
  });

  describe("getTickets", () => {
    beforeEach(() => {
      mockPrisma.maintenanceTicket.findMany.mockResolvedValue([] as never);
      mockPrisma.maintenanceTicket.count.mockResolvedValue(0 as never);
    });

    it("TENANT sees only own tickets", async () => {
      mockRequireAuth.mockResolvedValue(
        createMockUser({ id: "t1", role: "TENANT" })
      );

      await getTickets();

      expect(mockPrisma.maintenanceTicket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ submitterId: "t1" }),
        })
      );
    });

    it("TECHNICIAN sees only assigned tickets", async () => {
      mockRequireAuth.mockResolvedValue(
        createMockUser({ id: "tech1", role: "TECHNICIAN" })
      );

      await getTickets();

      expect(mockPrisma.maintenanceTicket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ assigneeId: "tech1" }),
        })
      );
    });

    it("MANAGER sees all tickets", async () => {
      mockRequireAuth.mockResolvedValue(
        createMockUser({ id: "mgr1", role: "MANAGER" })
      );

      await getTickets();

      const call = mockPrisma.maintenanceTicket.findMany.mock.calls[0][0];
      expect(call?.where).not.toHaveProperty("submitterId");
      expect(call?.where).not.toHaveProperty("assigneeId");
    });

    it("applies status filter", async () => {
      mockRequireAuth.mockResolvedValue(
        createMockUser({ role: "MANAGER" })
      );

      await getTickets({ status: "OPEN" });

      expect(mockPrisma.maintenanceTicket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: "OPEN" }),
        })
      );
    });

    it("applies priority filter", async () => {
      mockRequireAuth.mockResolvedValue(
        createMockUser({ role: "MANAGER" })
      );

      await getTickets({ priority: "HIGH" });

      expect(mockPrisma.maintenanceTicket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ priority: "HIGH" }),
        })
      );
    });

    it("applies search filter with OR clause", async () => {
      mockRequireAuth.mockResolvedValue(
        createMockUser({ role: "MANAGER" })
      );

      await getTickets({ search: "leak" });

      expect(mockPrisma.maintenanceTicket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { title: { contains: "leak" } },
              { description: { contains: "leak" } },
            ],
          }),
        })
      );
    });
  });

  describe("getTicketById", () => {
    const ticketWithRelations = {
      ...createMockTicket({ id: "t1", submitterId: "sub-1", assigneeId: "tech-1" }),
      property: { name: "Test Prop", address: "123 Street" },
      submitter: { id: "sub-1", name: "Sarah", email: "s@t.com", role: "TENANT" },
      assignee: { id: "tech-1", name: "John", email: "j@t.com", role: "TECHNICIAN" },
      activityLog: [],
      comments: [],
      attachments: [],
    };

    it("returns ticket for MANAGER regardless of ownership", async () => {
      mockRequireAuth.mockResolvedValue(
        createMockUser({ id: "mgr-1", role: "MANAGER" })
      );
      mockPrisma.maintenanceTicket.findUnique.mockResolvedValue(
        ticketWithRelations as never
      );

      const result = await getTicketById("t1");

      expect(result).not.toBeNull();
    });

    it("TENANT can see own ticket", async () => {
      mockRequireAuth.mockResolvedValue(
        createMockUser({ id: "sub-1", role: "TENANT" })
      );
      mockPrisma.maintenanceTicket.findUnique.mockResolvedValue(
        ticketWithRelations as never
      );

      const result = await getTicketById("t1");

      expect(result).not.toBeNull();
    });

    it("TENANT cannot see others' tickets", async () => {
      mockRequireAuth.mockResolvedValue(
        createMockUser({ id: "other-tenant", role: "TENANT" })
      );
      mockPrisma.maintenanceTicket.findUnique.mockResolvedValue(
        ticketWithRelations as never
      );

      const result = await getTicketById("t1");

      expect(result).toBeNull();
    });

    it("TECHNICIAN can see assigned ticket", async () => {
      mockRequireAuth.mockResolvedValue(
        createMockUser({ id: "tech-1", role: "TECHNICIAN" })
      );
      mockPrisma.maintenanceTicket.findUnique.mockResolvedValue(
        ticketWithRelations as never
      );

      const result = await getTicketById("t1");

      expect(result).not.toBeNull();
    });

    it("TECHNICIAN cannot see unassigned tickets", async () => {
      mockRequireAuth.mockResolvedValue(
        createMockUser({ id: "other-tech", role: "TECHNICIAN" })
      );
      mockPrisma.maintenanceTicket.findUnique.mockResolvedValue(
        ticketWithRelations as never
      );

      const result = await getTicketById("t1");

      expect(result).toBeNull();
    });

    it("returns null for non-existent ticket", async () => {
      mockRequireAuth.mockResolvedValue(
        createMockUser({ role: "MANAGER" })
      );
      mockPrisma.maintenanceTicket.findUnique.mockResolvedValue(null);

      const result = await getTicketById("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("assignTicket", () => {
    const manager = createMockUser({ id: "mgr-1", role: "MANAGER" });

    beforeEach(() => {
      mockRequireRole.mockResolvedValue(manager);
      mockPrisma.maintenanceTicket.findUnique.mockResolvedValue(
        createMockTicket({ id: "t1", title: "Fix sink" }) as never
      );
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "tech-1",
        name: "John Tech",
        role: "TECHNICIAN",
      } as never);
      mockPrisma.maintenanceTicket.update.mockResolvedValue({} as never);
      mockPrisma.ticketActivityLog.create.mockResolvedValue({} as never);
      mockPrisma.notification.create.mockResolvedValue({} as never);
    });

    it("assigns technician successfully", async () => {
      const result = await assignTicket("t1", "tech-1");

      expect(result).toEqual({ success: true });
      expect(mockPrisma.maintenanceTicket.update).toHaveBeenCalledWith({
        where: { id: "t1" },
        data: { assigneeId: "tech-1", status: "ASSIGNED" },
      });
    });

    it("returns error if ticket not found", async () => {
      mockPrisma.maintenanceTicket.findUnique.mockResolvedValue(null);

      const result = await assignTicket("nonexistent", "tech-1");

      expect(result).toEqual({ error: "Ticket not found" });
    });

    it("returns error if technician not found", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await assignTicket("t1", "bad-tech");

      expect(result).toEqual({ error: "Technician not found" });
    });

    it("creates activity log", async () => {
      await assignTicket("t1", "tech-1");

      expect(mockPrisma.ticketActivityLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ticketId: "t1",
          performedBy: "mgr-1",
          action: "ASSIGNED",
        }),
      });
    });

    it("sends notification to technician", async () => {
      await assignTicket("t1", "tech-1");

      expect(mockPrisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: "tech-1",
            type: "TICKET_ASSIGNED",
          }),
        })
      );
    });

    it("rejects assigning a COMPLETED ticket", async () => {
      mockPrisma.maintenanceTicket.findUnique.mockResolvedValue(
        createMockTicket({ id: "t1", status: "COMPLETED" }) as never
      );

      const result = await assignTicket("t1", "tech-1");

      expect(result).toEqual({ error: "Cannot assign completed tickets" });
      expect(mockPrisma.maintenanceTicket.update).not.toHaveBeenCalled();
    });

    it("notifies old assignee on reassignment", async () => {
      mockPrisma.maintenanceTicket.findUnique.mockResolvedValue(
        createMockTicket({ id: "t1", title: "Fix sink", assigneeId: "old-tech" }) as never
      );
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "new-tech",
        name: "New Tech",
        role: "TECHNICIAN",
      } as never);

      await assignTicket("t1", "new-tech");

      expect(mockPrisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: "old-tech",
            type: "TICKET_ASSIGNED",
          }),
        })
      );
    });

    it("logs previous assignee in activity details", async () => {
      mockPrisma.maintenanceTicket.findUnique.mockResolvedValue(
        createMockTicket({ id: "t1", title: "Fix sink", assigneeId: "old-tech" }) as never
      );
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "new-tech",
        name: "New Tech",
        role: "TECHNICIAN",
      } as never);

      await assignTicket("t1", "new-tech");

      expect(mockPrisma.ticketActivityLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ticketId: "t1",
          action: "ASSIGNED",
          details: expect.stringContaining('"previousAssigneeId":"old-tech"'),
        }),
      });
    });
  });

  describe("updateTicketStatus", () => {
    const manager = createMockUser({ id: "mgr-1", role: "MANAGER", name: "Manager" });
    const ticketOpen = {
      ...createMockTicket({ id: "t1", status: "OPEN", title: "Test" }),
      submitter: { id: "sub-1" },
    };
    const ticketInProgress = {
      ...createMockTicket({ id: "t2", status: "IN_PROGRESS", assigneeId: "tech-1" }),
      submitter: { id: "sub-1" },
    };
    const ticketAssigned = {
      ...createMockTicket({ id: "t3", status: "ASSIGNED", assigneeId: "tech-1" }),
      submitter: { id: "sub-1" },
    };

    beforeEach(() => {
      mockRequireAuth.mockResolvedValue(manager);
      mockPrisma.maintenanceTicket.update.mockResolvedValue({} as never);
      mockPrisma.ticketActivityLog.create.mockResolvedValue({} as never);
      mockPrisma.notification.create.mockResolvedValue({} as never);
    });

    it("allows valid transition OPEN -> ASSIGNED (with assignee)", async () => {
      const ticketOpenWithAssignee = {
        ...createMockTicket({ id: "t1", status: "OPEN", title: "Test", assigneeId: "tech-1" }),
        submitter: { id: "sub-1" },
      };
      mockPrisma.maintenanceTicket.findUnique.mockResolvedValue(
        ticketOpenWithAssignee as never
      );

      const result = await updateTicketStatus("t1", "ASSIGNED");

      expect(result).toEqual({ success: true });
    });

    it("allows IN_PROGRESS -> COMPLETED and sets completedAt", async () => {
      mockPrisma.maintenanceTicket.findUnique.mockResolvedValue(
        ticketInProgress as never
      );

      const result = await updateTicketStatus("t2", "COMPLETED");

      expect(result).toEqual({ success: true });
      expect(mockPrisma.maintenanceTicket.update).toHaveBeenCalledWith({
        where: { id: "t2" },
        data: expect.objectContaining({
          status: "COMPLETED",
          completedAt: expect.any(Date),
        }),
      });
    });

    it("rejects invalid transition OPEN -> COMPLETED", async () => {
      mockPrisma.maintenanceTicket.findUnique.mockResolvedValue(
        ticketOpen as never
      );

      const result = await updateTicketStatus("t1", "COMPLETED");

      expect(result).toEqual({
        error: "Cannot transition from OPEN to COMPLETED",
      });
    });

    it("rejects invalid transition OPEN -> IN_PROGRESS", async () => {
      mockPrisma.maintenanceTicket.findUnique.mockResolvedValue(
        ticketOpen as never
      );

      const result = await updateTicketStatus("t1", "IN_PROGRESS");

      expect(result).toEqual({
        error: "Cannot transition from OPEN to IN_PROGRESS",
      });
    });

    it("TECHNICIAN can update own assigned ticket", async () => {
      mockRequireAuth.mockResolvedValue(
        createMockUser({ id: "tech-1", role: "TECHNICIAN" })
      );
      mockPrisma.maintenanceTicket.findUnique.mockResolvedValue(
        ticketAssigned as never
      );

      const result = await updateTicketStatus("t3", "IN_PROGRESS");

      expect(result).toEqual({ success: true });
    });

    it("TECHNICIAN cannot update others' tickets", async () => {
      mockRequireAuth.mockResolvedValue(
        createMockUser({ id: "other-tech", role: "TECHNICIAN" })
      );
      mockPrisma.maintenanceTicket.findUnique.mockResolvedValue(
        ticketAssigned as never
      );

      const result = await updateTicketStatus("t3", "IN_PROGRESS");

      expect(result).toEqual({ error: "Not your ticket" });
    });

    it("TECHNICIAN restricted to IN_PROGRESS, COMPLETED, ASSIGNED transitions", async () => {
      mockRequireAuth.mockResolvedValue(
        createMockUser({ id: "tech-1", role: "TECHNICIAN" })
      );
      // ASSIGNED can go to OPEN, but TECHNICIAN can't use that transition
      mockPrisma.maintenanceTicket.findUnique.mockResolvedValue(
        ticketAssigned as never
      );

      const result = await updateTicketStatus("t3", "OPEN");

      expect(result).toEqual({
        error: "Technicians can only start, complete, or pause work",
      });
    });

    it("returns error for non-existent ticket", async () => {
      mockPrisma.maintenanceTicket.findUnique.mockResolvedValue(null);

      const result = await updateTicketStatus("nonexistent", "ASSIGNED");

      expect(result).toEqual({ error: "Ticket not found" });
    });

    it("notifies submitter when different from updater", async () => {
      const ticketOpenWithAssignee = {
        ...createMockTicket({ id: "t1", status: "OPEN", title: "Test", assigneeId: "tech-1" }),
        submitter: { id: "sub-1" },
      };
      mockPrisma.maintenanceTicket.findUnique.mockResolvedValue(
        ticketOpenWithAssignee as never
      );

      await updateTicketStatus("t1", "ASSIGNED");

      expect(mockPrisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: "sub-1",
            type: "STATUS_CHANGED",
          }),
        })
      );
    });

    it("does NOT notify submitter when they are the updater", async () => {
      mockRequireAuth.mockResolvedValue(
        createMockUser({ id: "sub-1", role: "MANAGER" })
      );
      const ticketOpenWithAssignee = {
        ...createMockTicket({ id: "t1", status: "OPEN", title: "Test", assigneeId: "tech-1" }),
        submitter: { id: "sub-1" },
      };
      mockPrisma.maintenanceTicket.findUnique.mockResolvedValue(
        ticketOpenWithAssignee as never
      );

      await updateTicketStatus("t1", "ASSIGNED");

      expect(mockPrisma.notification.create).not.toHaveBeenCalled();
    });

    it("rejects invalid status enum value", async () => {
      mockPrisma.maintenanceTicket.findUnique.mockResolvedValue(
        ticketOpen as never
      );

      const result = await updateTicketStatus("t1", "INVALID_STATUS");

      expect(result).toEqual({ error: "Invalid status" });
    });

    it("clears assigneeId when transitioning to OPEN", async () => {
      mockPrisma.maintenanceTicket.findUnique.mockResolvedValue(
        ticketAssigned as never
      );

      await updateTicketStatus("t3", "OPEN");

      expect(mockPrisma.maintenanceTicket.update).toHaveBeenCalledWith({
        where: { id: "t3" },
        data: expect.objectContaining({
          status: "OPEN",
          assigneeId: null,
        }),
      });
    });

    it("clears completedAt when moving away from COMPLETED", async () => {
      const ticketCompleted = {
        ...createMockTicket({
          id: "t4",
          status: "COMPLETED",
          completedAt: new Date("2024-06-01"),
          assigneeId: "tech-1",
        }),
        submitter: { id: "sub-1" },
      };
      mockPrisma.maintenanceTicket.findUnique.mockResolvedValue(
        ticketCompleted as never
      );

      await updateTicketStatus("t4", "IN_PROGRESS");

      expect(mockPrisma.maintenanceTicket.update).toHaveBeenCalledWith({
        where: { id: "t4" },
        data: expect.objectContaining({
          status: "IN_PROGRESS",
          completedAt: null,
        }),
      });
    });

    it("blocks technician from reopening COMPLETED ticket", async () => {
      mockRequireAuth.mockResolvedValue(
        createMockUser({ id: "tech-1", role: "TECHNICIAN" })
      );
      const ticketCompleted = {
        ...createMockTicket({
          id: "t1",
          status: "COMPLETED",
          assigneeId: "tech-1",
        }),
        submitter: { id: "sub-1" },
      };
      mockPrisma.maintenanceTicket.findUnique.mockResolvedValue(
        ticketCompleted as never
      );

      const result = await updateTicketStatus("t1", "IN_PROGRESS");

      expect(result).toEqual({ error: "Only managers can reopen completed tickets" });
    });
  });

  describe("updateTicketPriority", () => {
    const manager = createMockUser({ id: "mgr-1", role: "MANAGER" });

    beforeEach(() => {
      mockRequireRole.mockResolvedValue(manager);
      mockPrisma.ticketActivityLog.create.mockResolvedValue({} as never);
    });

    it("updates priority successfully", async () => {
      mockPrisma.maintenanceTicket.findUnique.mockResolvedValue(
        createMockTicket({ id: "t1", priority: "LOW" }) as never
      );
      mockPrisma.maintenanceTicket.update.mockResolvedValue({} as never);

      const result = await updateTicketPriority("t1", "URGENT");

      expect(result).toEqual({ success: true });
      expect(mockPrisma.maintenanceTicket.update).toHaveBeenCalledWith({
        where: { id: "t1" },
        data: { priority: "URGENT" },
      });
    });

    it("returns error for non-existent ticket", async () => {
      mockPrisma.maintenanceTicket.findUnique.mockResolvedValue(null);

      const result = await updateTicketPriority("nonexistent", "HIGH");

      expect(result).toEqual({ error: "Ticket not found" });
    });

    it("creates activity log with from/to details", async () => {
      mockPrisma.maintenanceTicket.findUnique.mockResolvedValue(
        createMockTicket({ priority: "LOW" }) as never
      );
      mockPrisma.maintenanceTicket.update.mockResolvedValue({} as never);

      await updateTicketPriority("t1", "HIGH");

      expect(mockPrisma.ticketActivityLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: "PRIORITY_CHANGED",
          details: JSON.stringify({ from: "LOW", to: "HIGH" }),
        }),
      });
    });

    it("rejects invalid priority enum value", async () => {
      mockPrisma.maintenanceTicket.findUnique.mockResolvedValue(
        createMockTicket({ id: "t1" }) as never
      );

      const result = await updateTicketPriority("t1", "SUPER_HIGH");

      expect(result).toEqual({ error: "Invalid priority" });
    });

    it("rejects priority change on COMPLETED ticket", async () => {
      mockPrisma.maintenanceTicket.findUnique.mockResolvedValue(
        createMockTicket({ id: "t1", status: "COMPLETED" }) as never
      );

      const result = await updateTicketPriority("t1", "HIGH");

      expect(result).toEqual({ error: "Cannot change priority on completed tickets" });
    });
  });

  describe("getDashboardStats", () => {
    beforeEach(() => {
      mockPrisma.maintenanceTicket.count.mockResolvedValue(0 as never);
      mockPrisma.maintenanceTicket.findMany.mockResolvedValue([] as never);
    });

    it("TENANT gets stats filtered by submitterId", async () => {
      mockRequireAuth.mockResolvedValue(
        createMockUser({ id: "t1", role: "TENANT" })
      );

      await getDashboardStats();

      // All count calls should include submitterId
      for (const call of mockPrisma.maintenanceTicket.count.mock.calls) {
        expect(call[0]?.where).toHaveProperty("submitterId", "t1");
      }
    });

    it("TECHNICIAN gets stats filtered by assigneeId", async () => {
      mockRequireAuth.mockResolvedValue(
        createMockUser({ id: "tech-1", role: "TECHNICIAN" })
      );

      await getDashboardStats();

      for (const call of mockPrisma.maintenanceTicket.count.mock.calls) {
        expect(call[0]?.where).toHaveProperty("assigneeId", "tech-1");
      }
    });

    it("MANAGER gets unfiltered stats", async () => {
      mockRequireAuth.mockResolvedValue(
        createMockUser({ id: "mgr-1", role: "MANAGER" })
      );

      await getDashboardStats();

      for (const call of mockPrisma.maintenanceTicket.count.mock.calls) {
        expect(call[0]?.where).not.toHaveProperty("submitterId");
        expect(call[0]?.where).not.toHaveProperty("assigneeId");
      }
    });

    it("returns correct shape", async () => {
      mockRequireAuth.mockResolvedValue(
        createMockUser({ role: "MANAGER" })
      );
      mockPrisma.maintenanceTicket.count
        .mockResolvedValueOnce(3 as never)  // open
        .mockResolvedValueOnce(2 as never)  // assigned
        .mockResolvedValueOnce(1 as never)  // inProgress
        .mockResolvedValueOnce(5 as never); // completed
      mockPrisma.maintenanceTicket.findMany.mockResolvedValue([
        { id: "t1" },
      ] as never);

      const result = await getDashboardStats();

      expect(result).toEqual({
        open: 3,
        assigned: 2,
        inProgress: 1,
        completed: 5,
        recentTickets: [{ id: "t1" }],
      });
    });
  });
});
