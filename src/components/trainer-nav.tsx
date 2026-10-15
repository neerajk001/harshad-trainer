"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/trainer", label: "Overview" },
  { href: "/trainer/clients", label: "Clients" },
  { href: "/trainer/programs", label: "Workouts" },
  { href: "/trainer/diet-plans", label: "Nutrition" },
];

export function TrainerNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Trainer sections" className="flex items-center gap-1 overflow-x-auto text-sm">
      {links.map((l) => {
        const active = l.href === "/trainer" ? pathname === "/trainer" : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 font-medium transition ${
              active ? "bg-white/10 text-white" : "text-zinc-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
