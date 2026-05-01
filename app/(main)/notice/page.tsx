import { getNotices, createNoticeAction, updateNoticeAction, deleteNoticeAction } from '@/actions/notice.actions';
import { NoticeList } from '@/components/notice/NoticeList';
import { getCachedServerSession } from '@/lib/session';

export default async function NoticePage() {
  const [session, notices] = await Promise.all([getCachedServerSession(), getNotices()]);
  const isAdmin = session?.user.role === 'ADMIN';

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-black text-textBase">공지사항</h2>
        <p className="text-xs text-textMuted">캠페인 운영 공지를 확인하세요.</p>
      </div>

      {isAdmin && (
        <form action={createNoticeAction} className="space-y-2 rounded-2xl border border-borderColor bg-white p-4">
          <input
            name="title"
            className="w-full rounded-lg border border-borderColor px-3 py-2 text-sm outline-none focus:border-primary"
            placeholder="공지 제목"
            required
          />
          <textarea
            name="content"
            rows={4}
            className="w-full rounded-lg border border-borderColor px-3 py-2 text-sm outline-none focus:border-primary"
            placeholder="공지 내용을 입력하세요."
            required
          />
          <label className="inline-flex items-center gap-2 text-xs font-semibold text-textMuted">
            <input type="checkbox" name="isPinned" />
            상단 고정 공지
          </label>
          <button type="submit" className="rounded-lg bg-primary px-3 py-2 text-sm font-bold text-white hover:bg-primaryHover">
            공지 등록
          </button>
        </form>
      )}

      <NoticeList
        notices={notices}
        isAdmin={isAdmin}
        updateAction={updateNoticeAction}
        deleteAction={deleteNoticeAction}
      />
    </section>
  );
}
