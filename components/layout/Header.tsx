'use client';

import { ChevronLeft, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { APP_NAME } from '@/lib/constants';
import { AdminBadge } from '@/components/common/AdminBadge';

export function Header({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const isDashboard = pathname === '/dashboard';

  return (
    <header className="sticky top-0 z-20 border-b border-borderColor bg-white md:bg-white/95 md:backdrop-blur">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          {!isDashboard && (
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="rounded-lg p-1 text-textMuted hover:bg-bg"
              aria-label="대시보드로 이동"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          <p className="text-sm font-extrabold text-primary">{APP_NAME}</p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && <AdminBadge />}
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="rounded-lg p-1 text-textMuted hover:bg-bg"
            aria-label="로그아웃"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
