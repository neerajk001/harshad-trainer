"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { markThreadReadAction, sendMessageAction } from "@/actions/messages";
import { cInput } from "@/components/client/ui";

type Msg = { id: string; body: string; senderRole: "trainer" | "client" | string; createdAt: Date | string };

export function Chat({
  clientId,
  myRole,
  messages,
  counterpartName,
}: {
  clientId: string;
  myRole: "trainer" | "client";
  messages: Msg[];
  counterpartName: string;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  useEffect(() => {
    void markThreadReadAction(clientId);
  }, [clientId]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    setError(null);
    setPending(true);
    try {
      const fd = new FormData();
      fd.set("clientId", clientId);
      fd.set("body", text);
      const res = await sendMessageAction(fd);
      if (!res.ok) {
        setError(res.error ?? "Could not send");
        return;
      }
      setBody("");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-[60dvh] flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto pb-4">
        {messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-zinc-500">No messages yet. Say hello to {counterpartName}.</p>
        ) : (
          messages.map((m) => {
            const mine = m.senderRole === myRole;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-3xl px-4 py-2.5 text-sm ${mine ? "bg-gold text-zinc-950" : "bg-zinc-800 text-zinc-100"}`}>
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p className={`mt-1 text-[10px] ${mine ? "text-zinc-800/70" : "text-zinc-500"}`}>
                    {new Date(m.createdAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {error ? <p role="alert" className="mb-2 rounded-2xl bg-red-500/10 px-4 py-2.5 text-sm text-red-300">{error}</p> : null}

      <form onSubmit={send} className="sticky bottom-20 flex items-end gap-2 md:bottom-0">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a message…"
          maxLength={2000}
          className={cInput}
        />
        <button
          type="submit"
          disabled={pending || !body.trim()}
          aria-label="Send"
          className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gold text-zinc-950 transition hover:brightness-95 disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M4 12l16-8-6 16-3-7-7-1Z" strokeLinejoin="round" />
          </svg>
        </button>
      </form>
    </div>
  );
}
