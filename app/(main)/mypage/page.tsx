import { CalendarCheck2, Clock3, ExternalLink, FileImage, FolderOpen, MapPin } from 'lucide-react';
import { getFiles } from '@/actions/file.actions';
import { getMyScheduleApplications } from '@/actions/schedule.actions';
import { getUsersForAdmin } from '@/actions/user.actions';
import { EmptyState } from '@/components/common/EmptyState';
import { NavigationLink } from '@/components/common/NavigationLink';
import { AdminUserManager } from '@/components/mypage/AdminUserManager';
import { formatBytes, formatDate } from '@/lib/format';
import { getCachedServerSession } from '@/lib/session';
import { getSessionId, getSessionLabel } from '@/lib/schedule-utils';
import type { FileItem } from '@/types';

function scheduleStatusLabel(status: 'pending' | 'assigned') {
  return status === 'assigned' ? '배정 완료' : '신청 대기';
}

function scheduleStatusClass(status: 'pending' | 'assigned') {
  return status === 'assigned' ? 'bg-primary/15 text-primary' : 'bg-warning/15 text-warning';
}

function fileCategoryLabel(type: FileItem['type']) {
  if (type === 'SERVICE') return '봉사 마련';
  if (type === 'EMERGENCY') return '비상 연락';
  return '대화 방법';
}

function getFileExtension(name: string) {
  const index = name.lastIndexOf('.');
  if (index < 0 || index === name.length - 1) return 'FILE';
  return name.slice(index + 1).toUpperCase();
}

function sortByCreatedAtDesc(a: FileItem, b: FileItem) {
  const keyA = `${a.createdAt}-${String(a.id).padStart(6, '0')}`;
  const keyB = `${b.createdAt}-${String(b.id).padStart(6, '0')}`;
  return keyB.localeCompare(keyA);
}

export default async function MyPage() {
  const session = await getCachedServerSession();

  if (!session) return null;
  if (session.user.role === 'ADMIN') {
    let users: Awaited<ReturnType<typeof getUsersForAdmin>> = [];
    let loadError: string | null = null;
    try {
      users = await getUsersForAdmin();
    } catch (error) {
      loadError = error instanceof Error ? error.message : '사용자 목록 조회에 실패했습니다.';
    }
    const sessionBaseUsername = session.user.username.replace(/관리자$/, '').trim();

    return <AdminUserManager users={users} sessionBaseUsername={sessionBaseUsername} loadError={loadError} />;
  }

  const [myApplications, serviceFiles, emergencyFiles, talkFiles] = await Promise.all([
    getMyScheduleApplications(),
    getFiles('service'),
    getFiles('emergency'),
    getFiles('talk'),
  ]);

  const documentPreviewItems = [...serviceFiles, ...emergencyFiles, ...talkFiles].sort(sortByCreatedAtDesc).slice(0, 12);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-black text-textBase">마이페이지</h2>
        <p className="text-xs text-textMuted">{session.user.username}님의 신청 일정과 공유 문서를 한눈에 확인할 수 있습니다.</p>
      </div>

      <article className="grid gap-2 rounded-2xl border border-borderColor bg-white p-4 text-xs text-textMuted sm:grid-cols-2">
        <p>
          <span className="font-bold text-textBase">내 신청 일정</span> {myApplications.length}건
        </p>
        <p>
          <span className="font-bold text-textBase">문서 미리보기</span> {documentPreviewItems.length}개
        </p>
      </article>

      <section className="space-y-2 rounded-2xl border border-borderColor bg-white p-4">
        <h3 className="inline-flex items-center gap-1 text-sm font-black text-textBase">
          <CalendarCheck2 className="h-4 w-4 text-primary" /> 내가 신청한 일정
        </h3>

        {myApplications.length === 0 ? (
          <EmptyState message="아직 신청하거나 배정된 일정이 없습니다." />
        ) : (
          <div className="space-y-2">
            {myApplications.map((item) => (
              <article key={`${item.date}-${item.sessionKey}-${item.slotNo}-${item.status}`} className="rounded-xl border border-borderColor bg-surface p-3 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-textBase">
                      {item.date} ({item.day}) · {getSessionLabel(item.sessionKey)}
                    </p>
                    <p className="mt-1 inline-flex items-center gap-1 text-textMuted">
                      <Clock3 className="h-3.5 w-3.5" /> {item.time}
                    </p>
                    <p className="mt-1 inline-flex items-center gap-1 text-textMuted">
                      <MapPin className="h-3.5 w-3.5" /> {item.zone} · 슬롯 {item.slotNo}
                    </p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${scheduleStatusClass(item.status)}`}>
                    {scheduleStatusLabel(item.status)}
                  </span>
                </div>

                <div className="mt-2">
                  <NavigationLink
                    href={`/schedule/${item.date}/${getSessionId(item.sessionKey)}`}
                    className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-[11px] font-semibold text-textBase"
                  >
                    자세히 보기 <ExternalLink className="h-3.5 w-3.5" />
                  </NavigationLink>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-2 rounded-2xl border border-borderColor bg-white p-4">
        <h3 className="inline-flex items-center gap-1 text-sm font-black text-textBase">
          <FolderOpen className="h-4 w-4 text-primary" /> 문서 미리보기
        </h3>

        {documentPreviewItems.length === 0 ? (
          <EmptyState message="아직 업로드된 문서가 없습니다." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {documentPreviewItems.map((file) => {
              const isImage = file.mimeType.toLowerCase().startsWith('image/');
              const previewSrc = `/api/files/${file.id}?mode=open`;
              const viewerHref = `/viewer/${file.id}?from=/mypage`;
              return (
                <article key={`preview-${file.id}`} className="overflow-hidden rounded-xl border border-borderColor bg-surface p-3">
                  <NavigationLink href={viewerHref} className="block overflow-hidden rounded-lg border border-borderColor bg-white">
                    {isImage ? (
                      <img src={previewSrc} alt={`${file.name} 미리보기`} className="h-24 w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="flex h-24 items-center justify-center gap-2 px-3 text-textMuted">
                        <FileImage className="h-5 w-5" />
                        <span className="text-sm font-bold">{getFileExtension(file.name)}</span>
                      </div>
                    )}
                  </NavigationLink>

                  <div className="mt-2">
                    <p className="truncate text-sm font-bold text-textBase">{file.name}</p>
                    <p className="mt-1 text-[11px] text-textMuted">
                      {fileCategoryLabel(file.type)} · {formatDate(file.createdAt)} · {formatBytes(file.sizeBytes)}
                    </p>
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <NavigationLink href={viewerHref} className="rounded-lg bg-primary px-2 py-1.5 text-center text-[11px] font-semibold text-white">
                      뷰어로 열기
                    </NavigationLink>
                    <a
                      href={`/api/files/${file.id}?mode=download`}
                      className="rounded-lg bg-white px-2 py-1.5 text-center text-[11px] font-semibold text-textBase"
                    >
                      다운로드
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </section>
  );
}
