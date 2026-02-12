import { describe, it, expect, vi, beforeEach } from "vitest";
import { requireAuth } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";
import { createMockUser } from "../helpers";

// Mock upload utilities
vi.mock("@/lib/upload", () => ({
  saveFile: vi.fn(),
  deleteFile: vi.fn(),
}));

import { saveFile, deleteFile } from "@/lib/upload";
import { uploadFiles, removeFile } from "@/actions/uploads";
import { revalidatePath } from "next/cache";

const mockRequireAuth = vi.mocked(requireAuth);
const mockPrisma = vi.mocked(prisma, true);
const mockSaveFile = vi.mocked(saveFile);
const mockDeleteFile = vi.mocked(deleteFile);
const mockRevalidatePath = vi.mocked(revalidatePath);

describe("uploads actions", () => {
  const user = createMockUser({ id: "user-1", role: "TENANT" });
  const ticketForUser = { submitterId: "user-1", assigneeId: null };

  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockResolvedValue(user);
    // Default: ticket belongs to user
    mockPrisma.maintenanceTicket.findUnique.mockResolvedValue(
      ticketForUser as never
    );
  });

  describe("uploadFiles", () => {
    function createFormDataWithFiles(count: number): FormData {
      const fd = new FormData();
      for (let i = 0; i < count; i++) {
        const file = new File([new ArrayBuffer(1000)], `file${i}.jpg`, {
          type: "image/jpeg",
        });
        fd.append("files", file);
      }
      return fd;
    }

    it("uploads files successfully", async () => {
      mockPrisma.fileAttachment.count.mockResolvedValue(0 as never);
      mockSaveFile.mockResolvedValue({
        filename: "file.jpg",
        storedName: "uuid.jpg",
        mimeType: "image/jpeg",
        size: 1000,
      });
      mockPrisma.fileAttachment.create.mockResolvedValue({} as never);
      mockPrisma.ticketActivityLog.create.mockResolvedValue({} as never);

      const formData = createFormDataWithFiles(2);
      const result = await uploadFiles("ticket-1", formData);

      expect(result).toEqual({ success: true, count: 2 });
      expect(mockSaveFile).toHaveBeenCalledTimes(2);
      expect(mockPrisma.fileAttachment.create).toHaveBeenCalledTimes(2);
    });

    it("returns error when ticket not found", async () => {
      mockPrisma.maintenanceTicket.findUnique.mockResolvedValue(null);

      const formData = createFormDataWithFiles(1);
      const result = await uploadFiles("ticket-1", formData);

      expect(result).toEqual({ error: "Ticket not found" });
    });

    it("returns access denied when user has no access to ticket", async () => {
      mockPrisma.maintenanceTicket.findUnique.mockResolvedValue({
        submitterId: "other-user",
        assigneeId: null,
      } as never);

      const formData = createFormDataWithFiles(1);
      const result = await uploadFiles("ticket-1", formData);

      expect(result).toEqual({ error: "Access denied" });
    });

    it("allows manager to upload to any ticket", async () => {
      mockRequireAuth.mockResolvedValue(
        createMockUser({ id: "mgr-1", role: "MANAGER" })
      );
      mockPrisma.maintenanceTicket.findUnique.mockResolvedValue({
        submitterId: "other-user",
        assigneeId: null,
      } as never);
      mockPrisma.fileAttachment.count.mockResolvedValue(0 as never);
      mockSaveFile.mockResolvedValue({
        filename: "f.jpg",
        storedName: "u.jpg",
        mimeType: "image/jpeg",
        size: 100,
      });
      mockPrisma.fileAttachment.create.mockResolvedValue({} as never);
      mockPrisma.ticketActivityLog.create.mockResolvedValue({} as never);

      const formData = createFormDataWithFiles(1);
      const result = await uploadFiles("ticket-1", formData);

      expect(result).toEqual({ success: true, count: 1 });
    });

    it("returns error when no files selected", async () => {
      const formData = new FormData();
      const result = await uploadFiles("ticket-1", formData);

      expect(result).toEqual({ error: "No files selected" });
    });

    it("returns error when exceeding max files", async () => {
      mockPrisma.fileAttachment.count.mockResolvedValue(3 as never);

      const formData = createFormDataWithFiles(3);
      const result = await uploadFiles("ticket-1", formData);

      expect(result).toEqual({
        error: expect.stringContaining("Maximum 5 files"),
      });
    });

    it("allows exactly at the limit", async () => {
      mockPrisma.fileAttachment.count.mockResolvedValue(3 as never);
      mockSaveFile.mockResolvedValue({
        filename: "file.jpg",
        storedName: "uuid.jpg",
        mimeType: "image/jpeg",
        size: 1000,
      });
      mockPrisma.fileAttachment.create.mockResolvedValue({} as never);
      mockPrisma.ticketActivityLog.create.mockResolvedValue({} as never);

      const formData = createFormDataWithFiles(2);
      const result = await uploadFiles("ticket-1", formData);

      expect(result).toEqual({ success: true, count: 2 });
    });

    it("returns error when saveFile throws", async () => {
      mockPrisma.fileAttachment.count.mockResolvedValue(0 as never);
      mockSaveFile.mockRejectedValue(
        new Error(
          "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed."
        )
      );

      const formData = createFormDataWithFiles(1);
      const result = await uploadFiles("ticket-1", formData);

      expect(result).toEqual({
        error:
          "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.",
      });
    });

    it("creates activity log entry", async () => {
      mockPrisma.fileAttachment.count.mockResolvedValue(0 as never);
      mockSaveFile.mockResolvedValue({
        filename: "file.jpg",
        storedName: "uuid.jpg",
        mimeType: "image/jpeg",
        size: 1000,
      });
      mockPrisma.fileAttachment.create.mockResolvedValue({} as never);
      mockPrisma.ticketActivityLog.create.mockResolvedValue({} as never);

      const formData = createFormDataWithFiles(1);
      await uploadFiles("ticket-1", formData);

      expect(mockPrisma.ticketActivityLog.create).toHaveBeenCalledWith({
        data: {
          ticketId: "ticket-1",
          performedBy: "user-1",
          action: "ATTACHMENT_ADDED",
          details: JSON.stringify({ count: 1 }),
        },
      });
    });

    it("calls revalidatePath", async () => {
      mockPrisma.fileAttachment.count.mockResolvedValue(0 as never);
      mockSaveFile.mockResolvedValue({
        filename: "f.jpg",
        storedName: "u.jpg",
        mimeType: "image/jpeg",
        size: 100,
      });
      mockPrisma.fileAttachment.create.mockResolvedValue({} as never);
      mockPrisma.ticketActivityLog.create.mockResolvedValue({} as never);

      const formData = createFormDataWithFiles(1);
      await uploadFiles("ticket-1", formData);

      expect(mockRevalidatePath).toHaveBeenCalledWith("/tickets/ticket-1");
    });
  });

  describe("removeFile", () => {
    const attachmentWithTicket = {
      id: "att-1",
      storedName: "uuid.jpg",
      ticketId: "ticket-1",
      uploadedBy: "user-1",
      ticket: { submitterId: "user-1", assigneeId: null },
    };

    it("removes file successfully when user is uploader", async () => {
      mockPrisma.fileAttachment.findUnique.mockResolvedValue(
        attachmentWithTicket as never
      );
      mockPrisma.fileAttachment.delete.mockResolvedValue({} as never);
      mockDeleteFile.mockResolvedValue(undefined);

      const result = await removeFile("att-1");

      expect(result).toEqual({ success: true });
      expect(mockDeleteFile).toHaveBeenCalledWith("uuid.jpg");
      expect(mockPrisma.fileAttachment.delete).toHaveBeenCalledWith({
        where: { id: "att-1" },
      });
    });

    it("returns error if attachment not found", async () => {
      mockPrisma.fileAttachment.findUnique.mockResolvedValue(null);

      const result = await removeFile("nonexistent");

      expect(result).toEqual({ error: "Attachment not found" });
    });

    it("returns access denied when user is not uploader and has no ticket access", async () => {
      mockRequireAuth.mockResolvedValue(
        createMockUser({ id: "random-user", role: "TENANT" })
      );
      mockPrisma.fileAttachment.findUnique.mockResolvedValue({
        ...attachmentWithTicket,
        uploadedBy: "other-user",
        ticket: { submitterId: "other-user", assigneeId: null },
      } as never);

      const result = await removeFile("att-1");

      expect(result).toEqual({ error: "Access denied" });
    });

    it("allows manager to delete any attachment", async () => {
      mockRequireAuth.mockResolvedValue(
        createMockUser({ id: "mgr-1", role: "MANAGER" })
      );
      mockPrisma.fileAttachment.findUnique.mockResolvedValue({
        ...attachmentWithTicket,
        uploadedBy: "other-user",
        ticket: { submitterId: "other-user", assigneeId: null },
      } as never);
      mockPrisma.fileAttachment.delete.mockResolvedValue({} as never);
      mockDeleteFile.mockResolvedValue(undefined);

      const result = await removeFile("att-1");

      expect(result).toEqual({ success: true });
    });

    it("deletes physical file before DB record", async () => {
      const callOrder: string[] = [];
      mockPrisma.fileAttachment.findUnique.mockResolvedValue(
        attachmentWithTicket as never
      );
      mockDeleteFile.mockImplementation(async () => {
        callOrder.push("deleteFile");
      });
      mockPrisma.fileAttachment.delete.mockImplementation(async () => {
        callOrder.push("dbDelete");
        return {} as never;
      });

      await removeFile("att-1");

      expect(callOrder).toEqual(["deleteFile", "dbDelete"]);
    });

    it("calls revalidatePath with ticket path", async () => {
      mockPrisma.fileAttachment.findUnique.mockResolvedValue(
        attachmentWithTicket as never
      );
      mockPrisma.fileAttachment.delete.mockResolvedValue({} as never);
      mockDeleteFile.mockResolvedValue(undefined);

      await removeFile("att-1");

      expect(mockRevalidatePath).toHaveBeenCalledWith("/tickets/ticket-1");
    });
  });
});
