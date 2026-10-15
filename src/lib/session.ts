import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { auth } from "@/../auth";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { demoClientForUser, isDemoMode } from "@/lib/demo";

export async function getSessionUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireTrainer() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "trainer") redirect("/client");
  return user;
}

export async function requireClient() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "client") redirect("/trainer");
  if (isDemoMode()) {
    const client = demoClientForUser(user.id) ?? demoClientForUser("22222222-2222-4222-8222-222222222222");
    if (!client) redirect("/login");
    return { user, client };
  }
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured");
  const rows = await db.select().from(clients).where(eq(clients.userId, user.id)).limit(1);
  const client = rows[0];
  if (!client) redirect("/login");
  return { user, client };
}

export async function requireTrainerClient(clientId: string) {
  const user = await requireTrainer();
  if (isDemoMode()) {
    // In demo mode the trainer owns every demo client; verify the id exists.
    const { getDemoClients } = await import("@/lib/demo");
    const found = getDemoClients(user.id).find((r) => r.client.id === clientId);
    if (!found) redirect("/trainer/clients");
    return { user, client: found.client };
  }
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured");
  const rows = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
  const client = rows[0];
  if (!client || client.trainerId !== user.id) redirect("/trainer/clients");
  return { user, client };
}
