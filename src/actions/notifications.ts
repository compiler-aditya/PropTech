"use server";

import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { NOTIFICATION_TYPE } from "@/lib/constants";

// Internal helper — not directly callable as a server action by clients.
// Only called by other server actions (tickets, comments) to create notifications.
const VALID_TYPES = new Set(Object.values(NOTIFICATION_TYPE));

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: string,
  linkUrl?: string
) {
  if (!VALID_TYPES.has(type as (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE])) {
    throw new Error(`Invalid notification type: ${type}`);
  }
  return prisma.notification.create({
    data: { userId, title, message, type, linkUrl },
  });
}

export async function getNotifications() {
  const user = await requireAuth();
  return prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function getUnreadCount() {
  const user = await requireAuth();
  return prisma.notification.count({
    where: { userId: user.id, isRead: false },
  });
}

export async function markAsRead(notificationId: string) {
  const user = await requireAuth();
  await prisma.notification.updateMany({
    where: { id: notificationId, userId: user.id },
    data: { isRead: true },
  });
  return { success: true };
}

export async function markAllAsRead() {
  const user = await requireAuth();
  await prisma.notification.updateMany({
    where: { userId: user.id, isRead: false },
    data: { isRead: true },
  });
  return { success: true };
}
