'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save } from 'lucide-react';
import { cancelMySubmittedReport, upsertMyReport } from '@/actions/report.actions';
import { CounterField } from '@/components/report/CounterField';
import type { ReportMinistryType, ReportShift, ServiceReportItem, ServiceReportStatus } from '@/types';

const subwayLocations = ['미사역', '올림픽공원역', '천호역(5번출구)', '천호역(6번출구)', '문정역'];

const experienceServiceTypes = [
  '호별',
  '지하철전시대',
  '전시대',
  '시장 및 상가',
  '오피스 구역',
  '공원 및 관광지',
  '캠퍼스',
  '공공 기관',
  '가두 증거',
  '개인 활동 중 봉사',
  '기타',
];

const experienceTypes = [
  '캠페인 전 세웠던 구체적인 목표가 달성된 경험',
  '상대방의 영적 필요를 발견하고 적절히 채워 준 경험',
  '관심을 자라게 한 경험 (재방문 경험)',
  '성경 공부가 시작된 경험',
  '대도시에서 하는 봉사의 특징이 잘 나타나는 경험',
  '평소에 만나기 힘든 사람(기업인, 정치인 등)과 대화한 경험',
  '그 밖에 인상깊었던 경험',
];

type ReportFormModel = {
  reportDate: string;
  ministryType: ReportMinistryType;
  revisitCount: number;
  contactExchangeCount: number;
  visitRequestCount: number;
  bibleStudyProposalCount: number;
  bibleStudyStartCount: number;
  subwayShift: ReportShift;
  subwayLocation: string;
  magazineCount: number;
  brochureCount: number;
  subwayVisitRequestCount: number;
  notes: string;
  experienceServiceType: string;
  experienceType: string;
  experienceContent: string;
};

function toInitialModel(date: string, source?: ServiceReportItem | null): ReportFormModel {
  return {
    reportDate: source?.reportDate ?? date,
    ministryType: source?.ministryType ?? 'CIRCUIT',
    revisitCount: source?.revisitCount ?? 0,
    contactExchangeCount: source?.contactExchangeCount ?? 0,
    visitRequestCount: source?.visitRequestCount ?? 0,
    bibleStudyProposalCount: source?.bibleStudyProposalCount ?? 0,
    bibleStudyStartCount: source?.bibleStudyStartCount ?? 0,
    subwayShift: source?.subwayShift ?? '',
    subwayLocation: source?.subwayLocation ?? '',
    magazineCount: source?.magazineCount ?? 0,
    brochureCount: source?.brochureCount ?? 0,
    subwayVisitRequestCount: source?.subwayVisitRequestCount ?? 0,
    notes: source?.notes ?? '',
    experienceServiceType: source?.experienceServiceType ?? '',
    experienceType: source?.experienceType ?? '',
    experienceContent: source?.experienceContent ?? '',
  };
}

