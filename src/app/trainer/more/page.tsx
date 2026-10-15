import Link from "next/link";

import { CCard } from "@/components/client/ui";
import { SignOutButton } from "@/components/SignOutButton";
import { requireTrainer } from "@/lib/session";

export default async function MorePage() {
  const user = await requireTrainer();
  const initials = (user.name ?? "C").split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();

  const rows = [
    { label: "Business Profile", href: "/trainer/settings", tint: "#f5c518" },
    { label: "Exercise Library", href: "/trainer/programs", tint: "#f97316" },
    { label: "Food Database", href: "/trainer/diet-plans", tint: "#f472b6" },
  ];

  return (
    <div className="space-y-5">
      <CCard className="flex items-center gap-4">
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-gold text-2xl font-bold text-zinc-950">{initials}</span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-semibold tracking-tight">{user.name}</h1>
          <p className="truncate text-sm text-zinc-500">Personal Trainer</p>
        </div>
      </CCard>

      <CCard className="!p-2">
        <ul className="divide-y divide-white/5">
          {rows.map((r) => (
            <li key={r.label}>
              <Link href={r.href} className="flex items-center gap-3 rounded-2xl px-3 py-3.5 transition hover:bg-white/5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl" style={{ background: `${r.tint}22` }}>
                  <span className="h-3.5 w-3.5 rounded-full" style={{ background: r.tint }} />
                </span>
                <span className="min-w-0 flex-1 text-sm font-medium">{r.label}</span>
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-zinc-600" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </li>
          ))}
        </ul>
      </CCard>

      <SignOutButton className="w-full rounded-2xl border border-red-500/30 px-5 py-3.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/10" />
    </div>
  );
}
