import Link from "next/link";

import { CCard, EmptyState, SectionTitle, StatTile } from "@/components/client/ui";
import { MultiLineChart } from "@/components/coach/multi-line-chart";
import { getTrainerDashboard } from "@/lib/coach-queries";
import { requireTrainer } from "@/lib/session";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default async function CoachHome() {
  const user = await requireTrainer();
  if (!process.env.DATABASE_URL) {
    return <EmptyState title="DATABASE_URL is not configured" hint="Set DATABASE_URL in .env.local and run migrations. See README." />;
  }
  const data = await getTrainerDashboard(user.id);
  const first = user.name?.split(" ")[0] ?? "Coach";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {greeting()}, {first} <span aria-hidden>👋</span>
          </h1>
          <p className="mt-1 text-sm text-zinc-500">Here&apos;s your coaching overview.</p>
        </div>
        <span className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-zinc-400">Last 7 days</span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatTile label="Total Clients" value={String(data.totalClients)} />
        <StatTile label="Active Clients" value={String(data.activeClients)} sub={`of ${data.totalClients}`} />
        <StatTile label="Check-ins" value={String(data.checkinsThisWeek)} sub="this week" />
      </div>

      <section aria-label="Client progress">
        <SectionTitle title="Client Progress" />
        <CCard>
          {data.progressSeries.length === 0 ? (
            <p className="py-4 text-center text-sm text-zinc-500">No check-in data yet.</p>
          ) : (
            <>
              <div className="mb-2 flex flex-wrap gap-3">
                {data.progressSeries.map((s) => (
                  <span key={s.name} className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <span className="h-2 w-2 rounded-full bg-gold" />
                    {s.name}
                  </span>
                ))}
              </div>
              <MultiLineChart
                height={150}
                className="h-36 w-full"
                series={data.progressSeries.map((s, i) => ({
                  name: s.name,
                  values: s.points.map((p) => p.weight),
                  color: ["#f5c518", "#4ade80", "#60a5fa"][i % 3],
                }))}
              />
            </>
          )}
        </CCard>
      </section>

      <section aria-label="Today's tasks">
        <SectionTitle title="Today's Tasks" />
        <div className="space-y-2.5">
          {data.newInquiries > 0 ? (
            <TaskRow href="/trainer/inquiries" tint="#60a5fa" title={`${data.newInquiries} new inquir${data.newInquiries === 1 ? "y" : "ies"} to review`} />
          ) : null}
          <TaskRow
            href="/trainer/checkins"
            tint="#f5c518"
            title={`${data.pendingCheckins.length} pending check-in review${data.pendingCheckins.length === 1 ? "" : "s"}`}
          />
          <TaskRow
            href="/trainer/clients"
            tint="#f97316"
            title={`${data.needingAttention.length} client${data.needingAttention.length === 1 ? "" : "s"} need attention`}
          />
        </div>
      </section>
    </div>
  );
}

function TaskRow({ href, tint, title }: { href: string; tint: string; title: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-3xl border border-white/10 bg-zinc-900/70 px-4 py-3.5 transition hover:bg-zinc-900">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl" style={{ background: `${tint}22` }}>
        <span className="h-3.5 w-3.5 rounded-full" style={{ background: tint }} />
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-medium">{title}</span>
      <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-zinc-600" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}
