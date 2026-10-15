import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-900 p-8 text-center text-zinc-100 shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lime-400">Repora</p>
        <p className="mt-4 text-5xl font-bold tracking-tight">404</p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">Page not found</h1>
        <p className="mt-2 text-sm text-zinc-400">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
        <Link
          href="/"
          className="mt-5 inline-flex rounded-xl bg-lime-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-lime-700"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
