"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { markAsRead, markAllAsRead } from "@/actions/notifications";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Bell, CheckCheck, TicketPlus, UserCheck, ArrowRightLeft, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useUnreadCount } from "@/components/notifications/notification-provider";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  linkUrl: string | null;
  createdAt: Date;
}

const notificationConfig: Record<string, { icon: React.ElementType; iconClass: string; bgClass: string }> = {
  TICKET_CREATED:  { icon: TicketPlus,      iconClass: "text-emerald-600 dark:text-emerald-400", bgClass: "bg-emerald-50 dark:bg-emerald-950" },
  TICKET_ASSIGNED: { icon: UserCheck,        iconClass: "text-blue-600 dark:text-blue-400",    bgClass: "bg-blue-50 dark:bg-blue-950" },
  STATUS_CHANGED:  { icon: ArrowRightLeft,   iconClass: "text-orange-600 dark:text-orange-400", bgClass: "bg-orange-50 dark:bg-orange-950" },
  COMMENT_ADDED:   { icon: MessageSquare,    iconClass: "text-violet-600 dark:text-violet-400", bgClass: "bg-violet-50 dark:bg-violet-950" },
};
const defaultNotifConfig = { icon: Bell, iconClass: "text-muted-foreground", bgClass: "bg-muted" };

export function NotificationList({
  notifications,
}: {
  notifications: Notification[];
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { refresh: refreshUnreadCount } = useUnreadCount();
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const unread = notifications.filter((n) => !n.isRead);
  const read = notifications.filter((n) => n.isRead);

  function handleMarkAllRead() {
    startTransition(async () => {
      await markAllAsRead();
      refreshUnreadCount();
      router.refresh();
    });
  }

  function handleClick(notification: Notification) {
    if (!notification.isRead) {
      startTransition(async () => {
        await markAsRead(notification.id);
        refreshUnreadCount();
        router.refresh();
      });
    }
  }

  function renderList(items: Notification[]) {
    if (items.length === 0) {
      return (
        <div className="text-center py-12">
          <Bell className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
          <h3 className="font-medium text-foreground">No notifications</h3>
          <p className="text-sm text-muted-foreground mt-1">
            You&apos;re all caught up!
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-1.5">
        {items.map((notification) => {
          const config = notificationConfig[notification.type] ?? defaultNotifConfig;
          const Icon = config.icon;
          const content = (
            <Card
              className={cn(
                "cursor-pointer hover:shadow-sm transition-shadow",
                !notification.isRead && "border-l-4 border-l-primary bg-primary/5"
              )}
              onClick={() => handleClick(notification)}
            >
              <CardContent className="p-3 md:p-3">
                <div className="flex items-start gap-3">
                  <div className={cn("mt-0.5 p-2 rounded-full shrink-0", config.bgClass)}>
                    <Icon className={cn("h-4 w-4", config.iconClass)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn("text-sm", !notification.isRead && "font-semibold")}>
                        {notification.title}
                      </p>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {timeAgo(notification.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                      {notification.message}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
          return (
            <div key={notification.id}>
              {notification.linkUrl ? (
                <Link href={notification.linkUrl}>{content}</Link>
              ) : (
                content
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <Tabs defaultValue="all" className="space-y-4">
      <div className="flex items-center justify-between">
        <TabsList>
          <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
          <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
          <TabsTrigger value="read">Read ({read.length})</TabsTrigger>
        </TabsList>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={isPending}
          >
            <CheckCheck className="h-4 w-4 mr-1" />
            Mark all read
          </Button>
        )}
      </div>
      <TabsContent value="all">{renderList(notifications)}</TabsContent>
      <TabsContent value="unread">{renderList(unread)}</TabsContent>
      <TabsContent value="read">{renderList(read)}</TabsContent>
    </Tabs>
  );
}
