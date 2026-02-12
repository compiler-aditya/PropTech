import { describe, it, expect, vi, beforeEach } from "vitest";
import { requireAuth } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";
import {
  createNotification,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from "@/actions/notifications";
import { createMockUser } from "../helpers";

const mockRequireAuth = vi.mocked(requireAuth);
const mockPrisma = vi.mocked(prisma, true);

describe("notifications actions", () => {
  const user = createMockUser({ id: "user-1" });

  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockResolvedValue(user);
  });

  describe("createNotification", () => {
    it("creates notification with all fields", async () => {
      mockPrisma.notification.create.mockResolvedValue({} as never);

      await createNotification(
        "user-1",
        "Test Title",
        "Test message",
        "TICKET_CREATED",
        "/tickets/1"
      );

      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: "user-1",
          title: "Test Title",
          message: "Test message",
          type: "TICKET_CREATED",
          linkUrl: "/tickets/1",
        },
      });
    });

    it("creates notification without linkUrl", async () => {
      mockPrisma.notification.create.mockResolvedValue({} as never);

      await createNotification(
        "user-1",
        "Title",
        "Message",
        "STATUS_CHANGED"
      );

      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: "user-1",
          title: "Title",
          message: "Message",
          type: "STATUS_CHANGED",
          linkUrl: undefined,
        },
      });
    });

    it("throws error for invalid notification type", async () => {
      await expect(
        createNotification("user-1", "Title", "Message", "INVALID_TYPE")
      ).rejects.toThrow("Invalid notification type: INVALID_TYPE");
    });
  });

  describe("getNotifications", () => {
    it("returns notifications for current user ordered by date", async () => {
      const mockNotifications = [{ id: "n1" }, { id: "n2" }];
      mockPrisma.notification.findMany.mockResolvedValue(
        mockNotifications as never
      );

      const result = await getNotifications();

      expect(result).toEqual(mockNotifications);
      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
    });

    it("limits to 50 notifications", async () => {
      mockPrisma.notification.findMany.mockResolvedValue([] as never);

      await getNotifications();

      const call = mockPrisma.notification.findMany.mock.calls[0][0];
      expect(call?.take).toBe(50);
    });
  });

  describe("getUnreadCount", () => {
    it("counts unread notifications for user", async () => {
      mockPrisma.notification.count.mockResolvedValue(5 as never);

      const result = await getUnreadCount();

      expect(result).toBe(5);
      expect(mockPrisma.notification.count).toHaveBeenCalledWith({
        where: { userId: "user-1", isRead: false },
      });
    });
  });

  describe("markAsRead", () => {
    it("marks specific notification as read scoped to user", async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({
        count: 1,
      } as never);

      const result = await markAsRead("notif-1");

      expect(result).toEqual({ success: true });
      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: { id: "notif-1", userId: "user-1" },
        data: { isRead: true },
      });
    });
  });

  describe("markAllAsRead", () => {
    it("marks all unread notifications as read for user", async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({
        count: 3,
      } as never);

      const result = await markAllAsRead();

      expect(result).toEqual({ success: true });
      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: "user-1", isRead: false },
        data: { isRead: true },
      });
    });
  });
});
