import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { canAccessTicket } from "@/lib/auth-utils";

export const runtime = "nodejs";

/**
 * Authenticated file proxy — serves ticket attachments only to users who have
 * access to the ticket they belong to. The actual blob URL is never exposed
 * to the client; the browser only ever sees /api/files/<id>.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  const attachment = await prisma.fileAttachment.findUnique({
    where: { id },
    include: {
      ticket: {
        select: { submitterId: true, assigneeId: true, status: true },
      },
    },
  });

  if (!attachment) {
    return new NextResponse("Not found", { status: 404 });
  }

  const user = { id: session.user.id, role: session.user.role };
  if (!canAccessTicket(user, attachment.ticket)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // Fetch the file from blob storage server-to-server, so the CDN URL is
  // never sent to the browser
  let blobResponse: Response;
  try {
    blobResponse = await fetch(attachment.storedName);
  } catch {
    return new NextResponse("Failed to fetch file", { status: 502 });
  }

  if (!blobResponse.ok) {
    return new NextResponse("File not available", { status: 502 });
  }

  const safeFilename = encodeURIComponent(attachment.filename);
  return new NextResponse(blobResponse.body, {
    headers: {
      "Content-Type": attachment.mimeType,
      "Content-Length": attachment.size.toString(),
      "Content-Disposition": `inline; filename="${safeFilename}"`,
      // Private cache — authenticated route, do not cache on shared CDNs
      "Cache-Control": "private, max-age=3600",
    },
  });
}
