"use client";

import { useState } from "react";

import { approveInquiryAction } from "@/actions/trainer";
import { goldBtn } from "@/components/client/ui";

export function ApproveInquiryForm({ inquiryId, name }: { inquiryId: string; name: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creds, setCreds] = useState<{ email: string; password: string } | null>(null);

  async function approve() {
    if (!window.confirm(`Create a login for ${name} and approve this inquiry?`)) return;
    setError(null);
    setPending(true);
    try {
      const fd = new FormData();
      fd.set("inquiryId", inquiryId);
      const res = await approveInquiryAction(fd);
      if (!res.ok) {
        setError(res.error ?? "Could not approve");
        return;
      }
      setCreds({ email: res.email, password: res.password });
    } finally {
      setPending(false);
    }
  }

  if (creds) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm">
        <p className="font-semibold text-emerald-300">Account created</p>
        <p className="mt-1 text-zinc-300">
          Email: <span className="font-mono">{creds.email}</span>
        </p>
        <p className="text-zinc-300">
          Temp password: <span className="font-mono">{creds.password}</span>
        </p>
        <p className="mt-1 text-xs text-emerald-200/80">Share these securely. They won&apos;t be shown again.</p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={approve} disabled={pending} className={`${goldBtn} !px-4 !py-2 text-sm`}>
        {pending ? "Approving…" : "Approve"}
      </button>
      {error ? <span className="text-xs text-red-400">{error}</span> : null}
    </div>
  );
}
