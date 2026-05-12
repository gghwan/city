import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export default function ScheduleLoading() {
  return (
    <section className="space-y-3">
      <div className="flex justify-center py-2">
        <LoadingSpinner size="md" />
      </div>
      <div className="rounded-2xl border border-borderColor bg-white p-4">
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, idx) => (
            <div key={idx} className="h-20 animate-pulse rounded-xl border border-borderColor bg-surface" />
          ))}
        </div>
      </div>
    </section>
  );
}
