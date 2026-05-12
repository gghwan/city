'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ClipboardPen, Loader2, ShieldCheck, UserRoundPlus, XCircle } from 'lucide-react';
import {
  applySlot,
  cancelApplication,
  removeApplicationAsAdmin,
  assignApplication,
  directAssignSlot,
  clearSlot,
  addSlot,
  deleteSlot,
  updateSessionInfo,
  updateSessionMemo,
} from '@/actions/schedule.actions';
import type { ScheduleSessionItem, SlotApplicationItem } from '@/types';

type SessionDetailClientProps = {
  date: string;
  session: ScheduleSessionItem;
  isAdmin: boolean;
  currentUserId: string;
  currentUsername: string;
  assignableUsers: string[];
};

function normalizeNameForMatch(value: string | null | undefined) {
  return String(value ?? '')
    .replace(/관리자$/, '')
    .trim();
}

function isSameAssignableName(left: string | null | undefined, right: string | null | undefined) {
  const leftNormalized = normalizeNameForMatch(left);
  const rightNormalized = normalizeNameForMatch(right);
  if (!leftNormalized || !rightNormalized) return false;
  return leftNormalized === rightNormalized;
}

export function SessionDetailClient({
  date,
  session,
  isAdmin,
  currentUserId,
  currentUsername,
  assignableUsers,
}: SessionDetailClientProps) {
  const router = useRouter();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timeDraft, setTimeDraft] = useState(session.time ?? '');
  const [leaderDraft, setLeaderDraft] = useState(session.leader ?? '');
  const [zoneDraft, setZoneDraft] = useState(session.zone ?? '');
  const [memoDraft, setMemoDraft] = useState(session.adminMemo ?? '');
  const [manualAssignDrafts, setManualAssignDrafts] = useState<Record<number, string>>(() => {
    const next: Record<number, string> = {};
    for (const slot of session.slots) {
      next[slot.slotNo] = slot.memberName ?? '';
    }
    return next;
  });
  const [isPending, startTransition] = useTransition();
  const currentNameNormalized = useMemo(() => normalizeNameForMatch(currentUsername), [currentUsername]);

  const myPending = useMemo(
    () =>
      session.slots.some((slot) =>
        slot.applications.some(
          (entry) => entry.applicantId === currentUserId || isSameAssignableName(entry.applicantName, currentNameNormalized),
        ),
      ),
    [currentNameNormalized, currentUserId, session.slots],
  );

  const myAssigned = useMemo(
    () => session.slots.some((slot) => isSameAssignableName(slot.memberName, currentNameNormalized)),
    [currentNameNormalized, session.slots],
  );

  const memberSlots = useMemo(() => session.slots, [session.slots]);
  const assignedCount = memberSlots.filter((slot) => slot.status === 'assigned').length;
  const openCount = memberSlots.filter((slot) => slot.status === 'open').length;
  const pendingCount = memberSlots.reduce((acc, slot) => acc + slot.applications.length, 0);

  const execute = (taskKey: string, run: () => Promise<unknown>, successMessage: string) => {
    setError('');
    setSuccess('');
    setPendingKey(taskKey);

    startTransition(() => {
      run()
        .then(() => {
          setSuccess(successMessage);
          router.refresh();
        })
        .catch((taskError) => {
          if (taskError instanceof Error) {
            setError(taskError.message);
          } else {
            setError('처리 중 문제가 발생했습니다.');
          }
        })
        .finally(() => {
          setPendingKey(null);
        });
    });
  };

  const canApply = !isAdmin && !myPending && !myAssigned;

  return (
    <section className="space-y-4">
      <article className="rounded-2xl border border-borderColor bg-white p-4">
        <h3 className="text-base font-black text-textBase">{session.title ?? `${session.key === 'AM' ? '오전' : '오후'} 봉사`}</h3>
        <p className="mt-1 text-sm font-semibold text-textMuted">
          {session.time} · {session.zone}
          {session.leader ? ` · 인도자 ${session.leader}` : ' · 인도자 미정'}
        </p>
        <div className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
          <p className="rounded-lg bg-surface px-2 py-1 font-semibold text-textMuted">배정 {assignedCount}명</p>
          <p className="rounded-lg bg-surface px-2 py-1 font-semibold text-textMuted">신청가능 슬롯 {openCount}개</p>
          <p className="rounded-lg bg-surface px-2 py-1 font-semibold text-textMuted">신청 대기 {pendingCount}건</p>
        </div>
      </article>

      {session.adminMemo ? (
        <article className="rounded-2xl border border-warning/35 bg-warning/10 p-4">
          <h4 className="mb-1 text-sm font-black text-warning">인도자/관리자 메모</h4>
          <p className="whitespace-pre-wrap text-sm text-textBase">{session.adminMemo}</p>
        </article>
      ) : null}

      {isAdmin && (
        <details className="rounded-2xl border border-borderColor bg-white">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-bold text-textMuted">
            <UserRoundPlus className="h-4 w-4" /> 슬롯 관리
          </summary>
          <div className="space-y-2 border-t border-borderColor px-4 py-3">
            <button
              type="button"
              onClick={() =>
                execute(
                  'slot-add',
                  () =>
                    addSlot({
                      date,
                      sessionKey: session.key,
                    }),
                  '신규 슬롯을 추가했습니다.',
                )
              }
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white hover:bg-primaryHover disabled:opacity-60"
            >
              {pendingKey === 'slot-add' ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserRoundPlus className="h-4 w-4" />}
              슬롯 추가
            </button>
            <p className="text-xs text-textMuted">배정 완료/신청 대기 슬롯은 삭제할 수 없습니다.</p>
          </div>
        </details>
      )}

      {isAdmin && (
        <details className="rounded-2xl border border-borderColor bg-white">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-bold text-textMuted">
            <ShieldCheck className="h-4 w-4" /> 세션 정보 관리
          </summary>
          <div className="space-y-2 border-t border-borderColor px-4 py-3">
            <label className="block text-xs font-semibold text-textMuted">
              시간
              <input
                value={timeDraft}
                onChange={(event) => setTimeDraft(event.target.value)}
                className="mt-1 w-full rounded-lg border border-borderColor px-3 py-2 text-sm text-textBase outline-none focus:border-primary"
              />
            </label>
            <label className="block text-xs font-semibold text-textMuted">
              인도자
              <input
                value={leaderDraft}
                onChange={(event) => setLeaderDraft(event.target.value)}
                className="mt-1 w-full rounded-lg border border-borderColor px-3 py-2 text-sm text-textBase outline-none focus:border-primary"
              />
            </label>
            <label className="block text-xs font-semibold text-textMuted">
              장소
              <input
                value={zoneDraft}
                onChange={(event) => setZoneDraft(event.target.value)}
                className="mt-1 w-full rounded-lg border border-borderColor px-3 py-2 text-sm text-textBase outline-none focus:border-primary"
              />
            </label>
            <button
              type="button"
              onClick={() =>
                execute(
                  'session-info',
                  () =>
                    updateSessionInfo({
                      date,
                      sessionKey: session.key,
                      time: timeDraft,
                      leader: leaderDraft,
                      zone: zoneDraft,
                    }),
                  '세션 정보(시간/인도자/장소)를 저장했습니다.',
                )
              }
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white hover:bg-primaryHover disabled:opacity-60"
            >
              {pendingKey === 'session-info' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              세션 정보 저장
            </button>
          </div>
        </details>
      )}

      {isAdmin && (
        <details className="rounded-2xl border border-borderColor bg-white">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-bold text-textMuted">
            <ClipboardPen className="h-4 w-4" /> 메모 관리
          </summary>
          <div className="space-y-2 border-t border-borderColor px-4 py-3">
            <textarea
              value={memoDraft}
              onChange={(event) => setMemoDraft(event.target.value)}
              rows={4}
              className="w-full rounded-lg border border-borderColor px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="참여자에게 보여줄 메모를 입력하세요."
            />
            <button
              type="button"
              onClick={() =>
                execute(
                  'memo',
                  () =>
                    updateSessionMemo({
                      date,
                      sessionKey: session.key,
                      memo: memoDraft,
                    }),
                  '메모를 저장했습니다.',
                )
              }
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white hover:bg-primaryHover disabled:opacity-60"
            >
              {pendingKey === 'memo' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              메모 저장
            </button>
          </div>
        </details>
      )}

      {error && <p className="rounded-lg bg-error/10 px-3 py-2 text-xs font-semibold text-error">{error}</p>}
      {success && <p className="rounded-lg bg-success/10 px-3 py-2 text-xs font-semibold text-success">{success}</p>}

      <div className="space-y-3">
        {memberSlots.length === 0 ? (
          <article className="rounded-2xl border border-borderColor bg-white p-4 text-sm text-textMuted">
            현재 등록된 슬롯이 없습니다.
          </article>
        ) : (
          memberSlots.map((slot) => {
            const myApplication =
              slot.applications.find(
                (entry) => entry.applicantId === currentUserId || isSameAssignableName(entry.applicantName, currentNameNormalized),
              ) ?? null;
            const isAssigned = slot.status === 'assigned';
            const isOpen = slot.status === 'open';

            return (
              <article key={`${slot.slotNo}-${slot.status}`} className="rounded-2xl border border-borderColor bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-black text-textBase">슬롯 {slot.slotNo}</h4>
                    <p className="mt-1 text-xs font-semibold text-textMuted">
                      {slot.label ?? (isAssigned ? '배정 완료' : isOpen ? '현재 신청 가능' : '마감됨')}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-[11px] font-bold ${
                      isAssigned
                        ? 'bg-primary/15 text-primary'
                        : isOpen
                        ? 'bg-success/15 text-success'
                        : 'bg-surface text-textMuted'
                    }`}
                  >
                    {isAssigned ? '배정완료' : isOpen ? '신청가능' : '마감'}
                  </span>
                </div>

                {isAssigned ? (
                  <div className="mt-3 flex items-center justify-between rounded-lg bg-surface px-3 py-2 text-sm">
                    <p className="font-semibold text-textBase">배정자: {slot.memberName || '-'}</p>
                    {isAdmin ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (!window.confirm('이 슬롯을 다시 신청가능 상태로 되돌릴까요?')) return;
                          execute(
                            `clear-${slot.slotNo}`,
                            () =>
                              clearSlot({
                                date,
                                sessionKey: session.key,
                                slotNo: slot.slotNo,
                              }),
                            '슬롯을 다시 신청가능 상태로 변경했습니다.',
                          );
                        }}
                        disabled={isPending}
                        className="rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-textBase disabled:opacity-60"
                      >
                        {pendingKey === `clear-${slot.slotNo}` ? '처리중...' : '신청가능으로 변경'}
                      </button>
                    ) : null}
                  </div>
                ) : null}

                {isAdmin ? (
                  <div className="mt-3 rounded-lg border border-primary/25 bg-primary/5 px-3 py-2">
                    <p className="text-[11px] font-bold text-primary">관리자 직접 배정/교체</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <input
                        list={`assignable-users-${slot.slotNo}`}
                        value={manualAssignDrafts[slot.slotNo] ?? ''}
                        onChange={(event) =>
                          setManualAssignDrafts((prev) => ({
                            ...prev,
                            [slot.slotNo]: event.target.value,
                          }))
                        }
                        placeholder="이름 입력 또는 선택"
                        className="min-w-[11rem] flex-1 rounded-lg border border-borderColor bg-white px-2.5 py-1.5 text-xs text-textBase outline-none focus:border-primary"
                      />
                      <datalist id={`assignable-users-${slot.slotNo}`}>
                        {assignableUsers.map((name) => (
                          <option key={`${slot.slotNo}-${name}`} value={name} />
                        ))}
                      </datalist>
                      <button
                        type="button"
                        onClick={() => {
                          const memberName = (manualAssignDrafts[slot.slotNo] ?? '').trim();
                          if (!memberName) {
                            setError('배정할 이름을 입력해주세요.');
                            return;
                          }
                          execute(
                            `direct-assign-${slot.slotNo}`,
                            () =>
                              directAssignSlot({
                                date,
                                sessionKey: session.key,
                                slotNo: slot.slotNo,
                                memberName,
                              }),
                            isAssigned ? `${memberName}님으로 배정자를 교체했습니다.` : `${memberName}님을 직접 배정했습니다.`,
                          );
                        }}
                        disabled={isPending}
                        className="rounded-lg bg-primary px-2.5 py-1.5 text-xs font-bold text-white hover:bg-primaryHover disabled:opacity-60"
                      >
                        {pendingKey === `direct-assign-${slot.slotNo}`
                          ? '처리 중...'
                          : isAssigned
                          ? '배정자 교체'
                          : '직접 배정'}
                      </button>
                    </div>
                  </div>
                ) : null}

                {!isAdmin && isOpen ? (
                  <div className="mt-3 space-y-2">
                    {myApplication ? (
                      <div className="flex items-center gap-2">
                        <p className="inline-flex items-center gap-1 rounded-lg bg-success/15 px-2 py-1 text-xs font-semibold text-success">
                          <CheckCircle2 className="h-3.5 w-3.5" /> 신청 완료
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            if (!window.confirm('신청을 취소할까요?')) return;
                            execute(
                              `cancel-${myApplication.applicationId}`,
                              () =>
                                cancelApplication({
                                  date,
                                  sessionKey: session.key,
                                  applicationId: myApplication.applicationId,
                                }),
                              '신청을 취소했습니다.',
                            );
                          }}
                          disabled={isPending}
                          className="rounded-lg bg-error/10 px-2 py-1 text-xs font-semibold text-error disabled:opacity-60"
                        >
                          {pendingKey === `cancel-${myApplication.applicationId}` ? '취소 중...' : '신청 취소'}
                        </button>
                      </div>
                    ) : canApply ? (
                      <button
                        type="button"
                        onClick={() =>
                          execute(
                            `apply-${slot.slotNo}`,
                            () =>
                              applySlot({
                                date,
                                sessionKey: session.key,
                                slotNo: slot.slotNo,
                                note: '',
                              }),
                            '신청이 완료되었습니다.',
                          )
                        }
                        disabled={isPending}
                        className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white hover:bg-primaryHover disabled:opacity-60"
                      >
                        {pendingKey === `apply-${slot.slotNo}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserRoundPlus className="h-3.5 w-3.5" />}
                        현재 신청 가능
                      </button>
                    ) : (
                      <p className="rounded-lg bg-surface px-2 py-1 text-xs font-semibold text-textMuted">
                        {myAssigned ? '이미 이 시간대에 배정되어 추가 신청이 불가합니다.' : '이미 다른 슬롯에 신청되어 있습니다.'}
                      </p>
                    )}
                  </div>
                ) : null}

                {slot.applications.length > 0 ? (
                  <div className="mt-3 space-y-2 rounded-lg border border-borderColor bg-surface p-3">
                    <p className="text-xs font-bold text-textMuted">신청자 {slot.applications.length}명</p>
                    {slot.applications.map((entry) => (
                      <ApplicationRow
                        key={entry.applicationId}
                        entry={entry}
                        isAdmin={isAdmin}
                        canAssign={isOpen}
                        isLoading={pendingKey === `assign-${entry.applicationId}`}
                        onAssign={() =>
                          execute(
                            `assign-${entry.applicationId}`,
                            () =>
                              assignApplication({
                                date,
                                sessionKey: session.key,
                                slotNo: slot.slotNo,
                                applicationId: entry.applicationId,
                              }),
                            `${entry.applicantName}님을 배정했습니다.`,
                          )
                        }
                        onRemove={() =>
                          execute(
                            `remove-${entry.applicationId}`,
                            () =>
                              removeApplicationAsAdmin({
                                date,
                                sessionKey: session.key,
                                applicationId: entry.applicationId,
                              }),
                            `${entry.applicantName}님의 신청을 취소했습니다.`,
                          )
                        }
                        isRemoveLoading={pendingKey === `remove-${entry.applicationId}`}
                      />
                    ))}
                  </div>
                ) : null}

                {isAdmin && isOpen && slot.applications.length === 0 ? (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (!window.confirm(`슬롯 ${slot.slotNo}를 삭제할까요?`)) return;
                        execute(
                          `delete-slot-${slot.slotNo}`,
                          () =>
                            deleteSlot({
                              date,
                              sessionKey: session.key,
                              slotNo: slot.slotNo,
                            }),
                          `슬롯 ${slot.slotNo}를 삭제했습니다.`,
                        );
                      }}
                      disabled={isPending}
                      className="rounded-lg bg-error/10 px-2 py-1 text-xs font-semibold text-error disabled:opacity-60"
                    >
                      {pendingKey === `delete-slot-${slot.slotNo}` ? '삭제 중...' : '슬롯 삭제'}
                    </button>
                  </div>
                ) : null}
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}

