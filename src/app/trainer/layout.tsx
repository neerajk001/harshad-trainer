import Link from "next/link";
import type { ReactNode } from "react";
import type { Viewport } from "next";

import { requireTrainer } from "@/lib/session";
import { SignOutButton } from "@/components/SignOutButton";
import { CoachNav, CoachTabBar } from "@/components/coach/coach-nav";

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
};

function initials(name?: string | null) {
  return (name ?? "C")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function TrainerLayout({ children }: { children: ReactNode }) {
  const user = await requireTrainer();
  return (
    <div className="min-h-dvh bg-ink text-zinc-100 [color-scheme:dark]">
      <header className="sticky top-0 z-20 border-b border-zinc-800 bg-ink">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex min-w-0 items-center gap-5">
            <Link href="/trainer" className="flex shrink-0 items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg border border-zinc-800">
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-zinc-100" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M5 7h14M5 12h9M5 17h5" strokeLinecap="round" />
                </svg>
              </span>
              <span className="text-sm font-bold uppercase tracking-[0.2em]">Repora</span>
            </Link>
            <div className="hidden md:block">
              <CoachNav />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-zinc-300 sm:block">{user.name}</span>
            <Link href="/trainer/more" aria-label="Profile" className="grid h-9 w-9 place-items-center rounded-full bg-zinc-100 text-sm font-semibold text-zinc-950">
              {initials(user.name)}
            </Link>
            <SignOutButton className="hidden rounded-lg border border-zinc-800 px-3 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800/60 md:block" />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-6 pb-28 md:pb-10">{children}</main>
      <div className="md:hidden">
        <CoachTabBar />
      </div>
    </div>
  );
}
