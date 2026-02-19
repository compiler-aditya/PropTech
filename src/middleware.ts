import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

const roleRouteAccess: Record<string, string[]> = {
  "/tickets/new": ["TENANT"],
  "/properties": ["MANAGER"],
  "/users": ["MANAGER"],
  "/properties/new": ["MANAGER"],
  "/analytics": ["MANAGER"],
};

const publicPaths = ["/login", "/register"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!req.auth;
  const userRole = req.auth?.user?.role;

  // Allow public paths
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // Root redirect
  if (pathname === "/") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Protected routes require auth
  if (!isAuthenticated) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Role-based access
  for (const [route, allowedRoles] of Object.entries(roleRouteAccess)) {
    if (pathname.startsWith(route) && userRole && !allowedRoles.includes(userRole)) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icon.svg|uploads/).*)",
  ],
};
