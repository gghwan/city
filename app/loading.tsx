import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export default function AppLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <LoadingSpinner size="lg" />
    </div>
  );
}
