'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BellRing, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import type { NoticeItem } from '@/types';
import { pickLatestEmergencyNotice, pickTopBannerNotice } from '@/lib/notice-meta';

function todayStamp() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(new Date());
  const year = parts.find((part) => part.type === 'year')?.value ?? '0000';
  const month = parts.find((part) => part.type === 'month')?.value ?? '01';
  const day = parts.find((part) => part.type === 'day')?.value ?? '01';

  return `${year}-${month}-${day}`;
}

function emergencyDismissKey(noticeId: number) {
  return `notice-emergency-dismiss-${noticeId}`;
}

export function UserNoticeLayer({ notices }: { notices: NoticeItem[] }) {
  const pathname = usePathname();
  const topNotice = useMemo(() => pickTopBannerNotice(notices), [notices]);
  const emergencyNotice = useMemo(() => pickLatestEmergencyNotice(notices), [notices]);
  const [showEmergency, setShowEmergency] = useState(false);

  useEffect(() => {
    const isHome = pathname === '/dashboard';
    if (!isHome || !emergencyNotice) {
      setShowEmergency(false);
      return;
    }

    const key = emergencyDismissKey(emergencyNotice.id);
    const dismissedAt = window.localStorage.getItem(key);
    if (dismissedAt === todayStamp()) {
      setShowEmergency(false);
      return;
    }

    setShowEmergency(true);
  }, [emergencyNotice, pathname]);

  const dismissEmergencyForToday = () => {
    if (!emergencyNotice) return;
    window.localStorage.setItem(emergencyDismissKey(emergencyNotice.id), todayStamp());
    setShowEmergency(false);
  };

  return (
    <>
      {topNotice ? (
        <div className="sticky top-14 z-20 border-b border-[#eadfcb] bg-[#fffaf2] shadow-sm">
          <div className="mx-auto max-w-3xl px-4 py-3">
            <Link href="/notice" className="flex items-center gap-2 text-sm font-bold text-textBase md:text-base">
              <span className="rounded-md bg-warning px-2 py-0.5 text-[11px] font-black text-black">공지</span>
              <BellRing className="h-5 w-5 shrink-0 text-[#a54f1b]" />
              <span className="line-clamp-1 leading-tight">
                {topNotice.noticeType === 'EMERGENCY' ? '[팝업 공지] ' : ''}
                {topNotice.title}
              </span>
            </Link>
          </div>
        </div>
      ) : null}

      {showEmergency && emergencyNotice ? (
        <div className="fixed inset-0 z-50 bg-black/50 px-4 py-6 backdrop-blur-[1px]">
          <div className="mx-auto mt-12 max-w-lg rounded-2xl border border-warning/40 bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowEmergency(false)}
                className="rounded-md p-1.5 text-textMuted hover:bg-surface"
                aria-label="팝업 닫기"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-3 text-base font-black text-textBase md:text-lg">{emergencyNotice.title}</p>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-textBase md:text-base">
              {emergencyNotice.content}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={dismissEmergencyForToday}
                className="rounded-lg bg-surface px-3 py-2.5 text-sm font-semibold text-textBase"
              >
                오늘 하루 보지 않기
              </button>
              <Link
                href="/notice"
                className="rounded-lg bg-primary px-3 py-2.5 text-center text-sm font-bold text-white"
                onClick={() => setShowEmergency(false)}
              >
                공지 상세 보기
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
