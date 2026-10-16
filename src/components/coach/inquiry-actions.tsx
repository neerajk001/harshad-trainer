"use client";

import { useState } from "react";

import { approveInquiryAction } from "@/actions/trainer";
import { goldBtn } from "@/components/client/ui";

export function ApproveInquiryForm({ inquiryId, name }: { inquiryId: string; name: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [approvedEmail, setApprovedEmail] = useState<string | null>(null);

  async function approve() {
    if (!window.confirm(`Approve ${name}? They'll sign in with Google using their email.`)) return;
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
      setApprovedEmail(res.email);
    } finally {
      setPending(false);
    }
  }

  if (approvedEmail) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-800/50 p-3 text-sm">
        <p className="font-semibold text-zinc-100">Approved</p>
        <p className="mt-1 text-zinc-300">
          <span className="font-mono">{approvedEmail}</span> can now sign in with Google.
        </p>
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
