import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export default function MyPageLoading() {
  return (
    <section className="space-y-4">
      <div className="flex justify-center py-2">
        <LoadingSpinner size="md" label="마이페이지 불러오는 중..." />
      </div>

      <div className="rounded-2xl border border-borderColor bg-white p-4">
        <div className="h-5 w-32 animate-pulse rounded bg-surface" />
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <div className="h-8 animate-pulse rounded bg-surface" />
          <div className="h-8 animate-pulse rounded bg-surface" />
          <div className="h-8 animate-pulse rounded bg-surface" />
        </div>
      </div>

      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-2xl border border-borderColor bg-white" />
        ))}
      </div>
    </section>
  );
}
