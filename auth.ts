import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

import { db } from "@/db";
import { users } from "@/db/schema";
import { COACH_EMAILS, isCoachEmail } from "@/lib/coach-emails";

/**
 * Google is the only sign-in method. There is no public sign-up and no
 * password login. Access rules:
 *   - A coach email (see COACH_EMAILS) is always allowed and is provisioned as
 *     a trainer on first sign-in.
 *   - Any other email is allowed only if a coach has already added it as a
 *     client (i.e. a matching row exists in `users`).
 *   - Everyone else is denied.
 * `password_hash` is a required column but unused; we store a marker.
 */
const NO_PASSWORD = "google-oauth-only";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login", error: "/login" },
  providers: [Google],
  callbacks: {
    async signIn({ user }) {
      const email = user.email?.toLowerCase().trim();
      if (!email || !process.env.DATABASE_URL) return false;
      if (isCoachEmail(email)) return true;
      const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
      return existing.length > 0;
    },
    async jwt({ token, user }) {
      // Resolve the database user (and role/id) only on the initial sign-in.
      if (user && process.env.DATABASE_URL) {
        const email = user.email?.toLowerCase().trim();
        if (email) {
          const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
          let dbUser = rows[0];
          if (!dbUser && COACH_EMAILS.includes(email)) {
            const inserted = await db
              .insert(users)
              .values({ name: user.name?.trim() || "Coach", email, role: "trainer", passwordHash: NO_PASSWORD })
              .returning();
            dbUser = inserted[0];
          }
          if (dbUser) {
            token.uid = dbUser.id;
            token.role = dbUser.role;
            token.name = dbUser.name;
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.uid as string) ?? token.sub ?? "";
        session.user.role = (token.role as "trainer" | "client" | undefined) ?? "client";
      }
      return session;
    },
  },
});
