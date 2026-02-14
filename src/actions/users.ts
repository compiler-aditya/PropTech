"use server";

import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth-utils";
import { unstable_cache } from "next/cache";
import { ROLES } from "@/lib/constants";

const cachedGetTechnicians = unstable_cache(
  async () => {
    return prisma.user.findMany({
      where: { role: ROLES.TECHNICIAN },
      select: {
        id: true,
        name: true,
        email: true,
        _count: {
          select: {
            assignedTickets: {
              where: { status: { in: ["ASSIGNED", "IN_PROGRESS"] } },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });
  },
  ["technicians"],
  { revalidate: 120, tags: ["technicians"] }
);

export async function getTechnicians() {
  await requireRole(["MANAGER"]);
  return cachedGetTechnicians();
}
