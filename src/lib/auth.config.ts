import type { NextAuthConfig } from "next-auth";

/**
 * Edge-compatible auth config (no prisma, no bcrypt).
 * Used by middleware and extended by the full auth.ts.
 */
export const authConfig: NextAuthConfig = {
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user && user.id) {
        token.id = String(user.id);
        token.role = String(user.role ?? "TENANT");
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id ?? "");
        session.user.role = String(token.role ?? "TENANT");
      }
      return session;
    },
  },
  providers: [], // Providers added in auth.ts (needs Node.js runtime)
};