export function ReportForm({ initialDate, initialReport }: { initialDate: string; initialReport?: ServiceReportItem | null }) {
  const router = useRouter();
  const [model, setModel] = useState<ReportFormModel>(() => toInitialModel(initialDate, initialReport));
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [pendingStatus, setPendingStatus] = useState<ServiceReportStatus | null>(null);
  const [isPending, startTransition] = useTransition();

  const totalCircuit =
    model.revisitCount +
    model.contactExchangeCount +
    model.visitRequestCount +
    model.bibleStudyProposalCount +
    model.bibleStudyStartCount;

  const totalSubway = model.magazineCount + model.brochureCount + model.subwayVisitRequestCount;

  const canSubmit = useMemo(() => /^\d{4}-\d{2}-\d{2}$/.test(model.reportDate), [model.reportDate]);
  const canCancelSubmit = Boolean(initialReport?.status === 'SUBMITTED' && initialReport?.reportDate === model.reportDate);

  const setNumber = (key: keyof ReportFormModel, value: number) => {
    setModel((prev) => ({ ...prev, [key]: Math.max(0, Math.min(9999, value)) }));
  };

  const submit = (status: ServiceReportStatus) => {
    if (!canSubmit || isPending) return;

    setPendingStatus(status);
    setError('');
    setMessage('');

    startTransition(() => {
      upsertMyReport({ ...model, status })
        .then(() => {
          setMessage(status === 'DRAFT' ? '임시저장되었습니다.' : '보고가 제출되었습니다.');
          router.refresh();
        })
        .catch((submitError) => {
          if (submitError instanceof Error) {
            setError(submitError.message);
          } else {
            setError('보고 저장 중 오류가 발생했습니다.');
          }
        })
        .finally(() => {
          setPendingStatus(null);
        });
    });
  };

  const cancelSubmit = () => {
    if (!initialReport?.reportDate || isPending) return;
    if (!window.confirm('제출을 취소하고 임시저장 상태로 변경할까요?')) return;

    setPendingStatus('DRAFT');
    setError('');
    setMessage('');

    startTransition(() => {
      cancelMySubmittedReport(initialReport.reportDate)
        .then(() => {
          setMessage('제출이 취소되어 임시저장 상태로 변경되었습니다.');
          router.refresh();
        })
        .catch((cancelError) => {
          if (cancelError instanceof Error) {
            setError(cancelError.message);
          } else {
            setError('제출 취소 중 오류가 발생했습니다.');
          }
        })
        .finally(() => {
          setPendingStatus(null);
        });
    });
  };

  return (
    <section className="space-y-4 rounded-2xl border border-borderColor bg-white p-4">
      <div className="space-y-1">
        <h3 className="text-base font-black text-textBase">봉사 보고 작성</h3>
        <p className="text-xs text-textMuted">건수만 입력하거나 내용을 비워 두어도 제출할 수 있습니다.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-xs font-semibold text-textMuted">
          봉사 참여일
          <input
            type="date"
            value={model.reportDate}
            onChange={(event) => setModel((prev) => ({ ...prev, reportDate: event.target.value }))}
            className="w-full rounded-lg border border-borderColor px-3 py-2 text-base text-textBase outline-none focus:border-primary md:text-sm"
          />
        </label>

        <label className="space-y-1 text-xs font-semibold text-textMuted">
          봉사 유형
          <select
            value={model.ministryType}
            onChange={(event) => setModel((prev) => ({ ...prev, ministryType: event.target.value as ReportMinistryType }))}
            className="w-full rounded-lg border border-borderColor px-3 py-2 text-base text-textBase outline-none focus:border-primary md:text-sm"
          >
            <option value="CIRCUIT">회중봉사/순회구 봉사</option>
            <option value="SUBWAY">지하철 전시대 봉사</option>
          </select>
        </label>
      </div>

      <article className="space-y-2 rounded-xl border border-borderColor bg-surface p-3">
        <h4 className="text-sm font-black text-textBase">회중봉사/순회구 봉사</h4>
        <div className="grid gap-2 sm:grid-cols-2">
          <CounterField label="재방문" value={model.revisitCount} onChange={(value) => setNumber('revisitCount', value)} />
          <CounterField
            label="연락처(주소) 교환"
            value={model.contactExchangeCount}
            onChange={(value) => setNumber('contactExchangeCount', value)}
          />
          <CounterField
            label="방문 요청"
            value={model.visitRequestCount}
            onChange={(value) => setNumber('visitRequestCount', value)}
          />
          <CounterField
            label="성경 공부 제안"
            value={model.bibleStudyProposalCount}
            onChange={(value) => setNumber('bibleStudyProposalCount', value)}
          />
          <CounterField
            label="성경 공부 시작"
            value={model.bibleStudyStartCount}
            onChange={(value) => setNumber('bibleStudyStartCount', value)}
          />
        </div>
        <p className="text-xs font-semibold text-textMuted">합계: {totalCircuit}건</p>
      </article>

      <article className="space-y-3 rounded-xl border border-borderColor bg-surface p-3">
        <h4 className="text-sm font-black text-textBase">지하철 전시대 봉사</h4>

        <div className="space-y-1">
          <p className="text-xs font-semibold text-textMuted">참여 시간대 (택1)</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'AM', label: '오전' },
              { value: 'PM', label: '오후' },
            ].map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setModel((prev) => ({ ...prev, subwayShift: item.value as ReportShift }))}
                className={`rounded-lg border px-3 py-2 text-sm font-semibold ${
                  model.subwayShift === item.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-borderColor bg-white text-textMuted'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-semibold text-textMuted">장소 (택1)</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {subwayLocations.map((location) => (
              <button
                key={location}
                type="button"
                onClick={() => setModel((prev) => ({ ...prev, subwayLocation: location }))}
                className={`rounded-lg border px-3 py-2 text-left text-sm font-semibold ${
                  model.subwayLocation === location
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-borderColor bg-white text-textMuted'
                }`}
              >
                {location}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <CounterField label="잡지 배부 수" value={model.magazineCount} onChange={(value) => setNumber('magazineCount', value)} />
          <CounterField label="행누책 배부 수" value={model.brochureCount} onChange={(value) => setNumber('brochureCount', value)} />
          <CounterField
            label="방문 요청 수"
            value={model.subwayVisitRequestCount}
            onChange={(value) => setNumber('subwayVisitRequestCount', value)}
            unit="회"
          />
        </div>

        <p className="text-xs font-semibold text-textMuted">합계: {totalSubway}건</p>

        <label className="space-y-1 text-xs font-semibold text-textMuted">
          유의점/기타사항
          <textarea
            value={model.notes}
            onChange={(event) => setModel((prev) => ({ ...prev, notes: event.target.value }))}
            rows={3}
            className="w-full rounded-lg border border-borderColor bg-white px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </label>
      </article>

      <article className="space-y-3 rounded-xl border border-borderColor bg-surface p-3">
        <h4 className="text-sm font-black text-textBase">경험담</h4>

        <label className="space-y-1 text-xs font-semibold text-textMuted">
          참여한 봉사 유형 (택1)
          <select
            value={model.experienceServiceType}
            onChange={(event) => setModel((prev) => ({ ...prev, experienceServiceType: event.target.value }))}
            className="w-full rounded-lg border border-borderColor bg-white px-3 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="">선택하세요</option>
            {experienceServiceTypes.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-xs font-semibold text-textMuted">
          경험담 유형 (택1)
          <select
            value={model.experienceType}
            onChange={(event) => setModel((prev) => ({ ...prev, experienceType: event.target.value }))}
            className="w-full rounded-lg border border-borderColor bg-white px-3 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="">선택하세요</option>
            {experienceTypes.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-xs font-semibold text-textMuted">
          경험담 내용
          <textarea
            value={model.experienceContent}
            onChange={(event) => setModel((prev) => ({ ...prev, experienceContent: event.target.value }))}
            rows={5}
            className="w-full rounded-lg border border-borderColor bg-white px-3 py-2 text-sm outline-none focus:border-primary"
            placeholder="경험한 내용(상황, 대상, 대화내용)과 교훈/느낀점을 적어주세요."
          />
        </label>
      </article>

      {error && <p className="rounded-lg bg-error/10 px-3 py-2 text-xs font-semibold text-error">{error}</p>}
      {message && <p className="rounded-lg bg-success/10 px-3 py-2 text-xs font-semibold text-success">{message}</p>}

      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => submit('DRAFT')}
          disabled={isPending || !canSubmit}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-borderColor bg-white px-3 py-2 text-sm font-bold text-textBase disabled:opacity-60"
        >
          {pendingStatus === 'DRAFT' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} 임시저장
        </button>
        <button
          type="button"
          onClick={() => submit('SUBMITTED')}
          disabled={isPending || !canSubmit}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-white hover:bg-primaryHover disabled:opacity-60"
        >
          {pendingStatus === 'SUBMITTED' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} 보고 제출
        </button>
      </div>

      {canCancelSubmit ? (
        <button
          type="button"
          onClick={cancelSubmit}
          disabled={isPending}
          className="w-full rounded-lg bg-error/10 px-3 py-2 text-sm font-bold text-error disabled:opacity-60"
        >
          {pendingStatus === 'DRAFT' ? '취소 처리 중...' : '제출 취소 후 수정하기'}
        </button>
      ) : null}
    </section>
  );
}
