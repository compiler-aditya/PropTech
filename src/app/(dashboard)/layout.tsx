import { requireAuth } from "@/lib/auth-utils";
import { AppShell } from "@/components/layout/app-shell";
import { getUnreadCount } from "@/actions/notifications";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();
  const unreadCount = await getUnreadCount();

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
