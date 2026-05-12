import { ArrowLeft, ArrowRight, CalendarDays } from 'lucide-react';
import type { CalendarDayCell } from '@/lib/schedule-utils';
import { NavigationLink } from '@/components/common/NavigationLink';
import { getWeekDayLabels } from '@/lib/schedule-utils';

type CalendarMonthProps = {
  monthLabel: string;
  prevHref: string;
  nextHref: string;
  cells: CalendarDayCell[];
};

export function CalendarMonth({ monthLabel, prevHref, nextHref, cells }: CalendarMonthProps) {
  const weekDays = getWeekDayLabels();

  return (
    <section className="space-y-3 rounded-2xl border border-borderColor bg-white p-3 sm:p-4">
      <div className="flex items-center justify-between">
        <NavigationLink
          href={prevHref}
          className="inline-flex items-center gap-1 rounded-lg border border-borderColor bg-surface px-2 py-1 text-xs font-semibold text-textBase"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="sm:hidden">이전</span>
          <span className="hidden sm:inline">이전 달</span>
        </NavigationLink>
        <h2 className="inline-flex items-center gap-1 text-sm font-black text-textBase sm:text-base">
          <CalendarDays className="h-4 w-4 text-primary" />
          {monthLabel}
        </h2>
        <NavigationLink
          href={nextHref}
          className="inline-flex items-center gap-1 rounded-lg border border-borderColor bg-surface px-2 py-1 text-xs font-semibold text-textBase"
        >
          <span className="sm:hidden">다음</span>
          <span className="hidden sm:inline">다음 달</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </NavigationLink>
      </div>

      <p className="text-[11px] font-semibold text-textMuted">
        <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-[#b7ddb6]" /> 일정 있음
        <span className="mx-2 inline-block h-2.5 w-2.5 rounded-full bg-[#2f7f44]" /> 신청가능 있음
        <span className="mx-2 inline-block h-2.5 w-2.5 rounded-full bg-[#b9ae8f]" /> 신청가능 없음
      </p>

      <div className="mx-auto grid w-full max-w-[680px] grid-cols-7 gap-0.5 sm:gap-1">
        {weekDays.map((day) => (
          <div key={day} className="py-1 text-center text-[10px] font-bold text-textMuted sm:text-[11px]">
            {day}
          </div>
        ))}

        {cells.map((cell) => {
          const baseClass = cell.inCurrentMonth ? 'text-textBase' : 'text-textMuted/50';
          const todayClass = cell.isToday ? 'ring-2 ring-primary/35' : '';
          const scheduleClass = cell.hasSchedule
            ? 'border-[#b7ddb6] bg-[#edf8ef] hover:border-[#8fbe8e]'
            : 'border-borderColor bg-surface/60';

          return (
            <div key={cell.date} className="aspect-square">
              {cell.hasSchedule ? (
                <NavigationLink
                  href={`/schedule/${cell.date}`}
                  prefetch
                  className={`block h-full rounded-xl border p-1.5 sm:p-2 transition hover:border-primary ${baseClass} ${todayClass} ${scheduleClass}`}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-sm font-black">{cell.day}</span>
                    <span
                      className={`mt-1 inline-block h-2.5 w-2.5 rounded-full ${
                        cell.openSlotCount > 0 ? 'bg-[#2f7f44]' : 'bg-[#b9ae8f]'
                      }`}
                      aria-label={cell.openSlotCount > 0 ? '신청가능 있음' : '신청가능 없음'}
                      title={cell.openSlotCount > 0 ? '신청가능 있음' : '신청가능 없음'}
                    />
                  </div>
                </NavigationLink>
              ) : (
                <div className={`h-full rounded-xl border p-2 ${baseClass} ${todayClass} ${scheduleClass}`}>
                  <span className="text-sm font-black">{cell.day}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
