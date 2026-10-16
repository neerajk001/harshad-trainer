import Link from "next/link";

import { EmptyState } from "@/components/client/ui";
import { getConversations } from "@/lib/coach-queries";
import { requireTrainer } from "@/lib/session";
import { timeAgo } from "@/lib/client-utils";

export default async function MessagesPage() {
  const user = await requireTrainer();
  const convos = await getConversations(user.id);
  const sorted = [...convos].sort((a, b) => {
    const at = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
    const bt = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
    return bt - at;
  });

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>

      {sorted.length === 0 ? (
        <EmptyState title="No conversations yet" hint="Add clients to start messaging." />
      ) : (
        <div className="space-y-2.5">
          {sorted.map((c) => (
            <Link
              key={c.client.id}
              href={`/trainer/messages/${c.client.id}`}
              className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3.5 transition hover:bg-zinc-800/60"
            >
              <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full bg-zinc-800/50 font-semibold text-zinc-200">
                {c.user.name?.[0]?.toUpperCase() ?? "C"}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{c.user.name}</span>
                <span className="block truncate text-xs text-zinc-500">
                  {c.lastMessage
                    ? `${c.lastMessage.senderRole === "trainer" ? "You: " : ""}${c.lastMessage.body}`
                    : "No messages yet"}
                </span>
              </span>
              <span className="shrink-0 text-right">
                {c.lastMessage ? <span className="block text-[10px] text-zinc-500">{timeAgo(c.lastMessage.createdAt)}</span> : null}
                {c.unread > 0 ? (
                  <span className="mt-1 inline-grid h-5 min-w-5 place-items-center rounded-full bg-zinc-100 px-1.5 text-[10px] font-bold text-zinc-950">
                    {c.unread}
                  </span>
                ) : null}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
