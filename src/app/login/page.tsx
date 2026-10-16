"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
      <path d="M12.24 10.285V14.4h5.36c-.236 1.5-1.73 4.41-5.36 4.41-3.226 0-5.86-2.67-5.86-5.96s2.634-5.96 5.86-5.96c1.836 0 3.066.78 3.77 1.45l2.57-2.475C16.79 4.24 14.68 3.4 12.24 3.4 7.31 3.4 3.34 7.37 3.34 12.3s3.97 8.9 8.9 8.9c5.14 0 8.54-3.61 8.54-8.7 0-.585-.06-1.03-.14-1.475h-8.4z" />
    </svg>
  );
}

function LoginInner() {
  const params = useSearchParams();
  const [pending, setPending] = useState(false);
  const callbackUrl = params.get("callbackUrl") ?? "/";
  const error = params.get("error");

  return (
    <div className="flex min-h-dvh items-center justify-center bg-ink px-5 py-10 [color-scheme:dark]">
      <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-7 text-zinc-100">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Repora</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Sign in with the Google account your coach registered.
        </p>

        {error ? (
          <p role="alert" className="mt-5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
            {error === "AccessDenied"
              ? "This Google account isn't registered. Ask your coach to add your email first."
              : "Could not sign you in. Please try again."}
          </p>
        ) : null}

        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setPending(true);
            void signIn("google", { callbackUrl });
          }}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-100 px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-white disabled:opacity-50"
        >
          <GoogleIcon />
          {pending ? "Redirecting…" : "Continue with Google"}
        </button>

        <p className="mt-5 text-center text-sm text-zinc-500">
          Need access?{" "}
          <Link href="/inquiry" className="font-semibold text-zinc-100 hover:text-white">
            Request access
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-zinc-500">Loading…</div>}>
      <LoginInner />
    </Suspense>
  );
}
