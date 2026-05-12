import { notFound } from 'next/navigation';
import { getAssignableUsernamesForAdmin, getScheduleDate, getScheduleSession } from '@/actions/schedule.actions';
import { SessionDetailClient } from '@/components/schedule/SessionDetailClient';
import { getCachedServerSession } from '@/lib/session';
import type { ScheduleSessionKey } from '@/types';

function parseSessionKey(value: string): ScheduleSessionKey | null {
  if (value === 'am') return 'AM';
  if (value === 'pm') return 'PM';
  return null;
}

function isValidDateParam(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export default async function ScheduleSessionPage({
  params,
}: {
  params: { date: string; sessionKey: string };
}) {
  if (!isValidDateParam(params.date)) {
    notFound();
  }

  const sessionKey = parseSessionKey(params.sessionKey);
  if (!sessionKey) {
    notFound();
  }

  const [currentSession, dateItem, sessionItem] = await Promise.all([
    getCachedServerSession(),
    getScheduleDate(params.date),
    getScheduleSession(params.date, sessionKey),
  ]);

  if (!currentSession || !dateItem || !sessionItem) {
    notFound();
  }

  const isAdmin = currentSession.user.role === 'ADMIN';
  const assignableUsers = isAdmin ? await getAssignableUsernamesForAdmin() : [];

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-black text-textBase">
          {dateItem.date} ({dateItem.day}) · {sessionKey === 'AM' ? '오전' : '오후'}
        </h2>
        <p className="text-xs text-textMuted">세션 상세, 신청 현황, 팀 배정을 확인하세요.</p>
      </div>

      <SessionDetailClient
        date={dateItem.date}
        session={sessionItem}
        isAdmin={isAdmin}
        currentUserId={currentSession.user.id}
        currentUsername={currentSession.user.username}
        assignableUsers={assignableUsers}
      />
    </section>
  );
}
