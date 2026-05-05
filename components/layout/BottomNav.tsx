'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Bell, FileText, Home, Map, MessageCircle, MoreHorizontal, PhoneCall, Smartphone, X } from 'lucide-react';
import { NavigationLink } from '@/components/common/NavigationLink';

const primaryNavItems = [
  { href: '/dashboard', label: '홈', icon: Home },
  { href: '/service', label: '봉사마련', icon: FileText },
  { href: '/map', label: '구역지도', icon: Map },
  { href: '/notice', label: '공지', icon: Bell },
];

const moreNavItems = [
  { href: '/card', label: '호별카드', icon: Smartphone },
  { href: '/emergency', label: '비상연락', icon: PhoneCall },
  { href: '/talk', label: '대화방법', icon: MessageCircle },
  { href: '/chat', label: 'AI도우미', icon: MessageCircle },
];

export function BottomNav() {
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  useEffect(() => {
    setIsMoreOpen(false);
  }, [pathname]);

  return (
    <>
      {isMoreOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-30 bg-black/30"
            onClick={() => setIsMoreOpen(false)}
            aria-label="더보기 닫기"
          />

          <section className="fixed bottom-16 left-0 right-0 z-40 px-3">
            <div className="mx-auto max-w-3xl rounded-2xl border border-borderColor bg-white p-4 shadow-lg">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-black text-textBase">더보기</h3>
                <button
                  type="button"
                  onClick={() => setIsMoreOpen(false)}
                  className="rounded-lg p-1 text-textMuted hover:bg-surface"
                  aria-label="더보기 메뉴 닫기"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {moreNavItems.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <NavigationLink
                      key={item.href}
                      href={item.href}
                      prefetch
                      className={`flex flex-col items-center rounded-xl border px-2 py-2 text-[11px] font-bold ${
                        active
                          ? 'border-primary/30 bg-primary/10 text-primary'
                          : 'border-borderColor bg-surface text-textMuted'
                      }`}
                    >
                      <item.icon className="mb-1 h-4 w-4" />
                      {item.label}
                    </NavigationLink>
                  );
                })}
              </div>
            </div>
          </section>
        </>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-borderColor bg-white md:bg-white/95 md:backdrop-blur">
        <div className="mx-auto grid h-16 max-w-3xl grid-cols-5 px-1">
          {primaryNavItems.map((item) => {
            const active = pathname === item.href;
            return (
              <NavigationLink
                key={item.href}
                href={item.href}
                prefetch
                className={`flex flex-col items-center justify-center rounded-xl px-2 py-1 text-[11px] font-bold transition ${
                  active ? 'text-primary' : 'text-textMuted'
                }`}
              >
                <item.icon className="mb-1 h-5 w-5" />
                {item.label}
              </NavigationLink>
            );
          })}

          <button
            type="button"
            onClick={() => setIsMoreOpen((prev) => !prev)}
            className={`flex flex-col items-center justify-center rounded-xl px-2 py-1 text-[11px] font-bold ${
              isMoreOpen ? 'text-primary' : 'text-textMuted'
            }`}
            aria-label="더보기 열기"
          >
            <MoreHorizontal className="mb-1 h-5 w-5" />
            더보기
          </button>
        </div>
      </nav>
    </>
  );
}
