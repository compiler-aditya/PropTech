"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Ticket,
  Building2,
  Bell,
  User,
  Users,
  BarChart3,
  Menu,
  LogOut,
} from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { logoutAction } from "@/actions/auth";
import { ROLE_LABELS } from "@/lib/constants";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles?: string[];
}

// Fixed 4 items on bottom bar (role-filtered)
const bottomItems: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/tickets", label: "Tickets", icon: Ticket },
  { href: "/properties", label: "Properties", icon: Building2, roles: ["MANAGER"] },
  { href: "/notifications", label: "Notifications", icon: Bell },
];

// All items in the hamburger drawer
const drawerItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tickets", label: "Tickets", icon: Ticket },
  { href: "/properties", label: "Properties", icon: Building2, roles: ["MANAGER"] },
  { href: "/users", label: "Users", icon: Users, roles: ["MANAGER"] },
  { href: "/analytics", label: "Analytics", icon: BarChart3, roles: ["MANAGER"] },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/profile", label: "Profile", icon: User },
];

interface MobileNavProps {
  userRole: string;
  userName: string;
  userEmail: string;
  avatarUrl?: string | null;
}

export function MobileNav({ userRole, userName, userEmail, avatarUrl }: MobileNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const visibleBottom = bottomItems.filter(
    (item) => !item.roles || item.roles.includes(userRole)
  );
  const visibleDrawer = drawerItems.filter(
    (item) => !item.roles || item.roles.includes(userRole)
  );

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      {/* ── Bottom navigation bar ─────────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t z-50">
        <div className="flex items-center h-16 px-1">
          {visibleBottom.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 py-1.5 rounded-lg text-xs font-medium transition-colors flex-1",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive && "text-primary")} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}

          {/* Hamburger / More button */}
          <button
            onClick={() => setOpen(true)}
            className={cn(
              "flex flex-col items-center gap-1 py-1.5 rounded-lg text-xs font-medium transition-colors flex-1",
              open ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Menu className={cn("h-5 w-5", open && "text-primary")} />
            <span>More</span>
          </button>
        </div>
      </nav>

      {/* ── Hamburger drawer (slides up from bottom) ──────────────────────── */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="md:hidden rounded-t-2xl p-0 max-h-[82vh] flex flex-col"
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>

          {/* User info header */}
          <div className="flex items-center gap-3 px-5 py-3 border-b shrink-0">
            <Avatar className="h-11 w-11 shrink-0">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={userName} />}
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-tight truncate">{userName}</p>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{userEmail}</p>
            </div>
            <Badge variant="secondary" className="text-xs shrink-0">
              {ROLE_LABELS[userRole] || userRole}
            </Badge>
          </div>

          {/* Nav items — scrollable */}
          <nav className="flex-1 overflow-y-auto px-3 py-2">
            {visibleDrawer.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon
                    className={cn("h-5 w-5 shrink-0", isActive ? "text-primary" : "text-muted-foreground")}
                  />
                  {item.label}
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Sign out */}
          <div className="shrink-0 px-3 pt-2 pb-6 border-t">
            <button
              disabled={isPending}
              onClick={() => startTransition(() => logoutAction())}
              className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors w-full"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              {isPending ? "Signing out..." : "Sign Out"}
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
