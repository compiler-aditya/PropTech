"use client";

import { useTransition } from "react";
import { logoutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Bell, LogOut, User, Building2, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";
import { ROLE_LABELS } from "@/lib/constants";
import { ThemeToggle } from "./theme-toggle";
import { useUnreadCount } from "@/components/notifications/notification-provider";

const segmentLabels: Record<string, string> = {
  dashboard: "Dashboard",
  tickets: "Tickets",
  new: "New Request",
  properties: "Properties",
  users: "Users",
  analytics: "Analytics",
  notifications: "Notifications",
  profile: "Profile",
};

interface HeaderProps {
  userName: string;
  userRole: string;
  userEmail: string;
  avatarUrl?: string | null;
}

export function Header({
  userName,
  userRole,
  userEmail,
  avatarUrl,
}: HeaderProps) {
  const { unreadCount } = useUnreadCount();
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();

  const segments = pathname.split("/").filter(Boolean);

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="h-16 border-b bg-background flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-2 md:hidden">
        <Building2 className="h-6 w-6 text-primary" />
        <span className="font-bold text-lg">PropTech</span>
      </div>
      <nav className="hidden md:flex items-center gap-1 text-sm text-muted-foreground">
        {segments.map((segment, i) => {
          const href = "/" + segments.slice(0, i + 1).join("/");
          const isLast = i === segments.length - 1;
          const label = segmentLabels[segment] || (segment.length > 8 ? "Details" : segment);
          return (
            <Fragment key={href}>
              {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />}
              {isLast ? (
                <span className="text-foreground font-medium truncate max-w-[200px]">{label}</span>
              ) : (
                <Link href={href} className="hover:text-foreground transition-colors">{label}</Link>
              )}
            </Fragment>
          );
        })}
      </nav>

      <div className="flex items-center gap-3">
        <Link href="/notifications" className="relative">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>
        </Link>

        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={userName} />}
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-xs text-muted-foreground">{userEmail}</p>
                <Badge variant="secondary" className="w-fit text-xs mt-1">
                  {ROLE_LABELS[userRole] || userRole}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-red-600 focus:text-red-600"
              disabled={isPending}
              onClick={() => startTransition(() => logoutAction())}
            >
              <LogOut className="mr-2 h-4 w-4" />
              {isPending ? "Signing out..." : "Sign Out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
