"use server";

import prisma from "@/lib/prisma";
import { requireAuth, canAccessTicket } from "@/lib/auth-utils";
import { createNotification } from "./notifications";
import { revalidatePath } from "next/cache";

export async function addComment(ticketId: string, content: string) {
  const user = await requireAuth();

  if (!content || content.trim().length < 1) {
    return { error: "Comment cannot be empty" };
  }

  const ticket = await prisma.maintenanceTicket.findUnique({
    where: { id: ticketId },
    select: {
      id: true,
      title: true,
      submitterId: true,
      assigneeId: true,
    },
  });
  if (!ticket) return { error: "Ticket not found" };

  // Verify user has access to this ticket
  if (!canAccessTicket(user, ticket)) return { error: "Access denied" };

  await prisma.ticketComment.create({
    data: {
      ticketId,
      authorId: user.id,
      content: content.trim(),
    },
  });

  await prisma.ticketActivityLog.create({
    data: {
      ticketId,
      performedBy: user.id,
      action: "COMMENTED",
      details: JSON.stringify({ preview: content.trim().slice(0, 100) }),
    },
  });

  // Notify other participants
  const notifyIds = new Set<string>();
  if (ticket.submitterId !== user.id) notifyIds.add(ticket.submitterId);
  if (ticket.assigneeId && ticket.assigneeId !== user.id) {
    notifyIds.add(ticket.assigneeId);
  }

  for (const userId of notifyIds) {
    await createNotification(
      userId,
      "New Comment",
      `${user.name} commented on: ${ticket.title}`,
      "COMMENT_ADDED",
      `/tickets/${ticketId}`
    );
  }

  revalidatePath(`/tickets/${ticketId}`);
  return { success: true };
}
