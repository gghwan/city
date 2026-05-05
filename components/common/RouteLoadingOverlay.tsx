'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useNavigationStore } from '@/stores/navigation.store';

const SPINNER_DELAY_MS = 120;

export function RouteLoadingOverlay() {
  const pathname = usePathname();
  const isRouteLoading = useNavigationStore((state) => state.isRouteLoading);
  const stopRouteLoading = useNavigationStore((state) => state.stopRouteLoading);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    stopRouteLoading();
  }, [pathname, stopRouteLoading]);

  useEffect(() => {
    if (!isRouteLoading) {
      setVisible(false);
      return;
    }

    const timer = setTimeout(() => setVisible(true), SPINNER_DELAY_MS);
    return () => clearTimeout(timer);
  }, [isRouteLoading]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex cursor-wait items-center justify-center bg-black/12" aria-busy="true">
      <div className="rounded-2xl border border-borderColor bg-white/95 px-4 py-3 shadow-md">
        <LoadingSpinner size="md" />
      </div>
    </div>
  );
}
