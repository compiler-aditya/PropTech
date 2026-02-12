"use server";

import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth-utils";
import { z } from "zod";

const propertySchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  address: z.string().trim().min(5, "Address must be at least 5 characters"),
});

export async function getProperties() {
  const user = await requireRole(["MANAGER"]);
  return prisma.property.findMany({
    where: { managerId: user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { tickets: true } } },
  });
}

export async function getAllProperties() {
  return prisma.property.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, address: true },
  });
}

export async function createProperty(formData: FormData) {
  const user = await requireRole(["MANAGER"]);
  const raw = {
    name: formData.get("name") as string,
    address: formData.get("address") as string,
  };

  const parsed = propertySchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await prisma.property.create({
    data: {
      name: parsed.data.name,
      address: parsed.data.address,
      managerId: user.id,
    },
  });

  return { success: true };
}
