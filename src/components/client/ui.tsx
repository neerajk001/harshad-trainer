import type { ReactNode } from "react";

export function CCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl border border-white/10 bg-zinc-900/70 p-5 ${className}`}>{children}</div>
  );
}

export function SectionTitle({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-base font-semibold text-zinc-100">{title}</h2>
      {action}
    </div>
  );
}

export function StatTile({
  label,
  value,
  sub,
  delta,
  positive,
}: {
  label: string;
  value: string;
  sub?: string;
  delta?: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-zinc-900/70 p-4">
      <p className="text-xs text-zinc-400">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight text-zinc-50">{value}</p>
      <div className="mt-0.5 flex items-center gap-1.5">
        {delta ? (
          <span className={`text-xs font-medium ${positive ? "text-emerald-400" : "text-amber-400"}`}>{delta}</span>
        ) : null}
        {sub ? <span className="text-xs text-zinc-500">{sub}</span> : null}
      </div>
    </div>
  );
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="rounded-3xl border border-dashed border-white/15 bg-zinc-900/40 p-8 text-center">
      <p className="font-medium text-zinc-100">{title}</p>
      {hint ? <p className="mt-1 text-sm text-zinc-500">{hint}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function Ring({
  value,
  max,
  size = 84,
  stroke = 9,
  children,
}: {
  value: number;
  max: number;
  size?: number;
  stroke?: number;
  children?: ReactNode;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.12)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#4ade80"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

export function MacroBar({
  label,
  value,
  max,
  unit = "g",
  tone = "gold",
}: {
  label: string;
  value: number;
  max: number | null;
  unit?: string;
  tone?: "gold" | "sky" | "rose" | "emerald";
}) {
  const colors: Record<string, string> = {
    gold: "bg-gold",
    sky: "bg-sky-400",
    rose: "bg-rose-400",
    emerald: "bg-emerald-400",
  };
  const pct = max && max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-400">{label}</span>
        <span className="text-zinc-300">
          {value}
          {max ? <span className="text-zinc-500"> / {max}{unit}</span> : <span className="text-zinc-500">{unit}</span>}
        </span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full ${colors[tone]}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "gold" | "green" | "amber" }) {
  const tones: Record<string, string> = {
    neutral: "bg-white/10 text-zinc-300",
    gold: "bg-gold/15 text-gold",
    green: "bg-emerald-500/15 text-emerald-400",
    amber: "bg-amber-500/15 text-amber-400",
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

export const cInput =
  "w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-base text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-gold/60 focus:ring-2 focus:ring-gold/20 [color-scheme:dark]";

export const goldBtn =
  "inline-flex items-center justify-center gap-2 rounded-2xl bg-gold px-5 py-3.5 text-base font-semibold text-zinc-950 transition hover:brightness-95 active:scale-[0.99] disabled:opacity-50";

export const ghostBtn =
  "inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:bg-white/10";
