import { createScheduleDateAction, getScheduleSeedData } from '@/actions/schedule.actions';
import { CalendarMonth } from '@/components/schedule/CalendarMonth';
import { GlobalNotesEditor } from '@/components/schedule/GlobalNotesEditor';
import { buildMonthCalendar, getMonthParam, parseMonthParam, shiftMonth } from '@/lib/schedule-utils';
import { getCachedServerSession } from '@/lib/session';

export default async function SchedulePage({
  searchParams,
}: {
  searchParams?: { month?: string };
}) {
  const [session, schedule] = await Promise.all([getCachedServerSession(), getScheduleSeedData()]);
  const isAdmin = session?.user.role === 'ADMIN';
  const parsed = parseMonthParam(searchParams?.month);
  const prev = shiftMonth(parsed.year, parsed.month, -1);
  const next = shiftMonth(parsed.year, parsed.month, 1);
  const monthParam = getMonthParam(parsed.year, parsed.month);
  const cells = buildMonthCalendar(schedule, parsed.year, parsed.month);

  const scheduledDaysInMonth = cells.filter((cell) => cell.inCurrentMonth && cell.hasSchedule).length;
  const openSlotsInMonth = cells
    .filter((cell) => cell.inCurrentMonth)
    .reduce((acc, cell) => acc + cell.openSlotCount, 0);
  const globalNotesLines = [
    schedule.globalNotes.applyContact,
    schedule.globalNotes.meetingPlace,
    ...schedule.globalNotes.specialDuty,
  ].filter((line) => line && line.trim().length > 0);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-black text-textBase">일정 캘린더</h2>
        <p className="text-xs text-textMuted">
          캠페인 기간: {schedule.meta.campaignPeriod.from} ~ {schedule.meta.campaignPeriod.to}
        </p>
      </div>

      <article className="grid gap-2 rounded-2xl border border-borderColor bg-white p-4 text-xs text-textMuted sm:grid-cols-3">
        <p>
          <span className="font-bold text-textBase">선택 월</span> {monthParam}
        </p>
        <p>
          <span className="font-bold text-textBase">일정 있는 날짜</span> {scheduledDaysInMonth}일
        </p>
        <p>
          <span className="font-bold text-textBase">신청가능 슬롯</span> {openSlotsInMonth}개
        </p>
      </article>

      <CalendarMonth
        monthLabel={`${parsed.year}년 ${parsed.month}월`}
        prevHref={`/schedule?month=${getMonthParam(prev.year, prev.month)}`}
        nextHref={`/schedule?month=${getMonthParam(next.year, next.month)}`}
        cells={cells}
      />

      <article className="rounded-2xl border border-borderColor bg-white p-4 text-xs text-textMuted">
        <p className="font-bold text-textBase">운영 메모</p>
        <ul className="mt-2 list-disc space-y-1 pl-4">
          {globalNotesLines.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </article>

      {isAdmin ? (
        <GlobalNotesEditor initialNotes={globalNotesLines} />
      ) : null}

      {isAdmin ? (
        <article className="rounded-2xl border border-borderColor bg-white p-4">
          <h3 className="text-sm font-black text-textBase">관리자: 날짜 추가</h3>
          <p className="mt-1 text-xs text-textMuted">날짜를 추가한 뒤 상세 페이지에서 오전/오후 세션을 생성할 수 있습니다.</p>
          <form action={createScheduleDateAction} className="mt-3 flex flex-wrap items-center gap-2">
            <input
              type="date"
              name="date"
              required
              className="rounded-lg border border-borderColor px-3 py-2 text-xs text-textBase outline-none focus:border-primary"
            />
            <button type="submit" className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white">
              날짜 추가
            </button>
          </form>
        </article>
      ) : null}
    </section>
  );
}
