import { requireAuth } from "@/lib/auth-utils";
import { AppShell } from "@/components/layout/app-shell";
import prisma from "@/lib/prisma";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  const unreadCount = await prisma.notification.count({
    where: { userId: user.id, isRead: false },
  });

  return (
    <AppShell
      userName={user.name || "User"}
      userRole={user.role}
      userEmail={user.email || ""}
      unreadCount={unreadCount}
    >
      {children}
    </AppShell>
  );
}
