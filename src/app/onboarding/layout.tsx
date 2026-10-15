import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import type { Viewport } from "next";

import { requireClient } from "@/lib/session";

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
};

export default async function OnboardingLayout({ children }: { children: ReactNode }) {
  const { client } = await requireClient();
  if (client.onboardingCompleted) redirect("/client");
  return <div className="min-h-dvh bg-ink text-zinc-100 [color-scheme:dark]">{children}</div>;
}
