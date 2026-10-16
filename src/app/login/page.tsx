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

  return (
    <div className="flex min-h-dvh items-center justify-center bg-ink px-5 py-10 [color-scheme:dark]">
      <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-7 text-zinc-100">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Repora</p>
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
            <p role="alert" className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">{error}</p>
          ) : null}
          <button type="submit" disabled={pending} className={`${goldBtn} w-full`}>
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-zinc-400">
          New here? <Link href="/inquiry" className="font-semibold text-zinc-100 hover:text-white">Request access</Link>
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
