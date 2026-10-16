"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  {
    href: "/trainer",
    label: "Home",
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} className="h-5 w-5">
        <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1v-9.5Z" strokeLinejoin="round" />
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
    label: "Programs",
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} className="h-5 w-5">
        <path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/trainer/messages",
    label: "Messages",
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} className="h-5 w-5">
        <path d="M4 5h16v11H8l-4 4V5Z" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/trainer/more",
    label: "More",
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} className="h-5 w-5">
        <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
      </svg>
    ),
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/trainer") return pathname === "/trainer";
  return pathname.startsWith(href);
}

export function CoachTabBar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Coach sections"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-800 bg-ink"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto grid max-w-md grid-cols-5 px-2 pb-2 pt-1.5">
        {tabs.map((t) => {
          const active = isActive(pathname, t.href);
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

export function CoachNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Coach sections" className="flex items-center gap-1 text-sm">
      {tabs
        .filter((t) => t.href !== "/trainer/more")
        .map((t) => {
          const active = isActive(pathname, t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? "page" : undefined}
              className={`rounded-lg px-3 py-2 font-medium transition ${
                active ? "bg-zinc-800 text-white" : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
    </nav>
  );
}
