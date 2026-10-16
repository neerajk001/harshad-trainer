export default function Loading() {
  const sk = "animate-pulse rounded-xl bg-zinc-800/50";
  return (
    <div className="space-y-5">
      <div className={`${sk} h-8 w-56`} />
      <div className={`${sk} h-56`} />
      <div className="grid grid-cols-3 gap-2.5">
        <div className={`${sk} h-24`} />
        <div className={`${sk} h-24`} />
        <div className={`${sk} h-24`} />
      </div>
      <div className={`${sk} h-64`} />
    </div>
  );
}
