import { requireAuth } from "@/lib/auth-utils";
import { AppShell } from "@/components/layout/app-shell";
import { getUnreadCount } from "@/actions/notifications";
import { getUserAvatarUrl } from "@/actions/profile";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();
  const [unreadCount, avatarUrl] = await Promise.all([
    getUnreadCount(),
    getUserAvatarUrl(user.id),
  ]);

  return (
    <AppShell
      userName={user.name || "User"}
      userRole={user.role}
      userEmail={user.email || ""}
      unreadCount={unreadCount}
      avatarUrl={avatarUrl}
    >
      {children}
    </AppShell>
  );
}
