"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Mobile-friendly wrapper for a "create new ..." form.
 *
 * - Desktop (`lg` and up): renders the form inline, always visible, and the
 *   floating action button is hidden — the form stays in the right rail.
 * - Mobile: the form is collapsed behind a floating action button at the
 *   bottom-right (above the tab bar). Tapping it expands the form at the top
 *   of the page and scrolls it into view.
 */
export function CreatePanel({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [open]);

  return (
    <div className={className}>
      <div id="create-panel-body" ref={ref} className={`${open ? "block" : "hidden"} scroll-mt-24 lg:block`}>
        {children}
      </div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="create-panel-body"
        aria-label={open ? `Close ${label}` : label}
        className="fixed right-4 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-lime-600 text-white shadow-lg shadow-lime-950/40 transition active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-500 lg:hidden"
        style={{ bottom: "calc(4.75rem + env(safe-area-inset-bottom))" }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.2}
          strokeLinecap="round"
          className={`h-6 w-6 transition-transform duration-200 ${open ? "rotate-45" : ""}`}
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
    </div>
  );
}
