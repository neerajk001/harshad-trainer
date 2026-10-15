"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { clients, users } from "@/db/schema";
import { isDemoMode } from "@/lib/demo";
import { registerSchema } from "@/lib/validations";

export async function registerClientAction(formData: FormData) {
  if (isDemoMode()) {
    return { ok: false as const, error: "Sign-up is disabled in demo mode. Use the demo client account." };
  }
  if (!process.env.DATABASE_URL) {
    return { ok: false as const, error: "The database is not configured. Ask your trainer/admin." };
  }
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const email = parsed.data.email.toLowerCase().trim();
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) return { ok: false as const, error: "An account with this email already exists" };

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const [created] = await db
    .insert(users)
    .values({ name: parsed.data.name.trim(), email, role: "client", passwordHash })
    .returning({ id: users.id });
  await db.insert(clients).values({
    userId: created.id,
    trainerId: null,
    status: "active",
    onboardingCompleted: false,
  });
  return { ok: true as const };
}