function ApplicationRow({
  entry,
  isAdmin,
  canAssign,
  isLoading,
  onAssign,
  onRemove,
  isRemoveLoading,
}: {
  entry: SlotApplicationItem;
  isAdmin: boolean;
  canAssign: boolean;
  isLoading: boolean;
  onAssign: () => void;
  onRemove: () => void;
  isRemoveLoading: boolean;
}) {
  return (
    <div className="rounded-lg bg-white px-3 py-2 text-xs">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-bold text-textBase">{entry.applicantName}</p>
          <p className="mt-0.5 text-textMuted">신청시간: {entry.submittedAt.slice(0, 16).replace('T', ' ')}</p>
          {entry.note ? <p className="mt-1 whitespace-pre-wrap text-textMuted">메모: {entry.note}</p> : null}
        </div>
        {isAdmin ? (
          <div className="flex items-center gap-1">
            {canAssign ? (
              <button
                type="button"
                onClick={onAssign}
                disabled={isLoading}
                className="inline-flex items-center gap-1 rounded-lg bg-primary px-2 py-1 text-[11px] font-bold text-white hover:bg-primaryHover disabled:opacity-60"
              >
                {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />} 배정
              </button>
            ) : null}
            <button
              type="button"
              onClick={onRemove}
              disabled={isRemoveLoading}
              className="inline-flex items-center gap-1 rounded-lg bg-error/10 px-2 py-1 text-[11px] font-bold text-error disabled:opacity-60"
            >
              {isRemoveLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />} 신청취소
            </button>
          </div>
        ) : null}
      </div>
      {isAdmin && !canAssign ? (
        <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-textMuted">
          <XCircle className="h-3 w-3" /> 이 슬롯은 배정 완료 상태입니다.
        </p>
      ) : null}
    </div>
  );
}
