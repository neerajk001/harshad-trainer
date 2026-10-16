import Image from "next/image";
import Link from "next/link";

export function Landing({ dashboardHref }: { dashboardHref?: string }) {
  const loggedIn = Boolean(dashboardHref);
  return (
    <div className="relative min-h-dvh overflow-hidden bg-ink text-zinc-100">
      <Image
        src="/cinematic-back-flex.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="pointer-events-none select-none object-cover object-center"
      />
      <div aria-hidden className="absolute inset-0 bg-ink/65" />

      <div className="relative mx-auto flex min-h-dvh max-w-md flex-col px-6">
        <header className="flex items-center justify-between py-5">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg border border-white/15 bg-ink/40">
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-zinc-100" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M5 7h14M5 12h9M5 17h5" strokeLinecap="round" />
              </svg>
            </span>
            <span className="text-sm font-bold uppercase tracking-[0.2em]">Repora</span>
          </div>
          <Link
            href={dashboardHref ?? "/login"}
            className="rounded-lg border border-white/15 bg-ink/40 px-4 py-1.5 text-sm font-medium text-zinc-100 hover:bg-ink/60"
          >
            {loggedIn ? "Dashboard" : "Log in"}
          </Link>
        </header>

        <div className="flex flex-1 flex-col justify-end pb-10 pt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">Personal Training &amp; Nutrition</p>
          <h1 className="mt-4 text-4xl font-semibold leading-[1.08] tracking-tight text-white">
            Stronger People Everyday
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-zinc-300">
            Personalized training, nutrition and guidance to help you build a stronger, healthier and more confident you.
          </p>

          <Link
            href={dashboardHref ?? "/inquiry"}
            className="mt-7 inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-100 px-6 py-3.5 text-sm font-semibold text-zinc-950 transition hover:bg-white active:scale-[0.99]"
          >
            {loggedIn ? "Go to Dashboard" : "Start Your Transformation"}
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>

          <div className="mt-6 flex items-center gap-3">
            <div className="flex -space-x-2">
              {["A", "R", "P", "S"].map((c) => (
                <span
                  key={c}
                  className="grid h-8 w-8 place-items-center rounded-full border border-white/20 bg-ink/60 text-xs font-semibold text-zinc-100"
                >
                  {c}
                </span>
              ))}
            </div>
            <div className="text-xs">
              <p className="font-semibold text-zinc-100">50+ clients transformed</p>
              <p className="text-zinc-400">★★★★★ 5.0 rating</p>
            </div>
          </div>
        </div>

        <p className="pb-6 text-center text-[11px] font-semibold uppercase tracking-[0.3em] text-zinc-500">
          Train Better. Live Better.
        </p>
      </div>
    </div>
  );
}
