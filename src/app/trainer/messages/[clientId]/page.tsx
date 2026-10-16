import Link from "next/link";

import { EmptyState } from "@/components/client/ui";
import { Chat } from "@/components/chat";
import { getThread } from "@/lib/coach-queries";
import { requireTrainer } from "@/lib/session";

export default async function ThreadPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  const user = await requireTrainer();
  const thread = await getThread(user.id, clientId);
  if (!thread) {
    return (
      <div className="space-y-5">
        <Link href="/trainer/messages" className="text-sm text-zinc-400">← Messages</Link>
        <EmptyState title="Conversation not found" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[70dvh] flex-col">
      <div className="mb-3 flex items-center gap-3">
        <Link href="/trainer/messages" aria-label="Back" className="grid h-9 w-9 place-items-center rounded-full border border-zinc-800 text-zinc-300">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <div>
          <h1 className="text-lg font-semibold tracking-tight">{thread.user.name}</h1>
          <p className="text-xs text-zinc-500">{thread.user.email}</p>
        </div>
      </div>
      <Chat
        clientId={clientId}
        myRole="trainer"
        counterpartName={thread.user.name}
        messages={thread.messages.map((m) => ({ id: m.id, body: m.body, senderRole: m.senderRole, createdAt: m.createdAt }))}
      />
    </div>
  );
}
