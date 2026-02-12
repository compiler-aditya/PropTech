"use server";

import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: string,
  linkUrl?: string
) {
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
}

export async function markAllAsRead() {
  const user = await requireAuth();
  await prisma.notification.updateMany({
    where: { userId: user.id, isRead: false },
    data: { isRead: true },
  });
}
