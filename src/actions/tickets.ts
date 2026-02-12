"use server";

import prisma from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth-utils";
import { createTicketSchema } from "@/lib/validations/ticket";
import { VALID_TRANSITIONS, ROLES, TICKET_STATUS, TICKET_PRIORITY } from "@/lib/constants";
import type { TicketStatus, TicketPriority } from "@/lib/constants";
import { createNotification } from "./notifications";
import { rateLimit } from "@/lib/rate-limit";
import { revalidatePath } from "next/cache";

export async function createTicket(formData: FormData) {
  const user = await requireRole(["TENANT"]);

  const rl = rateLimit(`ticket:${user.id}`, { maxAttempts: 10, windowMs: 60 * 60 * 1000 });
  if (!rl.success) return { error: "Too many tickets. Please try again later." };

  const raw = {
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    propertyId: formData.get("propertyId") as string,
    unitNumber: (formData.get("unitNumber") as string) || undefined,
    category: formData.get("category") as string,
    priority: (formData.get("priority") as string) || "MEDIUM",
  };

  const parsed = createTicketSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const ticket = await prisma.maintenanceTicket.create({
    data: {
      ...parsed.data,
      submitterId: user.id,
    },
  });

  await prisma.ticketActivityLog.create({
    data: {
      ticketId: ticket.id,
      performedBy: user.id,
      action: "CREATED",
      details: JSON.stringify({ title: ticket.title }),
    },
  });

  // Notify managers
  const managers = await prisma.user.findMany({
    where: { role: ROLES.MANAGER },
    select: { id: true },
  });
  await Promise.all(
    managers.map((manager) =>
      createNotification(
        manager.id,
        "New Ticket Created",
        `${user.name} submitted: ${ticket.title}`,
        "TICKET_CREATED",
        `/tickets/${ticket.id}`
      )
    )
  );

  revalidatePath("/tickets");
  revalidatePath("/dashboard");
  return { success: true, ticketId: ticket.id };
}

