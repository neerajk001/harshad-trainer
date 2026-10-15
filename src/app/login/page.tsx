"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { cInput, goldBtn } from "@/components/client/ui";

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
      // Full reload guarantees the new httpOnly session cookie is sent on the
      // next navigation.
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
    <div className="flex min-h-dvh items-center justify-center bg-ink px-5 py-10 [color-scheme:dark]">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-900/70 p-7 text-zinc-100">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Repora</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="mt-1 text-sm text-zinc-400">Trainers manage clients. Clients track their plans.</p>
        <form className="mt-6 space-y-3" onSubmit={handleSubmit}>
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={cInput}
          />
          <input
            type="password"
            required
            autoComplete="current-password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={cInput}
          />
          {error ? (
            <p role="alert" className="rounded-2xl bg-red-500/10 px-4 py-2.5 text-sm text-red-300">{error}</p>
          ) : null}
          <button type="submit" disabled={pending} className={`${goldBtn} w-full`}>
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-zinc-400">
          New here? <Link href="/signup" className="font-semibold text-gold">Create an account</Link>
        </p>

        <div className="mt-6 rounded-2xl bg-white/5 p-4 text-xs leading-relaxed text-zinc-400">
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
            <p className="mt-2 text-gold">Demo mode is on — sign in instantly, no database needed. Edits won&apos;t persist.</p>
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
