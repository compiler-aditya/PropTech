"use server";

import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth-utils";
import { unstable_cache, revalidateTag } from "next/cache";
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

export const getAllProperties = unstable_cache(
  async () => {
    return prisma.property.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, address: true },
    });
  },
  ["all-properties"],
  { revalidate: 300, tags: ["properties"] }
);

export async function getPropertyById(id: string) {
  await requireRole(["MANAGER"]);

  return prisma.property.findUnique({
    where: { id },
    include: {
      manager: {
        select: { id: true, name: true, email: true },
      },
      tickets: {
        include: {
          property: { select: { name: true } },
          submitter: { select: { name: true } },
          assignee: { select: { name: true } },
          _count: { select: { comments: true, attachments: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
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

  revalidateTag("properties", { expire: 0 });
  return { success: true };
}
