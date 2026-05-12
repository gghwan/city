import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export default function ReportLoading() {
  return (
    <section className="space-y-3">
      <div className="flex justify-center py-2">
        <LoadingSpinner size="md" />
      </div>
      <div className="h-24 animate-pulse rounded-2xl border border-borderColor bg-white" />
      <div className="h-56 animate-pulse rounded-2xl border border-borderColor bg-white" />
      <div className="h-40 animate-pulse rounded-2xl border border-borderColor bg-white" />
    </section>
  );
}
