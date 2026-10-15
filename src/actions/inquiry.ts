"use server";

import { db } from "@/db";
import { inquiries } from "@/db/schema";
import { inquirySchema } from "@/lib/validations";

/**
 * Public "request access" form. This does NOT create an account — it records an
 * inquiry that a coach reviews. Only coach-approved people get a login.
 */
export async function submitInquiryAction(formData: FormData) {
  if (!process.env.DATABASE_URL) {
    return { ok: false as const, error: "The service is not configured. Please try again later." };
  }
  const parsed = inquirySchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    goal: formData.get("goal") || undefined,
    message: formData.get("message") || undefined,
  });
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  await db.insert(inquiries).values({
    name: parsed.data.name.trim(),
    email: parsed.data.email.toLowerCase().trim(),
    phone: parsed.data.phone?.trim() || null,
    goal: parsed.data.goal?.trim() || null,
    message: parsed.data.message?.trim() || null,
  });
  return { ok: true as const };
}
