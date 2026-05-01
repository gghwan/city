import { MessageCircle } from 'lucide-react';
import { NavigationLink } from '@/components/common/NavigationLink';
import { MenuGrid } from '@/components/dashboard/MenuGrid';
import { getNotices } from '@/actions/notice.actions';
import { formatDate } from '@/lib/format';

export default function DashboardPage() {
  const noticesPromise = getNotices();

  return (
    <DashboardContent noticesPromise={noticesPromise} />
  );
}

async function DashboardContent({ noticesPromise }: { noticesPromise: ReturnType<typeof getNotices> }) {
  const notices = (await noticesPromise).slice(0, 2);

  return (
    <section>
      <p className="mb-4 text-xs text-textMuted">캠페인 핵심 메뉴</p>
      <MenuGrid />

      <div className="mt-5 space-y-2 rounded-2xl border border-borderColor bg-white p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-textBase">최근 공지사항</h3>
          <NavigationLink href="/notice" className="text-xs font-semibold text-primary">
            전체 보기
          </NavigationLink>
        </div>
        {notices.length === 0 ? (
          <p className="text-xs text-textMuted">등록된 공지사항이 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {notices.map((notice) => (
              <NavigationLink key={notice.id} href="/notice" className="block rounded-lg bg-surface px-3 py-2">
                <p className="truncate text-sm font-semibold text-textBase">
                  {notice.isPinned ? '[고정] ' : ''}
                  {notice.title}
                </p>
                <p className="mt-1 text-[11px] text-textMuted">{formatDate(notice.createdAt)}</p>
              </NavigationLink>
            ))}
          </div>
        )}
      </div>

      <NavigationLink
        href="/chat"
        prefetch
        className="fixed bottom-20 right-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/30"
        aria-label="챗봇 열기"
      >
        <MessageCircle className="h-6 w-6" />
      </NavigationLink>
    </section>
  );
}
