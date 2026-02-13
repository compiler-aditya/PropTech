import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const roleRouteAccess: Record<string, string[]> = {
  "/tickets/new": ["TENANT"],
  "/properties": ["MANAGER"],
  "/users": ["MANAGER"],
  "/properties/new": ["MANAGER"],
};

const publicPaths = ["/login", "/register"];

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!token;
  const userRole = token?.role ? String(token.role) : undefined;

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
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icon.svg|uploads/).*)",
  ],
};
