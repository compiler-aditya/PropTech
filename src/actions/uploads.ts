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
    select: { submitterId: true, assigneeId: true, status: true },
  });
  if (!ticket) return { error: "Ticket not found" };
  if (!canAccessTicket(user, ticket)) return { error: "Access denied" };
  if (ticket.status === "COMPLETED") return { error: "Cannot upload files to completed tickets" };

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

  // Phase 1: Save all files to blob storage
  // If any upload fails, clean up already-uploaded blobs before returning
  const savedFiles: Awaited<ReturnType<typeof saveFile>>[] = [];
  for (const file of files) {
    try {
      const saved = await saveFile(file);
      savedFiles.push(saved);
    } catch (err) {
      // Roll back successfully uploaded blobs from this batch
      await Promise.allSettled(savedFiles.map((f) => deleteFile(f.storedName)));
      return { error: err instanceof Error ? err.message : "Upload failed" };
    }
  }

  // Phase 2: Create all DB records in a single transaction so they either
  // all succeed or all fail (no partial attachment state in the database)
  try {
    await prisma.$transaction([
      ...savedFiles.map((saved) =>
        prisma.fileAttachment.create({
          data: {
            ...saved,
            ticketId,
            uploadedBy: user.id,
          },
        })
      ),
      prisma.ticketActivityLog.create({
        data: {
          ticketId,
          performedBy: user.id,
          action: "ATTACHMENT_ADDED",
          details: JSON.stringify({ count: savedFiles.length }),
        },
      }),
    ]);
  } catch (err) {
    // Transaction failed — clean up all blobs we uploaded in this batch
    await Promise.allSettled(savedFiles.map((f) => deleteFile(f.storedName)));
    console.error("uploadFiles: DB transaction failed, blobs cleaned up", err);
    return { error: "Upload failed. Please try again." };
  }

  revalidatePath(`/tickets/${ticketId}`);
  return { success: true, count: savedFiles.length };
}

export async function removeFile(attachmentId: string) {
  const user = await requireAuth();

  const attachment = await prisma.fileAttachment.findUnique({
    where: { id: attachmentId },
    include: {
      ticket: { select: { submitterId: true, assigneeId: true, status: true } },
    },
  });
  if (!attachment) return { error: "Attachment not found" };

  // Only uploader, ticket participants, or managers can delete
  const isUploader = attachment.uploadedBy === user.id;
  const hasTicketAccess = canAccessTicket(user, attachment.ticket);
  if (!isUploader && !hasTicketAccess) return { error: "Access denied" };
  if (attachment.ticket.status === "COMPLETED") return { error: "Cannot delete files from completed tickets" };

  // Delete DB record first — if this fails we still have the blob (recoverable)
  await prisma.fileAttachment.delete({ where: { id: attachmentId } });

  // Then delete from blob storage — log failures instead of silently ignoring
  try {
    await deleteFile(attachment.storedName);
  } catch (err) {
    console.error(
      `removeFile: failed to delete blob ${attachment.storedName} — file may be orphaned in storage`,
      err
    );
  }

  revalidatePath(`/tickets/${attachment.ticketId}`);
  return { success: true };
}
