import { and, desc, eq, gte, inArray, isNull } from "drizzle-orm";

import { db } from "@/db";
import {
  clients,
  messages,
  progressCheckins,
  users,
  workoutAssignments,
  workoutLogs,
  workoutPrograms,
} from "@/db/schema";
import { getDemoClients, getDemoOverview, isDemoMode } from "@/lib/demo";

const DAY = 86_400_000;

async function trainerClientRows(trainerId: string) {
  return db
    .select({ client: clients, user: users })
    .from(clients)
    .innerJoin(users, eq(users.id, clients.userId))
    .where(eq(clients.trainerId, trainerId));
}

export async function getTrainerDashboard(trainerId: string) {
  if (isDemoMode()) {
    const o = getDemoOverview(trainerId);
    return {
      totalClients: o.totalClients,
      activeClients: o.activeClients,
      checkinsThisWeek: o.recentCheckins.length,
      needingAttention: o.needingAttention,
      pendingCheckins: [],
      unassignedCount: 0,
      progressSeries: [] as Array<{ name: string; points: Array<{ date: Date; weight: number; bodyFat: number | null }> }>,
      clientRows: o.clientRows,
    };
  }
  const rows = await trainerClientRows(trainerId);
  const clientIds = rows.map((r) => r.client.id);
  const since30 = new Date(Date.now() - 30 * DAY);
  const since7 = new Date(Date.now() - 7 * DAY);

  const logs30 = clientIds.length
    ? await db
        .select()
        .from(workoutLogs)
        .where(and(inArray(workoutLogs.clientId, clientIds), gte(workoutLogs.completedAt, since30)))
        .orderBy(desc(workoutLogs.completedAt))
    : [];
  const checkins = clientIds.length
    ? await db
        .select()
        .from(progressCheckins)
        .where(inArray(progressCheckins.clientId, clientIds))
        .orderBy(desc(progressCheckins.createdAt))
    : [];

  const activeIds = new Set<string>();
  for (const l of logs30) if (l.completedAt.getTime() > since7.getTime()) activeIds.add(l.clientId);
  for (const c of checkins) if (c.createdAt.getTime() > since7.getTime()) activeIds.add(c.clientId);

  const needingAttention = rows.filter((r) => !activeIds.has(r.client.id)).slice(0, 8);
  const pendingCheckins = checkins.filter((c) => c.status === "pending").slice(0, 8);
  const checkinsThisWeek = checkins.filter((c) => c.createdAt.getTime() > since7.getTime()).length;

  // Group logs per client (used to rank who to chart).
  const logsByClient = new Map<string, number>();
  for (const l of logs30) logsByClient.set(l.clientId, (logsByClient.get(l.clientId) ?? 0) + 1);

  // Progress series for the 3 most active clients.
  const ranked = [...rows]
    .sort((a, b) => (logsByClient.get(b.client.id) ?? 0) - (logsByClient.get(a.client.id) ?? 0))
    .filter((r) => checkins.some((c) => c.clientId === r.client.id))
    .slice(0, 3);
  const progressSeries = ranked.map((r) => ({
    name: r.user.name,
    points: checkins
      .filter((c) => c.clientId === r.client.id)
      .slice(0, 8)
      .reverse()
      .map((c) => ({ date: c.createdAt, weight: c.weight, bodyFat: c.bodyFatPercent })),
  }));

  const unassigned = await db.select({ id: clients.id }).from(clients).where(isNull(clients.trainerId));

  return {
    totalClients: rows.length,
    activeClients: activeIds.size,
    checkinsThisWeek,
    needingAttention,
    pendingCheckins,
    unassignedCount: unassigned.length,
    progressSeries,
    clientRows: rows,
  };
}

export async function getUnassignedClients() {
  if (isDemoMode()) return [];
  return db
    .select({ client: clients, user: users })
    .from(clients)
    .innerJoin(users, eq(users.id, clients.userId))
    .where(isNull(clients.trainerId));
}

