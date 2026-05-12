import type { ScheduleDateItem, ScheduleSeedData, ScheduleSessionKey } from '@/types';

const WEEK_DAYS_KO = ['일', '월', '화', '수', '목', '금', '토'] as const;
const APP_TIME_ZONE = 'Asia/Seoul';

export type CalendarDayCell = {
  date: string;
  day: number;
  weekday: number;
  inCurrentMonth: boolean;
  isToday: boolean;
  hasSchedule: boolean;
  sessionCount: number;
  openSlotCount: number;
};

export function formatDateToIso(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayIso() {
  const now = getNowInAppTimeZone();
  return `${now.year}-${String(now.month).padStart(2, '0')}-${String(now.day).padStart(2, '0')}`;
}

export function getRelativeDayIso(offsetDays: number) {
  const now = getNowInAppTimeZone();
  const cursor = new Date(Date.UTC(now.year, now.month - 1, now.day));
  cursor.setUTCDate(cursor.getUTCDate() + offsetDays);
  return `${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, '0')}-${String(
    cursor.getUTCDate(),
  ).padStart(2, '0')}`;
}

export function parseMonthParam(month: string | null | undefined) {
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [year, monthIndex] = month.split('-').map(Number);
    if (Number.isFinite(year) && Number.isFinite(monthIndex) && monthIndex >= 1 && monthIndex <= 12) {
      return { year, month: monthIndex };
    }
  }

  const now = getNowInAppTimeZone();
  return { year: now.year, month: now.month };
}

export function getMonthParam(year: number, month: number) {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function shiftMonth(year: number, month: number, delta: number) {
  const cursor = new Date(year, month - 1 + delta, 1);
  return { year: cursor.getFullYear(), month: cursor.getMonth() + 1 };
}

export function buildMonthCalendar(schedule: ScheduleSeedData, year: number, month: number): CalendarDayCell[] {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);

  const firstWeekday = start.getDay();
  const daysInMonth = end.getDate();

  const cells: CalendarDayCell[] = [];

  for (let index = firstWeekday - 1; index >= 0; index -= 1) {
    const date = new Date(year, month - 1, -index);
    cells.push(createDayCell(schedule, date, false));
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month - 1, day);
    cells.push(createDayCell(schedule, date, true));
  }

  while (cells.length % 7 !== 0 || cells.length < 35) {
    const date = new Date(year, month - 1, daysInMonth + (cells.length - (firstWeekday + daysInMonth)) + 1);
    cells.push(createDayCell(schedule, date, false));
  }

  return cells;
}

function createDayCell(schedule: ScheduleSeedData, date: Date, inCurrentMonth: boolean): CalendarDayCell {
  const iso = formatDateToIso(date);
  const dateItem = schedule.dates.find((item) => item.date === iso);
  const openSlotCount =
    dateItem?.sessions.reduce((acc, session) => acc + session.slots.filter((slot) => slot.status === 'open').length, 0) ?? 0;

  return {
    date: iso,
    day: date.getDate(),
    weekday: date.getDay(),
    inCurrentMonth,
    isToday: iso === getTodayIso(),
    hasSchedule: Boolean(dateItem),
    sessionCount: dateItem?.sessions.length ?? 0,
    openSlotCount,
  };
}

export function getDateTitle(dateItem: ScheduleDateItem) {
  const [year, month, day] = dateItem.date.split('-').map(Number);
  return `${year}년 ${month}월 ${day}일 (${dateItem.day})`;
}

export function getSessionId(sessionKey: ScheduleSessionKey) {
  return sessionKey.toLowerCase();
}

export function getSessionLabel(sessionKey: ScheduleSessionKey) {
  return sessionKey === 'AM' ? '오전' : '오후';
}

export function getWeekDayLabels() {
  return [...WEEK_DAYS_KO];
}

function getNowInAppTimeZone() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(new Date());
  const year = Number(parts.find((part) => part.type === 'year')?.value ?? '0');
  const month = Number(parts.find((part) => part.type === 'month')?.value ?? '1');
  const day = Number(parts.find((part) => part.type === 'day')?.value ?? '1');

  return { year, month, day };
}
