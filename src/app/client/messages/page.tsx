import Link from "next/link";

import { EmptyState } from "@/components/client/ui";
import { Chat } from "@/components/chat";
import { getClientThread } from "@/lib/coach-queries";
import { requireClient } from "@/lib/session";

export default async function ClientMessagesPage() {
  const { client } = await requireClient();
  const thread = await getClientThread(client.id, client.trainerId);

  return (
    <div className="flex min-h-[70dvh] flex-col">
      <div className="mb-3 flex items-center gap-3">
        <Link href="/client/profile" aria-label="Back" className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-zinc-300">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
          <p className="text-xs text-zinc-500">{thread.trainer ? thread.trainer.name : "No trainer linked yet"}</p>
        </div>
      </div>
      {thread.trainer ? (
        <Chat
          clientId={client.id}
          myRole="client"
          counterpartName={thread.trainer.name}
          messages={thread.messages.map((m) => ({ id: m.id, body: m.body, senderRole: m.senderRole, createdAt: m.createdAt }))}
        />
      ) : (
        <EmptyState title="No trainer yet" hint="You'll be able to message once a coach is assigned." />
      )}
    </div>
  );
}
