import { ClipboardList } from 'lucide-react';
import { getAllReports, getMyReportByDate, getMyReports } from '@/actions/report.actions';
import { NavigationLink } from '@/components/common/NavigationLink';
import { EmptyState } from '@/components/common/EmptyState';
import { ReportForm } from '@/components/report/ReportForm';
import { formatDateTime } from '@/lib/format';
import { getCachedServerSession } from '@/lib/session';
import { getRelativeDayIso, getTodayIso } from '@/lib/schedule-utils';
import type { ServiceReportItem } from '@/types';

function isValidDateParam(value: string | undefined) {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function statusText(status: ServiceReportItem['status']) {
  return status === 'SUBMITTED' ? '제출완료' : '임시저장';
}

function statusClass(status: ServiceReportItem['status']) {
  return status === 'SUBMITTED' ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning';
}

export default async function ReportPage({
  searchParams,
}: {
  searchParams?: { date?: string };
}) {
  const session = await getCachedServerSession();
  if (!session) return null;

  const today = getTodayIso();
  const selectedDate = isValidDateParam(searchParams?.date) ? String(searchParams?.date) : today;

  const [myReports, selectedReport, allReports] = await Promise.all([
    getMyReports(),
    getMyReportByDate(selectedDate),
    session.user.role === 'ADMIN' ? getAllReports() : Promise.resolve<ServiceReportItem[]>([]),
  ]);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-black text-textBase">봉사 보고</h2>
        <p className="text-xs text-textMuted">로그인한 사용자 계정으로 날짜별 보고를 작성하고 수정할 수 있습니다.</p>
      </div>

      <article className="rounded-2xl border border-borderColor bg-white p-4 text-xs text-textMuted">
        <p className="font-semibold text-textBase">보고 작성 날짜</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
            const iso = getRelativeDayIso(-offset);
            const active = iso === selectedDate;
            return (
              <NavigationLink
                key={iso}
                href={`/report?date=${iso}`}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                  active ? 'bg-primary text-white' : 'bg-surface text-textBase'
                }`}
              >
                {iso}
              </NavigationLink>
            );
          })}
        </div>
      </article>

      <ReportForm initialDate={selectedDate} initialReport={selectedReport} />

      <section className="space-y-2 rounded-2xl border border-borderColor bg-white p-4">
        <h3 className="inline-flex items-center gap-1 text-sm font-black text-textBase">
          <ClipboardList className="h-4 w-4 text-primary" /> 내 보고 내역
        </h3>

        {myReports.length === 0 ? (
          <EmptyState message="아직 제출한 보고가 없습니다." />
        ) : (
          <div className="space-y-2">
            {myReports.map((item) => (
              <article key={item.id} className="rounded-xl border border-borderColor bg-surface p-3 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-textBase">{item.reportDate}</p>
                    <p className="mt-1 text-textMuted">
                      {item.ministryType === 'CIRCUIT' ? '회중봉사/순회구 봉사' : '지하철 전시대 봉사'} · 수정 {formatDateTime(item.updatedAt)}
                    </p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${statusClass(item.status)}`}>
                    {statusText(item.status)}
                  </span>
                </div>
                <div className="mt-2">
                  <NavigationLink
                    href={`/report?date=${item.reportDate}`}
                    className="inline-flex rounded-lg bg-white px-2.5 py-1 text-[11px] font-semibold text-textBase"
                  >
                    이 보고 수정하기
                  </NavigationLink>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {session.user.role === 'ADMIN' ? (
        <section className="space-y-2 rounded-2xl border border-borderColor bg-white p-4">
          <h3 className="text-sm font-black text-textBase">관리자 전체 보고 보기</h3>
          {allReports.length === 0 ? (
            <p className="text-xs text-textMuted">아직 제출된 보고가 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {allReports.map((item) => (
                <article key={`admin-${item.id}`} className="rounded-xl border border-borderColor bg-surface p-3 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-textBase">
                      {item.reportDate} · {item.reporterName}
                    </p>
                    <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${statusClass(item.status)}`}>
                      {statusText(item.status)}
                    </span>
                  </div>
                  <p className="mt-1 text-textMuted">
                    재방문 {item.revisitCount} / 연락처교환 {item.contactExchangeCount} / 방문요청 {item.visitRequestCount}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}
    </section>
  );
}
