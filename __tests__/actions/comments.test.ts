import { describe, it, expect, vi, beforeEach } from "vitest";
import { requireAuth } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";
import { addComment } from "@/actions/comments";
import { createMockUser } from "../helpers";

const mockRequireAuth = vi.mocked(requireAuth);
const mockPrisma = vi.mocked(prisma, true);

describe("addComment", () => {
  const user = createMockUser({ id: "commenter-1", name: "Commenter", role: "MANAGER" });
  const ticket = {
    id: "ticket-1",
    title: "Test Ticket",
    submitterId: "submitter-1",
    assigneeId: "tech-1",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockResolvedValue(user);
    mockPrisma.maintenanceTicket.findUnique.mockResolvedValue(ticket as never);
    mockPrisma.ticketComment.create.mockResolvedValue({} as never);
    mockPrisma.ticketActivityLog.create.mockResolvedValue({} as never);
    mockPrisma.notification.create.mockResolvedValue({} as never);
  });

  it("adds comment successfully", async () => {
    const result = await addComment("ticket-1", "This is a comment");

    expect(result).toEqual({ success: true });
    expect(mockPrisma.ticketComment.create).toHaveBeenCalledWith({
      data: {
        ticketId: "ticket-1",
        authorId: "commenter-1",
        content: "This is a comment",
      },
    });
  });

  it("rejects empty content", async () => {
    const result = await addComment("ticket-1", "");

    expect(result).toEqual({ error: "Comment cannot be empty" });
    expect(mockPrisma.ticketComment.create).not.toHaveBeenCalled();
  });

  it("rejects whitespace-only content", async () => {
    const result = await addComment("ticket-1", "   ");

    expect(result).toEqual({ error: "Comment cannot be empty" });
  });

  it("trims content before saving", async () => {
    await addComment("ticket-1", "  hello world  ");

    expect(mockPrisma.ticketComment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ content: "hello world" }),
    });
  });

  it("returns access denied when user has no access to ticket", async () => {
    mockRequireAuth.mockResolvedValue(
      createMockUser({ id: "random-tenant", role: "TENANT" })
    );

    const result = await addComment("ticket-1", "A comment");

    expect(result).toEqual({ error: "Access denied" });
    expect(mockPrisma.ticketComment.create).not.toHaveBeenCalled();
  });

  it("returns error if ticket not found", async () => {
    mockPrisma.maintenanceTicket.findUnique.mockResolvedValue(null);

    const result = await addComment("nonexistent", "comment");

    expect(result).toEqual({ error: "Ticket not found" });
  });

  it("creates activity log with preview", async () => {
    const longContent = "a".repeat(150);
    await addComment("ticket-1", longContent);

    expect(mockPrisma.ticketActivityLog.create).toHaveBeenCalledWith({
      data: {
        ticketId: "ticket-1",
        performedBy: "commenter-1",
        action: "COMMENTED",
        details: expect.stringContaining("a".repeat(100)),
      },
    });
  });

  it("notifies submitter when commenter is different", async () => {
    await addComment("ticket-1", "A comment");

    expect(mockPrisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: "submitter-1" }),
      })
    );
  });

  it("notifies assignee when commenter is different", async () => {
    await addComment("ticket-1", "A comment");

    expect(mockPrisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: "tech-1" }),
      })
    );
  });

  it("does NOT notify commenter if they are the submitter", async () => {
    mockRequireAuth.mockResolvedValue(
      createMockUser({ id: "submitter-1", name: "Submitter", role: "TENANT" })
    );

    await addComment("ticket-1", "A comment");

    // Should not notify submitter-1 (that's the commenter)
    const notifCalls = mockPrisma.notification.create.mock.calls;
    const notifiedUserIds = notifCalls.map(
      (call) => (call[0] as { data: { userId: string } }).data.userId
    );
    expect(notifiedUserIds).not.toContain("submitter-1");
  });

  it("does not notify assignee if null", async () => {
    mockPrisma.maintenanceTicket.findUnique.mockResolvedValue({
      ...ticket,
      assigneeId: null,
    } as never);

    await addComment("ticket-1", "A comment");

    // Only submitter should be notified
    expect(mockPrisma.notification.create).toHaveBeenCalledTimes(1);
    expect(mockPrisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: "submitter-1" }),
      })
    );
  });

  it("rejects comment over 2000 characters", async () => {
    const result = await addComment("ticket-1", "a".repeat(2001));

    expect(result).toEqual({ error: "Comment must be 2000 characters or fewer" });
    expect(mockPrisma.ticketComment.create).not.toHaveBeenCalled();
  });

  it("accepts comment at exactly 2000 characters", async () => {
    const result = await addComment("ticket-1", "a".repeat(2000));

    expect(result).toEqual({ success: true });
    expect(mockPrisma.ticketComment.create).toHaveBeenCalled();
  });
});
