"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export function TabLinks({
  tabs,
  activeKey,
  param = "tab",
  className = "",
}: {
  tabs: Array<{ key: string; label: string }>;
  activeKey: string;
  param?: string;
  className?: string;
}) {
  const pathname = usePathname();
  const sp = useSearchParams();
  return (
    <div className={`flex gap-1 rounded-2xl bg-zinc-900 p-1 ${className}`}>
      {tabs.map((t) => {
        const active = t.key === activeKey;
        const params = new URLSearchParams(sp.toString());
        params.set(param, t.key);
        return (
          <Link
            key={t.key}
            href={`${pathname}?${params.toString()}`}
            aria-current={active ? "page" : undefined}
            className={`flex-1 whitespace-nowrap rounded-xl px-3 py-2 text-center text-sm font-medium transition ${
              active ? "bg-gold text-zinc-950" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
