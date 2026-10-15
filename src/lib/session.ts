import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { auth } from "@/../auth";
import { db } from "@/db";
import { clients } from "@/db/schema";

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
  const rows = await db.select().from(clients).where(eq(clients.userId, user.id)).limit(1);
  const client = rows[0];
  if (!client) redirect("/login");
  return { user, client };
}

export async function requireTrainerClient(clientId: string) {
  const user = await requireTrainer();
  const rows = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
  const client = rows[0];
  if (!client || client.trainerId !== user.id) redirect("/trainer/clients");
  return { user, client };
}
