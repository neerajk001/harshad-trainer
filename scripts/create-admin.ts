import { config } from "dotenv";

// Load .env.local first (Next.js convention), then .env.
config({ path: [".env.local", ".env"] });

/**
 * Optional: pre-create/refresh a coach account row.
 *
 * Coaches are normally provisioned automatically the first time they sign in
 * with Google (see COACH_EMAILS), so this is only needed if you want the DB row
 * to exist before the first sign-in.
 *
 *   ADMIN_NAME="Coach Raj" ADMIN_EMAIL=coach@example.com npm run admin:create
 */
async function main() {
  const { db } = await import("../src/db");
  const { users } = await import("../src/db/schema");
  const { eq } = await import("drizzle-orm");

  if (!process.env.DATABASE_URL) throw new Error("Set DATABASE_URL (see .env.example)");
  const email = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const name = process.env.ADMIN_NAME?.trim() || "Coach";
  if (!email) throw new Error("Set ADMIN_EMAIL (see .env.example)");

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing[0]) {
    await db.update(users).set({ name, role: "trainer" }).where(eq(users.id, existing[0].id));
    console.log(`Updated trainer account: ${email}`);
    return;
  }
  await db.insert(users).values({ name, email, role: "trainer", passwordHash: "google-oauth-only" });
  console.log(`Created trainer account: ${email}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
