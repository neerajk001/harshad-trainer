import Link from "next/link";

import { EmptyState } from "@/components/client/ui";
import { getTrainerNotifications } from "@/lib/coach-queries";
import { requireTrainer } from "@/lib/session";
import { timeAgo } from "@/lib/client-utils";

const ICONS: Record<string, { tint: string; glyph: string }> = {
  checkin: { tint: "#f5c518", glyph: "↔" },
  workout: { tint: "#4ade80", glyph: "✓" },
  message: { tint: "#60a5fa", glyph: "✉" },
};

export default async function NotificationsPage() {
  const user = await requireTrainer();
  const items = await getTrainerNotifications(user.id);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>

      {items.length === 0 ? (
        <EmptyState title="No notifications" hint="Client activity will show up here." />
      ) : (
        <div className="space-y-2.5">
          {items.map((n) => {
            const icon = ICONS[n.kind];
            const href = n.kind === "message" ? "/trainer/messages" : n.kind === "checkin" ? "/trainer/checkins" : "/trainer/clients";
            return (
              <Link key={`${n.kind}-${n.id}`} href={href} className="flex items-center gap-3 rounded-3xl border border-white/10 bg-zinc-900/70 px-4 py-3.5 transition hover:bg-zinc-900">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl text-sm" style={{ background: `${icon.tint}22`, color: icon.tint }}>
                  {icon.glyph}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">
                    <span className="font-medium">{n.name}</span> {n.text}
                  </span>
                  <span className="block text-xs text-zinc-500">{timeAgo(n.at)}</span>
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
