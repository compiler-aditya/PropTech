import { requireAuth } from "@/lib/auth-utils";

export default async function NotificationsPage() {
  await requireAuth();
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold">Notifications</h1>
      <p className="text-muted-foreground mt-1">Your notifications will appear here.</p>
    </div>
  );
}
