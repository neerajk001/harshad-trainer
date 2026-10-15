import Link from "next/link";
import type { ReactNode } from "react";

import { ClientTabBar } from "@/components/client-nav";
import { SignOutButton } from "@/components/SignOutButton";
import { Avatar } from "@/components/ui";
import { requireClient } from "@/lib/session";

const links = [
  { href: "/client", label: "Today" },
  { href: "/client/workouts", label: "Workouts" },
  { href: "/client/nutrition", label: "Nutrition" },
  { href: "/client/progress", label: "Progress" },
  { href: "/client/profile", label: "Profile" },
];

export default async function ClientLayout({ children }: { children: ReactNode }) {
  const { user } = await requireClient();
  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-900">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/client" className="flex items-center gap-2.5">
            <Avatar name={user.name} size="sm" />
            <span>
              <span className="block text-sm font-bold uppercase leading-none tracking-[0.18em] text-lime-700">
                Repora
              </span>
              <span className="mt-0.5 block max-w-40 truncate text-xs text-zinc-500">{user.name}</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <nav className="mr-1 hidden items-center gap-1 text-sm md:flex" aria-label="Client sections">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="rounded-full px-3 py-1.5 font-medium text-zinc-600 hover:bg-lime-100 hover:text-lime-800"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-2xl px-4 pb-28 pt-5 md:pb-16">{children}</main>
      <div className="md:hidden">
        <ClientTabBar />
      </div>
    </div>
  );
}
