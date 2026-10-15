"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { btnPrimaryCls, inputCls } from "@/components/ui";

function LoginInner() {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const callbackUrl = params.get("callbackUrl") ?? "/";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await signIn("credentials", { email, password, redirect: false });
      if (res?.error) {
        setError("Invalid email or password");
        return;
      }
      // Full reload guarantees the new httpOnly session cookie is sent
      // on the next navigation. router.push + router.refresh can appear
      // stuck (button stays on "Signing in…") when the session hasn't
      // propagated to the router cache yet.
      window.location.href = res?.url ?? callbackUrl;
    } catch {
      setError("Could not reach the server. Is `npm run dev` still running?");
    } finally {
      setPending(false);
    }
  }

  function fillDemo(role: "trainer" | "client") {
    if (role === "trainer") {
      setEmail("trainer@repora.demo");
      setPassword("Trainer123!");
    } else {
      setEmail("client@repora.demo");
      setPassword("Client123!");
    }
    setError(null);
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-zinc-950 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-900 p-8 text-zinc-100 shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lime-400">Repora</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-1 text-sm text-zinc-400">Trainers manage clients. Clients track their plans.</p>
        <form
          className="mt-6 space-y-3"
          onSubmit={handleSubmit}
        >
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-zinc-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`${inputCls} dark:border-white/10 dark:bg-zinc-800`}
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-zinc-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputCls} dark:border-white/10 dark:bg-zinc-800`}
            />
          </div>
          {error ? (
            <p role="alert" className="rounded-xl bg-red-950/60 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          ) : null}
          <button type="submit" disabled={pending} className={`${btnPrimaryCls} w-full`}>
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <div className="mt-6 rounded-2xl bg-zinc-800/70 p-4 text-xs leading-relaxed text-zinc-400">
          <p className="font-semibold text-zinc-200">Demo accounts</p>
          <p className="mt-1">Trainer: trainer@repora.demo / Trainer123!</p>
          <p>Client: client@repora.demo / Client123!</p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => fillDemo("trainer")}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-medium text-zinc-200 hover:bg-white/10"
            >
              Fill trainer
            </button>
            <button
              type="button"
              onClick={() => fillDemo("client")}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-medium text-zinc-200 hover:bg-white/10"
            >
              Fill client
            </button>
          </div>
          {process.env.NEXT_PUBLIC_DEMO_MODE === "true" ? (
            <p className="mt-2 text-lime-300">Demo mode is on — sign in instantly, no database needed. Edits won&apos;t persist.</p>
          ) : (
            <p className="mt-2">Run `npm run db:seed` after setting DATABASE_URL. See README.</p>
          )}
        </div>
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
