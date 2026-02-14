"use server";

import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { unstable_cache, revalidateTag } from "next/cache";
import { NOTIFICATION_TYPE } from "@/lib/constants";
import { sendNotificationEmail } from "@/lib/email";

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
  // Fire-and-forget email: look up user email, then send
  Promise.resolve(
    prisma.user.findUnique({ where: { id: userId }, select: { email: true } })
  )
    .then((user) => {
      if (user?.email) {
        sendNotificationEmail(user.email, title, message, linkUrl);
      }
    })
    .catch((err: unknown) => {
      console.error("[notification] Failed to look up user email:", err);
    });

  const notification = await prisma.notification.create({
    data: { userId, title, message, type, linkUrl },
  });

  revalidateTag(`unread-${userId}`, { expire: 0 });
  return notification;
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
  const cachedCount = unstable_cache(
    async () => {
      return prisma.notification.count({
        where: { userId: user.id, isRead: false },
      });
    },
    [`unread-count-${user.id}`],
    { revalidate: 15, tags: [`unread-${user.id}`] }
  );
  return cachedCount();
}

export async function markAsRead(notificationId: string) {
  const user = await requireAuth();
  await prisma.notification.updateMany({
    where: { id: notificationId, userId: user.id },
    data: { isRead: true },
  });
  revalidateTag(`unread-${user.id}`, { expire: 0 });
  return { success: true };
}

export async function markAllAsRead() {
  const user = await requireAuth();
  await prisma.notification.updateMany({
    where: { userId: user.id, isRead: false },
    data: { isRead: true },
  });
  revalidateTag(`unread-${user.id}`, { expire: 0 });
  return { success: true };
}
