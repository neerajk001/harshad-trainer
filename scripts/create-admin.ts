import { config } from "dotenv";

// Load .env.local first (Next.js convention), then .env.
config({ path: [".env.local", ".env"] });

/**
 * Bootstrap the first trainer/coach account from environment variables.
 * There is deliberately no public sign-up — only the coach provisions accounts.
 *
 *   ADMIN_NAME="Coach Raj" ADMIN_EMAIL=coach@example.com ADMIN_PASSWORD=... npm run admin:create
 */
async function main() {
  const { db } = await import("../src/db");
  const { users } = await import("../src/db/schema");
  const bcrypt = (await import("bcryptjs")).default;
  const { eq } = await import("drizzle-orm");

  if (!process.env.DATABASE_URL) throw new Error("Set DATABASE_URL (see .env.example)");
  const email = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || "Coach";
  if (!email || !password) throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD (see .env.example)");
  if (password.length < 8) throw new Error("ADMIN_PASSWORD must be at least 8 characters");

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const passwordHash = await bcrypt.hash(password, 10);
  if (existing[0]) {
    await db.update(users).set({ passwordHash, name, role: "trainer" }).where(eq(users.id, existing[0].id));
    console.log(`Updated trainer account: ${email}`);
    return;
  }
  await db.insert(users).values({ name, email, role: "trainer", passwordHash });
  console.log(`Created trainer account: ${email}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
