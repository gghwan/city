import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export default function MainLoading() {
  return (
    <section className="space-y-4">
      <div className="flex justify-center py-2">
        <LoadingSpinner size="md" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-2xl border border-borderColor bg-white/80" />
        ))}
      </div>
    </section>
  );
}
