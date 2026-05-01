export default function MainLoading() {
  return (
    <section className="space-y-3">
      <div className="h-5 w-32 animate-pulse rounded bg-borderColor/50" />
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-2xl border border-borderColor bg-white/80" />
        ))}
      </div>
    </section>
  );
}
