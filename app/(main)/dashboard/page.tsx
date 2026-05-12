import { NavigationLink } from '@/components/common/NavigationLink';
import { MenuGrid } from '@/components/dashboard/MenuGrid';
import { getNotices } from '@/actions/notice.actions';
import { formatDate } from '@/lib/format';
import { getCachedServerSession } from '@/lib/session';

export default async function DashboardPage() {
  const session = await getCachedServerSession();
  const isAdmin = session?.user.role === 'ADMIN';

  let notices: Awaited<ReturnType<typeof getNotices>> = [];
  if (isAdmin) {
    try {
      notices = (await getNotices()).slice(0, 2);
    } catch (error) {
      console.error('[DashboardPage] 공지 조회 실패:', error);
    }
  }

  return (
    <section>
      <p className="mb-4 text-xs text-textMuted">캠페인 핵심 메뉴</p>
      <MenuGrid isAdmin={isAdmin} />

      {isAdmin ? (
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
                    {notice.noticeType === 'EMERGENCY' ? '[팝업 공지] ' : notice.isPinned ? '[고정] ' : ''}
                    {notice.title}
                  </p>
                  <p className="mt-1 text-[11px] text-textMuted">{formatDate(notice.createdAt)}</p>
                </NavigationLink>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
