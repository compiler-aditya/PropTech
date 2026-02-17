"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { markAsRead, markAllAsRead } from "@/actions/notifications";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Bell, CheckCheck } from "lucide-react";
import Link from "next/link";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  linkUrl: string | null;
  createdAt: Date;
}

export function NotificationList({
  notifications,
}: {
  notifications: Notification[];
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  function handleMarkAllRead() {
    startTransition(async () => {
      await markAllAsRead();
      router.refresh();
    });
  }

  function handleClick(notification: Notification) {
    if (!notification.isRead) {
      startTransition(async () => {
        await markAsRead(notification.id);
        router.refresh();
      });
    }
  }

  return (
    <div className="space-y-4">
      {unreadCount > 0 && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={isPending}
          >
            <CheckCheck className="h-4 w-4 mr-1" />
            Mark all read
          </Button>
        </div>
      )}

      {notifications.length > 0 ? (
        <div className="space-y-2">
          {notifications.map((notification) => {
            const content = (
                <Card
                  className={cn(
                    "cursor-pointer hover:shadow-sm transition-shadow",
                    !notification.isRead && "border-l-4 border-l-primary"
                  )}
                  onClick={() => handleClick(notification)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p
                          className={cn(
                            "text-sm",
                            !notification.isRead && "font-medium"
                          )}
                        >
                          {notification.title}
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {notification.message}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {timeAgo(notification.createdAt)}
                      </span>
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
      ) : (
        <div className="text-center py-12">
          <Bell className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
          <h3 className="font-medium text-foreground">No notifications</h3>
          <p className="text-sm text-muted-foreground mt-1">
            You&apos;re all caught up!
          </p>
        </div>
      )}
    </div>
  );
}
