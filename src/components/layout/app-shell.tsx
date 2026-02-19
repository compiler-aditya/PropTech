import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";
import { Header } from "./header";

interface AppShellProps {
  children: React.ReactNode;
  userName: string;
  userRole: string;
  userEmail: string;
  unreadCount?: number;
  avatarUrl?: string | null;
}

export function AppShell({
  children,
  userName,
  userRole,
  userEmail,
  unreadCount = 0,
  avatarUrl,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar userRole={userRole} />
      <div className="md:pl-64 flex flex-col min-h-screen">
        <Header
          userName={userName}
          userRole={userRole}
          userEmail={userEmail}
          unreadCount={unreadCount}
          avatarUrl={avatarUrl}
        />
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
      </div>
      <MobileNav
        userRole={userRole}
        userName={userName}
        userEmail={userEmail}
        avatarUrl={avatarUrl}
      />
    </div>
  );
}
