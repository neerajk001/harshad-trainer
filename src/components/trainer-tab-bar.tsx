"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  {
    href: "/trainer",
    label: "Overview",
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} className="h-5 w-5">
        <path d="M4 13h6V4H4v9Zm10 7h6V4h-6v16ZM4 20h6v-4H4v4Z" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/trainer/clients",
    label: "Clients",
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} className="h-5 w-5">
        <circle cx="9" cy="8" r="3.2" />
        <path d="M2.8 19c1.2-3.2 3.6-4.6 6.2-4.6s5 1.4 6.2 4.6" strokeLinecap="round" />
        <path d="M16.5 6.2a3 3 0 0 1 0 5.6M17.5 19c-.2-1.3-.6-2.4-1.2-3.3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/trainer/programs",
    label: "Workouts",
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} className="h-5 w-5">
        <path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/trainer/diet-plans",
    label: "Nutrition",
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} className="h-5 w-5">
        <path d="M12 3c-4 3.5-7 6.6-7 11a7 7 0 0 0 14 0c0-4.4-3-7.5-7-11Z" strokeLinejoin="round" />
        <path d="M12 12v7" strokeLinecap="round" />
      </svg>
    ),
  },
];

export function TrainerTabBar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Trainer sections"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-zinc-950/95 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/85"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto grid max-w-xl grid-cols-4 px-2 pb-2 pt-1.5">
        {tabs.map((t) => {
          const active = t.href === "/trainer" ? pathname === "/trainer" : pathname.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[11px] font-medium transition ${
                active ? "text-lime-400" : "text-zinc-500 hover:text-zinc-200"
              }`}
            >
              <span className={`rounded-full px-3.5 py-1 ${active ? "bg-white/10" : ""}`}>{t.icon(active)}</span>
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
