"use client";

import { useState } from "react";

import { btnDangerCls, btnPrimaryCls } from "@/components/ui";

type Variant = "primary" | "danger";

export function ActionForm({
  action,
  children,
  submitLabel,
  pendingLabel = "Saving…",
  confirmMessage,
  variant = "primary",
  className = "space-y-3",
  successMessage = "Saved successfully",
  hideSuccess = false,
}: {
  action: (formData: FormData) => Promise<{ ok: boolean; error?: string }>;
  children: React.ReactNode;
  submitLabel: string;
  pendingLabel?: string;
  confirmMessage?: string;
  variant?: Variant;
  className?: string;
  successMessage?: string;
  hideSuccess?: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);

  return (
    <form
      className={className}
      onSubmit={async (e) => {
        e.preventDefault();
        if (confirmMessage && !window.confirm(confirmMessage)) return;
        setError(null);
        setSuccess(false);
        setPending(true);
        try {
          const result = await action(new FormData(e.currentTarget));
          if (!result.ok) {
            setError(result.error ?? "Something went wrong");
          } else {
            setSuccess(true);
            if (!hideSuccess) (e.target as HTMLFormElement).reset();
          }
        } catch {
          setError("Something went wrong");
        } finally {
          setPending(false);
        }
      }}
    >
      {children}
      {error ? (
        <p role="alert" className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      ) : null}
      {success && !hideSuccess ? (
        <p role="status" className="rounded-lg border border-zinc-800 bg-zinc-800/60 px-3 py-2 text-sm text-zinc-100">
          {successMessage}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className={variant === "danger" ? btnDangerCls : btnPrimaryCls}
      >
        {pending ? pendingLabel : submitLabel}
      </button>
    </form>
  );
}
