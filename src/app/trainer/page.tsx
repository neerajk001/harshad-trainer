import Link from "next/link";

import { Avatar, Badge, DarkCard, EmptyState, PageHeader, Stat } from "@/components/ui";
import { getTrainerOverview } from "@/lib/queries";
import { requireTrainer } from "@/lib/session";
import { isDemoMode } from "@/lib/demo";

function timeAgo(value: Date | string) {
  const ms = Date.now() - new Date(value).getTime();
  if (ms < 60_000) return "just now";
  const mins = Math.floor(ms / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(value).toLocaleDateString();
}

export default async function TrainerOverview() {
  const user = await requireTrainer();
  if (!process.env.DATABASE_URL && !isDemoMode()) {
    return (
      <div>
        <PageHeader title={`Welcome, ${user.name}`} subtitle="Trainer overview" />
        <EmptyState title="DATABASE_URL is not configured" hint="Set DATABASE_URL in .env.local, run migrations + seed. See README." />
      </div>
    );
  }
  const data = await getTrainerOverview(user.id);

  const assignedCount = data.clientRows.filter((r) => r.client.goal).length;
  const attentionShare = data.totalClients
    ? Math.round((data.needingAttention.length / data.totalClients) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${user.name}`}
        subtitle="Clients, activity and who needs attention"
        action={
          <Link
            href="/trainer/clients"
            className="inline-flex items-center justify-center rounded-xl bg-lime-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-lime-700"
          >
            Manage clients
          </Link>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat variant="dark" label="Total clients" value={String(data.totalClients)} sub={`${assignedCount} with a goal`} />
        <Stat variant="dark" accent label="Active this week" value={String(data.activeClients)} sub={`of ${data.totalClients} clients`} />
        <Stat
          variant="dark"
          label="Needing attention"
          value={String(data.needingAttention.length)}
          sub={data.needingAttention.length ? "No activity in 7 days" : "Everyone logged in"}
        />
        <Stat variant="dark" label="Inactive share" value={`${attentionShare}%`} sub={`past 7 days`} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section aria-label="Clients needing attention">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.08em] text-zinc-400">Needs attention</h2>
          <DarkCard className="!p-2">
            {data.needingAttention.length === 0 ? (
              <div className="p-3">
                <EmptyState title="All caught up" hint="Every client logged something in the last 7 days." />
              </div>
            ) : (
              <ul className="divide-y divide-white/5">
                {data.needingAttention.map(({ client, user: u }) => (
                  <li key={client.id}>
                    <Link
                      href={`/trainer/clients/${client.id}`}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-white/5"
                    >
                      <Avatar name={u.name} size="md" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{u.name}</span>
                        <span className="block truncate text-xs text-zinc-500">{u.email}</span>
                      </span>
                      <Badge tone="amber">Inactive 7d+</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </DarkCard>
        </section>

        <section aria-label="Recent activity">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.08em] text-zinc-400">Recent activity</h2>
          <DarkCard className="!p-2">
            {data.recentLogs.length === 0 && data.recentCheckins.length === 0 ? (
              <div className="p-3">
                <EmptyState title="No activity yet" hint="Assign a plan and ask clients to log workouts and check-ins." />
              </div>
            ) : (
              <ul className="divide-y divide-white/5">
                {data.recentLogs.slice(0, 5).map((l) => {
                  const owner = data.clientRows.find((r) => r.client.id === l.clientId);
                  return (
                    <li key={l.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-lime-500/15 text-xs font-bold text-lime-400">
                          ✓
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm">Workout completed</span>
                          {owner ? <span className="block truncate text-xs text-zinc-500">{owner.user.name}</span> : null}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs text-zinc-500">{timeAgo(l.completedAt)}</span>
                    </li>
                  );
                })}
                {data.recentCheckins.slice(0, 5).map((c) => {
                  const owner = data.clientRows.find((r) => r.client.id === c.clientId);
                  return (
                    <li key={c.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-zinc-300">
                          ↔
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm">Check-in · {c.weight} kg</span>
                          {owner ? <span className="block truncate text-xs text-zinc-500">{owner.user.name}</span> : null}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs text-zinc-500">{timeAgo(c.createdAt)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </DarkCard>
        </section>
      </div>

      {data.totalClients > 0 ? (
        <p className="text-xs text-zinc-600">Weekly activity window is the last 7 days.</p>
      ) : null}
    </div>
  );
}
