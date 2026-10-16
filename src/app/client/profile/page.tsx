import Link from "next/link";

import { CCard } from "@/components/client/ui";
import { SignOutButton } from "@/components/SignOutButton";
import { getClientDashboard, getClientProfile } from "@/lib/client-queries";
import { requireClient } from "@/lib/session";
import { goalLabel } from "@/lib/client-utils";

export default async function ProfilePage() {
  const { user } = await requireClient();
  const profile = await getClientProfile(user.id);
  if (!profile) return <p className="text-sm text-zinc-500">Profile not found.</p>;
  const data = await getClientDashboard(profile.client.id);

  const initials = (profile.user.name ?? "R").trim().slice(0, 1).toUpperCase();
  const planLabel = data.wAssign ? `${data.wAssign.program.name} (${data.wAssign.program.durationWeeks} Weeks)` : null;

  const rows = [
    { label: "My Goal", value: goalLabel(profile.client.goal) ?? "Not set", href: null as string | null },
    { label: "My Plan", value: planLabel ?? "No plan yet", href: "/client/workouts" as string | null },
    { label: "Progress", value: "", href: "/client/progress" },
    { label: "Measurements", value: "", href: "/client/progress?tab=measure" },
    { label: "Messages", value: "", href: "/client/messages" },
  ];

  return (
    <div className="space-y-5">
      <CCard className="flex items-center gap-4">
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-zinc-100 text-2xl font-bold text-zinc-950">{initials}</span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-semibold tracking-tight">{profile.user.name}</h1>
          <p className="truncate text-sm text-zinc-500">{profile.user.email}</p>
        </div>
      </CCard>

      <CCard className="!p-2">
        <ul className="divide-y divide-zinc-800">
          {rows.map((r) => {
            const inner = (
              <span className="flex items-center gap-3 px-3 py-3.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-zinc-800 bg-zinc-800/50">
                  <span className="h-3.5 w-3.5 rounded-sm bg-zinc-400" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{r.label}</span>
                  {r.value ? <span className="block truncate text-xs text-zinc-500">{r.value}</span> : null}
                </span>
                {r.href ? (
                  <svg viewBox="0 0 24 24" className="h-5 w-5 text-zinc-600" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : null}
              </span>
            );
            return (
              <li key={r.label}>
                {r.href ? (
                  <Link href={r.href} className="block rounded-lg transition hover:bg-zinc-800/50">
                    {inner}
                  </Link>
                ) : (
                  <div>{inner}</div>
                )}
              </li>
            );
          })}
        </ul>
      </CCard>

      <SignOutButton className="w-full rounded-lg border border-red-500/30 px-5 py-3.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/10" />

      <p className="text-center text-xs text-zinc-600">
        {profile.trainer ? `Trainer: ${profile.trainer.name}` : "No trainer linked yet"}
      </p>
    </div>
  );
}
