import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export default function FileViewerLoading() {
  return (
    <section className="flex min-h-[45vh] items-center justify-center">
      <LoadingSpinner size="md" label="문서를 불러오는 중..." />
    </section>
  );
}
