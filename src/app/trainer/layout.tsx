import Link from "next/link";
import type { ReactNode } from "react";

import { requireTrainer } from "@/lib/session";
import { SignOutButton } from "@/components/SignOutButton";
import { TrainerNav } from "@/components/trainer-nav";
import { Avatar } from "@/components/ui";

export default async function TrainerLayout({ children }: { children: ReactNode }) {
  const user = await requireTrainer();
  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-zinc-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex min-w-0 items-center gap-5">
            <Link href="/trainer" className="shrink-0 text-sm font-bold uppercase tracking-[0.2em] text-lime-400">
              Repora
            </Link>
            <div className="hidden md:block">
              <TrainerNav />
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden items-center gap-2 text-zinc-300 sm:flex">
              <Avatar name={user.name} size="sm" />
              {user.name}
            </span>
            <SignOutButton className="rounded-xl border border-white/15 px-3 py-1.5 text-sm font-medium text-zinc-200 hover:bg-white/10" />
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-4 pb-2 md:hidden">
          <TrainerNav />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
