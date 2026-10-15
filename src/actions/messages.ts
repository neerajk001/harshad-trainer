"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { clients, messages } from "@/db/schema";
import { getSessionUser } from "@/lib/session";
import { demoOk, isDemoMode } from "@/lib/demo";
import { messageSchema } from "@/lib/validations";

function fail(message: string) {
  return { ok: false as const, error: message };
}

export async function sendMessageAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) return fail("Not signed in");
  if (isDemoMode()) return demoOk();
  const parsed = messageSchema.safeParse({ clientId: formData.get("clientId"), body: formData.get("body") });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");

  const crow = await db.select().from(clients).where(eq(clients.id, parsed.data.clientId)).limit(1);
  if (!crow[0]) return fail("Conversation not found");

  if (user.role === "trainer") {
    if (crow[0].trainerId !== user.id) return fail("Not authorized");
    await db.insert(messages).values({
      trainerId: user.id,
      clientId: crow[0].id,
      senderId: user.id,
      senderRole: "trainer",
      body: parsed.data.body.trim(),
    });
    revalidatePath(`/trainer/messages/${crow[0].id}`);
    revalidatePath("/trainer/messages");
    return { ok: true as const };
  }

  // client
  if (crow[0].userId !== user.id) return fail("Not authorized");
  if (!crow[0].trainerId) return fail("No trainer linked yet");
  await db.insert(messages).values({
    trainerId: crow[0].trainerId,
    clientId: crow[0].id,
    senderId: user.id,
    senderRole: "client",
    body: parsed.data.body.trim(),
  });
  revalidatePath("/client/messages");
  return { ok: true as const };
}

export async function markThreadReadAction(clientId: string) {
  const user = await getSessionUser();
  if (!user || isDemoMode()) return { ok: true as const };
  const theirRole = user.role === "trainer" ? "client" : "trainer";
  const crow = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
  if (!crow[0]) return fail("Not found");
  if (user.role === "trainer" && crow[0].trainerId !== user.id) return fail("Not authorized");
  if (user.role === "client" && crow[0].userId !== user.id) return fail("Not authorized");
  await db
    .update(messages)
    .set({ readAt: new Date() })
    .where(and(eq(messages.clientId, clientId), eq(messages.senderRole, theirRole), ne(messages.senderId, user.id)));
  revalidatePath(user.role === "trainer" ? `/trainer/messages/${clientId}` : "/client/messages");
  return { ok: true as const };
}
