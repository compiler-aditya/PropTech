"use server";

import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth-utils";
import { ROLES } from "@/lib/constants";

export async function getTechnicians() {
  await requireRole(["MANAGER"]);
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
}
