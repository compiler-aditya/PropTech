"use server";

import { revalidatePath } from "next/cache";
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
      const oldName = existing.avatarUrl.replace("/uploads/", "");
      await deleteFile(oldName);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl: `/uploads/${saved.storedName}` },
    });

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
      const oldName = existing.avatarUrl.replace("/uploads/", "");
      await deleteFile(oldName);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl: null },
    });

    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { error: "Failed to remove photo" };
  }
}

export async function getUserAvatarUrl(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatarUrl: true },
  });
  return user?.avatarUrl ?? null;
}
