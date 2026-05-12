import { notFound } from 'next/navigation';
import { ArrowRight, CalendarCheck2, Clock3 } from 'lucide-react';
import {
  createScheduleSessionAction,
  deleteScheduleDateAction,
  deleteScheduleSessionAction,
  getMyScheduleApplications,
  getScheduleDate,
} from '@/actions/schedule.actions';
import { NavigationLink } from '@/components/common/NavigationLink';
import { getCachedServerSession } from '@/lib/session';
import { getDateTitle, getSessionId, getSessionLabel } from '@/lib/schedule-utils';

function isValidDateParam(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export default async function ScheduleDatePage({ params }: { params: { date: string } }) {
  if (!isValidDateParam(params.date)) {
    notFound();
  }

  const [session, dateItem, myApplications] = await Promise.all([
    getCachedServerSession(),
    getScheduleDate(params.date),
    getMyScheduleApplications(),
  ]);

  if (!session || !dateItem) {
    notFound();
  }

  const isAdmin = session.user.role === 'ADMIN';
  const hasAM = dateItem.sessions.some((item) => item.key === 'AM');
  const hasPM = dateItem.sessions.some((item) => item.key === 'PM');
  const totalOpen = dateItem.sessions.reduce(
    (acc, item) => acc + item.slots.filter((slot) => slot.status === 'open').length,
    0,
  );

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-black text-textBase">{getDateTitle(dateItem)}</h2>
        <p className="text-xs text-textMuted">총 {dateItem.sessions.length}개 세션 · 신청가능 슬롯 {totalOpen}개</p>
      </div>

      <article className="rounded-2xl border border-borderColor bg-white p-4 text-xs text-textMuted">
        <p>{dateItem.circuitServiceZoom ? '순회구 봉사 마련(09시 30분 Zoom)이 있습니다.' : '순회구 Zoom 예정이 없습니다.'}</p>
      </article>

      {isAdmin ? (
        <article className="space-y-3 rounded-2xl border border-borderColor bg-white p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-black text-textBase">관리자: 날짜/세션 관리</h3>
            <form action={deleteScheduleDateAction}>
              <input type="hidden" name="date" value={dateItem.date} />
              <button
                type="submit"
                className="rounded-lg bg-error/10 px-2.5 py-1.5 text-xs font-semibold text-error"
              >
                날짜 삭제
              </button>
            </form>
          </div>

          {!hasAM ? (
            <form action={createScheduleSessionAction} className="grid gap-2 rounded-xl border border-borderColor p-3">
              <input type="hidden" name="date" value={dateItem.date} />
              <input type="hidden" name="sessionKey" value="AM" />
              <p className="text-xs font-bold text-textBase">오전 세션 추가</p>
              <input name="title" defaultValue="오전 봉사" className="rounded-lg border border-borderColor px-2 py-1.5 text-xs" />
              <input name="time" defaultValue="09시30분" className="rounded-lg border border-borderColor px-2 py-1.5 text-xs" />
              <input name="zone" defaultValue="장소 미정" className="rounded-lg border border-borderColor px-2 py-1.5 text-xs" required />
              <input name="leader" defaultValue="" className="rounded-lg border border-borderColor px-2 py-1.5 text-xs" />
              <button type="submit" className="rounded-lg bg-primary px-2.5 py-1.5 text-xs font-semibold text-white">오전 세션 생성</button>
            </form>
          ) : null}

          {!hasPM ? (
            <form action={createScheduleSessionAction} className="grid gap-2 rounded-xl border border-borderColor p-3">
              <input type="hidden" name="date" value={dateItem.date} />
              <input type="hidden" name="sessionKey" value="PM" />
              <p className="text-xs font-bold text-textBase">오후 세션 추가</p>
              <input name="title" defaultValue="오후 봉사" className="rounded-lg border border-borderColor px-2 py-1.5 text-xs" />
              <input name="time" defaultValue="13시30분" className="rounded-lg border border-borderColor px-2 py-1.5 text-xs" />
              <input name="zone" defaultValue="장소 미정" className="rounded-lg border border-borderColor px-2 py-1.5 text-xs" required />
              <input name="leader" defaultValue="" className="rounded-lg border border-borderColor px-2 py-1.5 text-xs" />
              <button type="submit" className="rounded-lg bg-primary px-2.5 py-1.5 text-xs font-semibold text-white">오후 세션 생성</button>
            </form>
          ) : null}
        </article>
      ) : null}

      <div className="space-y-3">
        {dateItem.sessions.map((sessionItem) => {
          const memberSlots = sessionItem.slots;
          const assignedCount = memberSlots.filter((slot) => slot.status === 'assigned').length;
          const openCount = memberSlots.filter((slot) => slot.status === 'open').length;
          const pendingCount = memberSlots.reduce((acc, slot) => acc + slot.applications.length, 0);
          const myStatus = myApplications.find(
            (item) => item.date === dateItem.date && item.sessionKey === sessionItem.key,
          );

          return (
            <article key={sessionItem.key} className="rounded-2xl border border-borderColor bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-black text-textBase">
                    {sessionItem.title ?? `${getSessionLabel(sessionItem.key)} 봉사`}
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-textMuted">
                    <Clock3 className="mr-1 inline h-3.5 w-3.5" />
                    {sessionItem.time} · {sessionItem.zone}
                    {sessionItem.leader ? ` · 인도자 ${sessionItem.leader}` : ' · 인도자 미정'}
                  </p>
                </div>
                <NavigationLink
                  href={`/schedule/${dateItem.date}/${getSessionId(sessionItem.key)}`}
                  className="inline-flex items-center gap-1 rounded-lg bg-surface px-2 py-1 text-xs font-semibold text-textBase"
                >
                  자세히 보기 <ArrowRight className="h-3.5 w-3.5" />
                </NavigationLink>
              </div>

              {isAdmin ? (
                <form action={deleteScheduleSessionAction} className="mt-3">
                  <input type="hidden" name="date" value={dateItem.date} />
                  <input type="hidden" name="sessionKey" value={sessionItem.key} />
                  <button type="submit" className="rounded-lg bg-error/10 px-2.5 py-1 text-xs font-semibold text-error">
                    이 세션 삭제
                  </button>
                </form>
              ) : null}

              <div className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
                <p className="rounded-lg bg-surface px-2 py-1 font-semibold text-textMuted">배정 {assignedCount}명</p>
                <p className="rounded-lg bg-surface px-2 py-1 font-semibold text-textMuted">신청가능 {openCount}칸</p>
                <p className="rounded-lg bg-surface px-2 py-1 font-semibold text-textMuted">대기 {pendingCount}건</p>
              </div>

              {myStatus ? (
                <p className="mt-3 inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                  <CalendarCheck2 className="h-3.5 w-3.5" />
                  {myStatus.status === 'assigned' ? '내 배정 완료' : '내 신청 대기 중'}
                </p>
              ) : null}

              {isAdmin && sessionItem.adminMemo ? (
                <p className="mt-3 rounded-lg bg-warning/10 px-2 py-1 text-xs font-semibold text-warning">메모: {sessionItem.adminMemo}</p>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
