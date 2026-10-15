import Link from "next/link";
import type { ReactNode } from "react";
import type { Viewport } from "next";

import { ClientTabBar } from "@/components/client/client-tab-bar";
import { requireClient } from "@/lib/session";

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
};

function GoldAvatar({ name }: { name?: string | null }) {
  const initial = (name?.trim()?.[0] ?? "R").toUpperCase();
  return (
    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold font-semibold text-zinc-950">
      {initial}
    </span>
  );
}

export default async function ClientLayout({ children }: { children: ReactNode }) {
  const { user } = await requireClient();

  return (
    <div className="min-h-dvh bg-ink text-zinc-100 [color-scheme:dark]">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-ink/90 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3 px-4 py-3">
          <Link href="/client" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl border border-white/10 bg-white/5">
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-gold" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M5 7h14M5 12h9M5 17h5" strokeLinecap="round" />
              </svg>
            </span>
            <span className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-100">Repora</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/client/profile" aria-label="Profile">
              <GoldAvatar name={user.name} />
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-md px-4 pb-28 pt-5">{children}</main>
      <ClientTabBar />
    </div>
  );
}
