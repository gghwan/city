import { Megaphone, Pin, Trash2 } from 'lucide-react';
import type { NoticeItem } from '@/types';
import { EmptyState } from '@/components/common/EmptyState';
import { formatDate } from '@/lib/format';

export function NoticeList({
  notices,
  isAdmin,
  updateAction,
  deleteAction,
}: {
  notices: NoticeItem[];
  isAdmin: boolean;
  updateAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
}) {
  if (notices.length === 0) {
    return <EmptyState message="등록된 공지사항이 없습니다" />;
  }

  return (
    <div className="space-y-3">
      {notices.map((notice) => (
        <article key={notice.id} className="rounded-2xl border border-borderColor bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="flex items-center gap-1 text-sm font-bold text-textBase">
                <Megaphone className="h-4 w-4 text-primary" />
                <span className="truncate">{notice.title}</span>
                {notice.isPinned && (
                  <span className="inline-flex items-center gap-1 rounded bg-warning/15 px-1.5 py-0.5 text-[10px] font-bold text-warning">
                    <Pin className="h-3 w-3" />
                    고정
                  </span>
                )}
              </h3>
              <p className="mt-1 text-xs text-textMuted">{formatDate(notice.createdAt)}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-textBase">{notice.content}</p>
            </div>
          </div>

          {isAdmin && (
            <div className="mt-3 space-y-2 border-t border-borderColor pt-3">
              <form action={updateAction} className="space-y-2">
                <input type="hidden" name="id" value={notice.id} />
                <input
                  name="title"
                  defaultValue={notice.title}
                  className="w-full rounded-lg border border-borderColor px-3 py-2 text-sm outline-none focus:border-primary"
                  required
                />
                <textarea
                  name="content"
                  defaultValue={notice.content}
                  rows={4}
                  className="w-full rounded-lg border border-borderColor px-3 py-2 text-sm outline-none focus:border-primary"
                  required
                />
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-textMuted">
                  <input type="checkbox" name="isPinned" defaultChecked={notice.isPinned} />
                  상단 고정 공지
                </label>
                <button type="submit" className="rounded-lg bg-surface px-3 py-2 text-xs font-semibold">
                  공지 수정
                </button>
              </form>

              <form action={deleteAction}>
                <input type="hidden" name="id" value={notice.id} />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 rounded-lg bg-error/10 px-3 py-2 text-xs font-semibold text-error"
                >
                  <Trash2 className="h-3.5 w-3.5" /> 공지 삭제
                </button>
              </form>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
