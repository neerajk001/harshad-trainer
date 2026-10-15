"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-900 p-8 text-center text-zinc-100 shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lime-400">Repora</p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">Something went wrong</h1>
        <p className="mt-2 text-sm text-zinc-400">
          We couldn&apos;t load this page. This is usually temporary — try again.
        </p>
        {error.digest ? <p className="mt-2 text-xs text-zinc-600">Reference: {error.digest}</p> : null}
        <div className="mt-5 flex justify-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="rounded-xl bg-lime-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-lime-700"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-xl border border-white/15 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-white/10"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