export async function getTrainerClientsMeta(trainerId: string) {
  if (isDemoMode()) {
    const rows = getDemoClients(trainerId);
    return { rows: rows.map((r) => ({ ...r, meta: { atRisk: false, programName: null, durationWeeks: null, latestWeight: null } })), counts: { all: rows.length, active: rows.length, atRisk: 0 } };
  }
  const rows = await trainerClientRows(trainerId);
  const clientIds = rows.map((r) => r.client.id);
  const since7 = new Date(Date.now() - 7 * DAY);
  const logs = clientIds.length
    ? await db.select().from(workoutLogs).where(inArray(workoutLogs.clientId, clientIds))
    : [];
  const checkins = clientIds.length
    ? await db.select().from(progressCheckins).where(inArray(progressCheckins.clientId, clientIds)).orderBy(desc(progressCheckins.createdAt))
    : [];
  const assigns = clientIds.length
    ? await db
        .select({ a: workoutAssignments, p: workoutPrograms })
        .from(workoutAssignments)
        .innerJoin(workoutPrograms, eq(workoutPrograms.id, workoutAssignments.programId))
        .where(inArray(workoutAssignments.clientId, clientIds))
        .orderBy(desc(workoutAssignments.createdAt))
    : [];

  const meta = rows.map((r) => {
    const active =
      logs.some((l) => l.clientId === r.client.id && l.completedAt.getTime() > since7.getTime()) ||
      checkins.some((c) => c.clientId === r.client.id && c.createdAt.getTime() > since7.getTime());
    const assign = assigns.find((a) => a.a.clientId === r.client.id);
    const latest = checkins.find((c) => c.clientId === r.client.id);
    return {
      ...r,
      meta: {
        atRisk: !active && r.client.status === "active",
        programName: assign?.p.name ?? null,
        durationWeeks: assign?.p.durationWeeks ?? null,
        latestWeight: latest?.weight ?? null,
      },
    };
  });
  return {
    rows: meta,
    counts: {
      all: meta.length,
      active: meta.filter((r) => r.meta.atRisk === false).length,
      atRisk: meta.filter((r) => r.meta.atRisk).length,
    },
  };
}

export async function getClientProgressData(trainerId: string, clientId: string) {
  const crow = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
  if (!crow[0] || crow[0].trainerId !== trainerId) return null;
  const urow = await db.select().from(users).where(eq(users.id, crow[0].userId)).limit(1);
  const checkins = await db
    .select()
    .from(progressCheckins)
    .where(eq(progressCheckins.clientId, clientId))
    .orderBy(desc(progressCheckins.createdAt));
  return { client: crow[0], user: urow[0], checkins };
}

export async function getTrainerCheckins(trainerId: string, status?: "pending" | "reviewed") {
  if (isDemoMode()) return [];
  const rows = await trainerClientRows(trainerId);
  const clientIds = rows.map((r) => r.client.id);
  if (clientIds.length === 0) return [];
  const all = await db
    .select({ checkin: progressCheckins, user: users })
    .from(progressCheckins)
    .innerJoin(clients, eq(clients.id, progressCheckins.clientId))
    .innerJoin(users, eq(users.id, clients.userId))
    .where(inArray(progressCheckins.clientId, clientIds))
    .orderBy(desc(progressCheckins.createdAt));
  if (status === "pending") return all.filter((r) => r.checkin.status === "pending");
  if (status === "reviewed") return all.filter((r) => r.checkin.status !== "pending");
  return all;
}

export async function getCheckinDetail(trainerId: string, checkinId: string) {
  if (isDemoMode()) return null;
  const rows = await db
    .select({ checkin: progressCheckins, client: clients, user: users })
    .from(progressCheckins)
    .innerJoin(clients, eq(clients.id, progressCheckins.clientId))
    .innerJoin(users, eq(users.id, clients.userId))
    .where(eq(progressCheckins.id, checkinId))
    .limit(1);
  const row = rows[0];
  if (!row || row.client.trainerId !== trainerId) return null;
  return row;
}

export async function getConversations(trainerId: string) {
  if (isDemoMode()) {
    const rows = getDemoClients(trainerId);
    return rows.map((r) => ({ client: r.client, user: r.user, lastMessage: null as null | { body: string; createdAt: Date; senderRole: string }, unread: 0 }));
  }
  const rows = await trainerClientRows(trainerId);
  const clientIds = rows.map((r) => r.client.id);
  const msgs = clientIds.length
    ? await db.select().from(messages).where(inArray(messages.clientId, clientIds)).orderBy(desc(messages.createdAt))
    : [];
  return rows.map((r) => {
    const thread = msgs.filter((m) => m.clientId === r.client.id);
    const last = thread[0] ?? null;
    const unread = thread.filter((m) => m.senderRole === "client" && !m.readAt).length;
    return {
      client: r.client,
      user: r.user,
      lastMessage: last ? { body: last.body, createdAt: last.createdAt, senderRole: last.senderRole } : null,
      unread,
    };
  });
}

export async function getThread(trainerId: string, clientId: string) {
  if (isDemoMode()) return null;
  const crow = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
  if (!crow[0] || crow[0].trainerId !== trainerId) return null;
  const urow = await db.select().from(users).where(eq(users.id, crow[0].userId)).limit(1);
  if (!urow[0]) return null;
  const msgs = await db.select().from(messages).where(eq(messages.clientId, clientId)).orderBy(messages.createdAt);
  return { messages: msgs, user: urow[0], client: crow[0] };
}

/** Client-side inbox: the single thread with their trainer. */
export async function getClientThread(clientId: string, trainerId: string | null) {
  if (!trainerId) return { messages: [], trainer: null };
  if (isDemoMode()) return { messages: [], trainer: null };
  const trow = await db.select().from(users).where(eq(users.id, trainerId)).limit(1);
  const msgs = await db.select().from(messages).where(eq(messages.clientId, clientId)).orderBy(messages.createdAt);
  return { messages: msgs, trainer: trow[0] ?? null };
}
