import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 ${className}`}>
      {children}
    </div>
  );
}

export function DarkCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-zinc-900 p-5 text-zinc-100 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-zinc-500">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function SectionTitle({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-zinc-500">{title}</h2>
        {hint ? <p className="mt-0.5 text-xs text-zinc-400">{hint}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Stat({
  label,
  value,
  sub,
  accent,
  variant = "light",
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  variant?: "light" | "dark";
}) {
  if (variant === "dark") {
    return (
      <div className="rounded-2xl border border-white/10 bg-zinc-900 p-4 shadow-sm">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-400">{label}</p>
        <p className={`mt-1 text-2xl font-semibold tracking-tight ${accent ? "text-lime-400" : "text-zinc-100"}`}>{value}</p>
        {sub ? <p className="mt-0.5 text-xs text-zinc-500">{sub}</p> : null}
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-3.5 shadow-sm">
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-500">{label}</p>
      <p className={`mt-1 text-xl font-semibold tracking-tight ${accent ? "text-lime-700" : ""}`}>{value}</p>
      {sub ? <p className="mt-0.5 text-xs text-zinc-500">{sub}</p> : null}
    </div>
  );
}

export function Field({
  label,
  children,
  className = "",
  hint,
}: {
  label: string;
  children: ReactNode;
  className?: string;
  hint?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-zinc-400">{hint}</span> : null}
    </label>
  );
}

export function SectionHeading({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-zinc-400">{title}</h2>
        {hint ? <p className="mt-0.5 text-xs text-zinc-500">{hint}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function ProgressBar({ value, max, tone = "lime" }: { value: number; max: number; tone?: "lime" | "amber" }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div
      className="h-2 overflow-hidden rounded-full bg-zinc-100"
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemax={max}
      aria-valuemin={0}
    >
      <div
        className={`h-full rounded-full transition-all ${tone === "amber" ? "bg-amber-500" : "bg-lime-600"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function Avatar({ name, size = "md" }: { name?: string | null; size?: "sm" | "md" | "lg" }) {
  const initial = (name?.trim()?.[0] ?? "R").toUpperCase();
  const sizes = { sm: "h-8 w-8 text-sm", md: "h-11 w-11 text-lg", lg: "h-16 w-16 text-2xl" };
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-lime-700 font-semibold text-white ${sizes[size]}`}
    >
      {initial}
    </span>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
      <p className="font-medium">{title}</p>
      {hint ? <p className="mt-1 text-sm text-zinc-500">{hint}</p> : null}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-zinc-200/70 dark:bg-zinc-800/70 ${className}`} />;
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "green" | "amber" }) {
  const tones: Record<string, string> = {
    neutral: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200",
    green: "bg-lime-100 text-lime-800 dark:bg-lime-900/40 dark:text-lime-200",
    amber: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

export const inputCls =
  "w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-base outline-none transition focus:border-lime-600 focus:ring-2 focus:ring-lime-600/20 sm:py-2 sm:text-sm dark:border-zinc-700 dark:bg-zinc-900";

export const inputDarkCls =
  "w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2.5 text-base text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-gold/60 focus:ring-2 focus:ring-gold/20 sm:py-2 sm:text-sm";

export const btnPrimaryCls =
  "inline-flex items-center justify-center rounded-xl bg-gold px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:opacity-50";

export const btnSecondaryCls =
  "inline-flex items-center justify-center rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800";

export const btnDangerCls =
  "inline-flex min-h-9 items-center justify-center rounded-xl border border-red-500/30 px-3.5 py-2 text-xs font-medium text-red-400 transition hover:bg-red-500/10 disabled:opacity-50";
