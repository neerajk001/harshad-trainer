"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  {
    href: "/client",
    label: "Home",
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} className="h-5 w-5">
        <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1v-9.5Z" strokeLinejoin="round" />
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
    label: "More",
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} className="h-5 w-5">
        <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
      </svg>
    ),
  },
];

export function ClientTabBar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Client sections"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-800 bg-ink"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto grid max-w-md grid-cols-5 px-2 pb-2 pt-1.5">
        {tabs.map((t) => {
          const active = t.href === "/client" ? pathname === "/client" : pathname.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg px-1 py-1 text-[11px] font-medium transition ${
                active ? "text-white" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {t.icon(active)}
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
