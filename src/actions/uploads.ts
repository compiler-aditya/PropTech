"use server";

import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { canAccessTicket } from "@/lib/auth-utils";
import { saveFile, deleteFile } from "@/lib/upload";
import { UPLOAD, ROLES } from "@/lib/constants";
import { revalidatePath } from "next/cache";

export async function uploadFiles(ticketId: string, formData: FormData) {
  const user = await requireAuth();

  // Verify user has access to this ticket
  const ticket = await prisma.maintenanceTicket.findUnique({
    where: { id: ticketId },
    select: { submitterId: true, assigneeId: true },
  });
  if (!ticket) return { error: "Ticket not found" };
  if (!canAccessTicket(user, ticket)) return { error: "Access denied" };

  const files = formData.getAll("files") as File[];
  if (files.length === 0) return { error: "No files selected" };

  // Check existing attachment count
  const existingCount = await prisma.fileAttachment.count({
    where: { ticketId },
  });
  if (existingCount + files.length > UPLOAD.MAX_FILES_PER_TICKET) {
    return {
      error: `Maximum ${UPLOAD.MAX_FILES_PER_TICKET} files per ticket. You have ${existingCount} already.`,
    };
  }

  const results = [];
  for (const file of files) {
    try {
      const saved = await saveFile(file);
      const attachment = await prisma.fileAttachment.create({
        data: {
          ...saved,
          ticketId,
          uploadedBy: user.id,
        },
      });
      results.push(attachment);
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Upload failed" };
    }
  }

  await prisma.ticketActivityLog.create({
    data: {
      ticketId,
      performedBy: user.id,
      action: "ATTACHMENT_ADDED",
      details: JSON.stringify({ count: results.length }),
    },
  });

  revalidatePath(`/tickets/${ticketId}`);
  return { success: true, count: results.length };
}

export async function removeFile(attachmentId: string) {
  const user = await requireAuth();

  const attachment = await prisma.fileAttachment.findUnique({
    where: { id: attachmentId },
    include: {
      ticket: { select: { submitterId: true, assigneeId: true } },
    },
  });
  if (!attachment) return { error: "Attachment not found" };

  // Only uploader, ticket participants, or managers can delete
  const isUploader = attachment.uploadedBy === user.id;
  const hasTicketAccess = canAccessTicket(user, attachment.ticket);
  if (!isUploader && !hasTicketAccess) return { error: "Access denied" };

  await deleteFile(attachment.storedName);
  await prisma.fileAttachment.delete({ where: { id: attachmentId } });

  revalidatePath(`/tickets/${attachment.ticketId}`);
  return { success: true };
}
