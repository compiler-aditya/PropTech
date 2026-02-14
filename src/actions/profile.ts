"use server";

import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { requireAuth } from "@/lib/auth-utils";
import { saveFile, deleteFile } from "@/lib/upload";
import prisma from "@/lib/prisma";

export async function updateAvatar(formData: FormData) {
  const user = await requireAuth();

  const file = formData.get("avatar") as File | null;
  if (!file || file.size === 0) {
    return { error: "No file provided" };
  }

  try {
    const saved = await saveFile(file);

    // Delete old avatar file if exists
    const existing = await prisma.user.findUnique({
      where: { id: user.id },
      select: { avatarUrl: true },
    });
    if (existing?.avatarUrl) {
      await deleteFile(existing.avatarUrl);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl: saved.storedName },
    });

    revalidateTag(`avatar-${user.id}`, { expire: 0 });
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Upload failed" };
  }
}

export async function removeAvatar(): Promise<{ success?: boolean; error?: string }> {
  const user = await requireAuth();

  try {
    const existing = await prisma.user.findUnique({
      where: { id: user.id },
      select: { avatarUrl: true },
    });

    if (existing?.avatarUrl) {
      await deleteFile(existing.avatarUrl);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl: null },
    });

    revalidateTag(`avatar-${user.id}`, { expire: 0 });
    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { error: "Failed to remove photo" };
  }
}

export async function getUserAvatarUrl(userId: string): Promise<string | null> {
  const cachedFn = unstable_cache(
    async () => {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { avatarUrl: true },
      });
      return user?.avatarUrl ?? null;
    },
    [`avatar-${userId}`],
    { revalidate: 600, tags: [`avatar-${userId}`] }
  );
  return cachedFn();
}