export async function getTickets(filters?: {
  status?: string;
  priority?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const user = await requireAuth();

  const rawPage = Number(filters?.page);
  const rawPageSize = Number(filters?.pageSize);
  const page = Math.max(1, Number.isFinite(rawPage) ? Math.floor(rawPage) : 1);
  const pageSize = Math.min(50, Math.max(1, Number.isFinite(rawPageSize) ? Math.floor(rawPageSize) : 20));

  const where: Record<string, unknown> = {};

  // Role-based filtering
  if (user.role === ROLES.TENANT) {
    where.submitterId = user.id;
  } else if (user.role === ROLES.TECHNICIAN) {
    where.assigneeId = user.id;
  }

  if (filters?.status) where.status = filters.status;
  if (filters?.priority) where.priority = filters.priority;
  if (filters?.search) {
    const search = filters.search.slice(0, 100);
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
    ];
  }

  const [tickets, total] = await Promise.all([
    prisma.maintenanceTicket.findMany({
      where,
      include: {
        property: { select: { name: true } },
        submitter: { select: { name: true } },
        assignee: { select: { name: true } },
        _count: { select: { comments: true, attachments: true } },
      },
      orderBy: { createdAt: "desc" },
      take: pageSize,
      skip: (page - 1) * pageSize,
    }),
    prisma.maintenanceTicket.count({ where }),
  ]);

  return { tickets, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getTicketById(id: string) {
  const user = await requireAuth();

  const ticket = await prisma.maintenanceTicket.findUnique({
    where: { id },
    include: {
      property: { select: { name: true, address: true } },
      submitter: { select: { id: true, name: true, email: true, role: true } },
      assignee: { select: { id: true, name: true, email: true, role: true } },
      activityLog: {
        include: { user: { select: { name: true, role: true } } },
        orderBy: { createdAt: "asc" },
      },
      comments: {
        include: { author: { select: { name: true, role: true } } },
        orderBy: { createdAt: "asc" },
      },
      attachments: true,
    },
  });

  if (!ticket) return null;

  // Access control
  if (
    user.role === ROLES.TENANT &&
    ticket.submitterId !== user.id
  ) {
    return null;
  }
  if (
    user.role === ROLES.TECHNICIAN &&
    ticket.assigneeId !== user.id
  ) {
    return null;
  }

  return ticket;
}

export async function assignTicket(ticketId: string, technicianId: string) {
  const user = await requireRole(["MANAGER"]);

  const ticket = await prisma.maintenanceTicket.findUnique({
    where: { id: ticketId },
  });
  if (!ticket) return { error: "Ticket not found" };
  if (ticket.status === "COMPLETED") return { error: "Cannot assign completed tickets" };

  const technician = await prisma.user.findUnique({
    where: { id: technicianId, role: ROLES.TECHNICIAN },
  });
  if (!technician) return { error: "Technician not found" };

  const oldAssigneeId = ticket.assigneeId;

  await prisma.maintenanceTicket.update({
    where: { id: ticketId },
    data: { assigneeId: technicianId, status: "ASSIGNED" },
  });

  await prisma.ticketActivityLog.create({
    data: {
      ticketId,
      performedBy: user.id,
      action: "ASSIGNED",
      details: JSON.stringify({
        technicianName: technician.name,
        technicianId,
        previousAssigneeId: oldAssigneeId ?? null,
      }),
    },
  });

  // Notify old assignee about reassignment
  if (oldAssigneeId && oldAssigneeId !== technicianId) {
    await createNotification(
      oldAssigneeId,
      "Ticket Reassigned",
      `You've been unassigned from: ${ticket.title}`,
      "TICKET_ASSIGNED",
      `/tickets/${ticketId}`
    );
  }

  await createNotification(
    technicianId,
    "Ticket Assigned",
    `You've been assigned: ${ticket.title}`,
    "TICKET_ASSIGNED",
    `/tickets/${ticketId}`
  );

  revalidatePath(`/tickets/${ticketId}`);
  revalidatePath("/tickets");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateTicketStatus(ticketId: string, newStatus: string) {
  const user = await requireAuth();

  // Validate enum value
  const validStatuses = Object.values(TICKET_STATUS) as string[];
  if (!validStatuses.includes(newStatus)) {
    return { error: "Invalid status" };
  }

  const ticket = await prisma.maintenanceTicket.findUnique({
    where: { id: ticketId },
    include: { submitter: { select: { id: true } } },
  });
  if (!ticket) return { error: "Ticket not found" };

  // Validate transition
  const allowed = VALID_TRANSITIONS[ticket.status];
  if (!allowed || !allowed.includes(newStatus)) {
    return { error: `Cannot transition from ${ticket.status} to ${newStatus}` };
  }

  // Cannot mark as ASSIGNED without an assignee
  if (newStatus === "ASSIGNED" && !ticket.assigneeId) {
    return { error: "Assign a technician first before changing status to Assigned" };
  }

  // Only managers can reopen completed tickets
  if (ticket.status === "COMPLETED" && user.role === ROLES.TECHNICIAN) {
    return { error: "Only managers can reopen completed tickets" };
  }

  // Role-based transition permissions
  if (user.role === ROLES.TECHNICIAN) {
    if (ticket.assigneeId !== user.id) return { error: "Not your ticket" };
    if (!["IN_PROGRESS", "COMPLETED", "ASSIGNED"].includes(newStatus)) {
      return { error: "Technicians can only start, complete, or pause work" };
    }
  }

  const updateData: Record<string, unknown> = { status: newStatus };
  if (newStatus === "COMPLETED") {
    updateData.completedAt = new Date();
  } else {
    updateData.completedAt = null;
  }
  if (newStatus === "OPEN") {
    updateData.assigneeId = null;
  }

  await prisma.maintenanceTicket.update({
    where: { id: ticketId },
    data: updateData,
  });

  await prisma.ticketActivityLog.create({
    data: {
      ticketId,
      performedBy: user.id,
      action: "STATUS_CHANGED",
      details: JSON.stringify({
        from: ticket.status,
        to: newStatus,
      }),
    },
  });

  // Notify submitter
  if (ticket.submitter.id !== user.id) {
    await createNotification(
      ticket.submitter.id,
      "Ticket Updated",
      `Your ticket "${ticket.title}" is now ${newStatus.replace("_", " ")}`,
      "STATUS_CHANGED",
      `/tickets/${ticketId}`
    );
  }

  revalidatePath(`/tickets/${ticketId}`);
  revalidatePath("/tickets");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateTicketPriority(
  ticketId: string,
  newPriority: string
) {
  const user = await requireRole(["MANAGER"]);

  // Validate enum value
  const validPriorities = Object.values(TICKET_PRIORITY) as string[];
  if (!validPriorities.includes(newPriority)) {
    return { error: "Invalid priority" };
  }

  const ticket = await prisma.maintenanceTicket.findUnique({
    where: { id: ticketId },
  });
  if (!ticket) return { error: "Ticket not found" };
  if (ticket.status === "COMPLETED") {
    return { error: "Cannot change priority on completed tickets" };
  }

  await prisma.maintenanceTicket.update({
    where: { id: ticketId },
    data: { priority: newPriority },
  });

  await prisma.ticketActivityLog.create({
    data: {
      ticketId,
      performedBy: user.id,
      action: "PRIORITY_CHANGED",
      details: JSON.stringify({
        from: ticket.priority,
        to: newPriority,
      }),
    },
  });

  revalidatePath(`/tickets/${ticketId}`);
  revalidatePath("/tickets");
  return { success: true };
}

export async function getDashboardStats() {
  const user = await requireAuth();

  const baseWhere: Record<string, unknown> = {};
  if (user.role === ROLES.TENANT) baseWhere.submitterId = user.id;
  if (user.role === ROLES.TECHNICIAN) baseWhere.assigneeId = user.id;

  const [open, assigned, inProgress, completed, recentTickets] =
    await Promise.all([
      prisma.maintenanceTicket.count({
        where: { ...baseWhere, status: "OPEN" },
      }),
      prisma.maintenanceTicket.count({
        where: { ...baseWhere, status: "ASSIGNED" },
      }),
      prisma.maintenanceTicket.count({
        where: { ...baseWhere, status: "IN_PROGRESS" },
      }),
      prisma.maintenanceTicket.count({
        where: { ...baseWhere, status: "COMPLETED" },
      }),
      prisma.maintenanceTicket.findMany({
        where: baseWhere,
        include: {
          property: { select: { name: true } },
          submitter: { select: { name: true } },
          assignee: { select: { name: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
    ]);

  return { open, assigned, inProgress, completed, recentTickets };
}
