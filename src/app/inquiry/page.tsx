"use client";

import Link from "next/link";
import { useState } from "react";

import { submitInquiryAction } from "@/actions/inquiry";
import { cInput } from "@/components/client/ui";
import { goalOptions } from "@/lib/client-utils";

export default function InquiryPage() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await submitInquiryAction(new FormData(e.currentTarget));
      if (!res.ok) {
        setError(res.error ?? "Could not submit your request");
        return;
      }
      setDone(true);
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
          Request <span className="text-gold">Access</span>
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Tell us about your goals. A coach reviews every request and creates your account — you&apos;ll receive your
          login details from them.
        </p>

        {done ? (
          <div className="mt-8 rounded-3xl border border-gold/30 bg-gold/5 p-6 text-center">
            <p className="text-lg font-semibold text-gold">Request received</p>
            <p className="mt-2 text-sm text-zinc-300">
              Thanks! Your coach will review your inquiry and send your login details soon.
            </p>
            <Link href="/login" className="mt-4 inline-block text-sm font-semibold text-gold">
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-7 space-y-3">
            <input name="name" required maxLength={120} placeholder="Full name" className={cInput} />
            <input name="email" type="email" required maxLength={255} placeholder="Email" className={cInput} />
            <input name="phone" maxLength={40} placeholder="Phone (optional)" className={cInput} />
            <label className="block">
              <span className="mb-1 block text-xs text-zinc-400">Main goal</span>
              <select name="goal" defaultValue="" className={cInput}>
                <option value="">Select a goal…</option>
                {goalOptions().map((g) => (
                  <option key={g.key} value={g.key}>
                    {g.label}
                  </option>
                ))}
              </select>
            </label>
            <textarea name="message" rows={4} maxLength={2000} placeholder="Anything else? (optional)" className={cInput} />

            {error ? <p role="alert" className="rounded-2xl bg-red-500/10 px-4 py-2.5 text-sm text-red-300">{error}</p> : null}

            <button
              type="submit"
              disabled={pending}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-gold px-5 py-3.5 text-base font-semibold text-zinc-950 transition hover:brightness-95 disabled:opacity-50"
            >
              {pending ? "Sending…" : "Send request"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-zinc-400">
          Already have an account? <Link href="/login" className="font-semibold text-gold">Log in</Link>
        </p>
      </div>
    </div>
  );
}
