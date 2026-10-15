"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  {
    href: "/client",
    label: "Today",
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} className="h-5 w-5">
        <rect x="3" y="4" width="18" height="17" rx="3" />
        <path d="M8 2v4M16 2v4M3 9h18" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/client/workouts",
    label: "Workouts",
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} className="h-5 w-5">
        <path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/client/nutrition",
    label: "Nutrition",
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} className="h-5 w-5">
        <path d="M12 3c-4 3.5-7 6.6-7 11a7 7 0 0 0 14 0c0-4.4-3-7.5-7-11Z" strokeLinejoin="round" />
        <path d="M12 12v7" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/client/progress",
    label: "Progress",
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} className="h-5 w-5">
        <path d="M4 20V10M10 20V4M16 20v-8M22 20H2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/client/profile",
    label: "Profile",
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} className="h-5 w-5">
        <circle cx="12" cy="8" r="3.5" />
        <path d="M4.5 20c1.5-3.5 4.5-5 7.5-5s6 1.5 7.5 5" strokeLinecap="round" />
      </svg>
    ),
  },
];

export function ClientTabBar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Client sections"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-zinc-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto grid max-w-2xl grid-cols-5 px-2 pb-2 pt-1.5">
        {tabs.map((t) => {
          const active = t.href === "/client" ? pathname === "/client" : pathname.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[11px] font-medium transition ${
                active ? "text-lime-700" : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              <span className={`rounded-full px-4 py-1 ${active ? "bg-lime-100" : ""}`}>{t.icon(active)}</span>
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
