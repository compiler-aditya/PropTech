import { cache } from "react";
import { auth } from "./auth";
import { redirect } from "next/navigation";
import { ROLES } from "./constants";

export const getCurrentUser = cache(async () => {
  const session = await auth();
  return session?.user ?? null;
});

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(allowedRoles: string[]) {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) redirect("/dashboard");
  return user;
}

export function canAccessTicket(
  user: { id: string; role: string },
  ticket: { submitterId: string; assigneeId: string | null }
): boolean {
  if (user.role === ROLES.MANAGER) return true;
  if (user.role === ROLES.TENANT && ticket.submitterId === user.id) return true;
  if (user.role === ROLES.TECHNICIAN && ticket.assigneeId === user.id)
    return true;
  return false;
}
