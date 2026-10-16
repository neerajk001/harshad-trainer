"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { reviewCheckinAction } from "@/actions/trainer";
import { cInput, ghostBtn, goldBtn } from "@/components/client/ui";

export function CheckinReviewForm({ checkinId, defaultFeedback }: { checkinId: string; defaultFeedback?: string | null }) {
  const router = useRouter();
  const [feedback, setFeedback] = useState(defaultFeedback ?? "");
  const [pending, setPending] = useState<"approve" | "feedback" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(approve: boolean) {
    setError(null);
    setPending(approve ? "approve" : "feedback");
    try {
      const fd = new FormData();
      fd.set("checkinId", checkinId);
      fd.set("feedback", feedback);
      if (approve) fd.set("approve", "true");
      const res = await reviewCheckinAction(fd);
      if (!res.ok) {
        setError(res.error ?? "Could not save");
        return;
      }
      setDone(true);
      router.refresh();
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="space-y-3">
      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        rows={3}
        maxLength={2000}
        placeholder="Write feedback for your client (optional)…"
        className={cInput}
      />
      {error ? <p role="alert" className="rounded-lg bg-red-500/10 px-4 py-2.5 text-sm text-red-300">{error}</p> : null}
      {done ? <p role="status" className="rounded-lg bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-300">Saved</p> : null}
      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => submit(false)} disabled={pending !== null} className={ghostBtn}>
          {pending === "feedback" ? "Sending…" : "Send Feedback"}
        </button>
        <button type="button" onClick={() => submit(true)} disabled={pending !== null} className={goldBtn}>
          {pending === "approve" ? "Approving…" : "Approve"}
        </button>
      </div>
    </div>
  );
}
