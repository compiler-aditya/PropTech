import { requireAuth } from "@/lib/auth-utils";
import { getNotifications } from "@/actions/notifications";
import { NotificationList } from "@/components/notifications/notification-list";

export default async function NotificationsPage() {
  await requireAuth();
  const notifications = await getNotifications();

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Notifications</h1>
      <NotificationList notifications={notifications} />
    </div>
  );
}
