"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

import { registerClientAction } from "@/actions/auth";
import { cInput, goldBtn } from "@/components/client/ui";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const fd = new FormData();
      fd.set("name", name);
      fd.set("email", email);
      fd.set("password", password);
      const res = await registerClientAction(fd);
      if (!res.ok) {
        setError(res.error ?? "Could not create your account");
        return;
      }
      const signInRes = await signIn("credentials", { email, password, redirect: false });
      if (signInRes?.error) {
        setError("Account created, but sign-in failed. Try logging in.");
        return;
      }
      // Full reload so the session cookie is sent. The proxy routes a freshly
      // signed-up client (not yet onboarded) to /onboarding.
      const afterSignup = "/onboarding";
      window.location.href = signInRes?.url ?? afterSignup;
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="min-h-dvh bg-ink px-6 py-8 text-zinc-100 [color-scheme:dark]">
      <div className="mx-auto w-full max-w-md">
        <Link href="/" aria-label="Back" className="inline-grid h-10 w-10 place-items-center rounded-full border border-white/10 text-zinc-300">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>

        <h1 className="mt-6 text-3xl font-semibold tracking-tight">
          Start Your <span className="text-gold">Transformation</span>
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Create your account and take the first step towards a stronger you.
        </p>

        <div className="mt-7 space-y-3">
          <button
            type="button"
            onClick={() => setNotice("Google sign-in is coming soon. Use email below.")}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-3.5 text-sm font-medium text-zinc-100 hover:bg-white/10"
          >
            <span className="text-base font-bold">G</span> Continue with Google
          </button>
          <button
            type="button"
            onClick={() => setNotice("Apple sign-in is coming soon. Use email below.")}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-3.5 text-sm font-medium text-zinc-100 hover:bg-white/10"
          >
             Continue with Apple
          </button>
        </div>

        <div className="my-5 flex items-center gap-3 text-xs text-zinc-600">
          <span className="h-px flex-1 bg-white/10" /> or <span className="h-px flex-1 bg-white/10" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            required
            autoComplete="name"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={cInput}
          />
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
            minLength={8}
            autoComplete="new-password"
            placeholder="Password (min 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={cInput}
          />
          {notice ? <p className="rounded-2xl bg-white/5 px-4 py-2.5 text-xs text-zinc-400">{notice}</p> : null}
          {error ? <p role="alert" className="rounded-2xl bg-red-500/10 px-4 py-2.5 text-sm text-red-300">{error}</p> : null}
          <button type="submit" disabled={pending} className={`${goldBtn} w-full`}>
            {pending ? "Creating account…" : "Sign up with Email"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-400">
          Already have an account? <Link href="/login" className="font-semibold text-gold">Log in</Link>
        </p>
      </div>
    </div>
  );
}
