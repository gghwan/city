'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDown, ArrowUp, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { updateGlobalNotes } from '@/actions/schedule.actions';

type GlobalNotesEditorProps = {
  initialNotes: string[];
};

type NoteRow = {
  id: number;
  text: string;
};

function buildInitialRows(initialNotes: string[]): NoteRow[] {
  if (initialNotes.length === 0) {
    return [{ id: 1, text: '' }];
  }
  return initialNotes.map((text, index) => ({ id: index + 1, text }));
}

export function GlobalNotesEditor({ initialNotes }: GlobalNotesEditorProps) {
  const router = useRouter();
  const [rows, setRows] = useState<NoteRow[]>(() => buildInitialRows(initialNotes));
  const [nextId, setNextId] = useState(() => initialNotes.length + 1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isPending, startTransition] = useTransition();

  const normalizedNotes = useMemo(
    () =>
      rows
        .map((row) => row.text.trim())
        .filter((text) => text.length > 0),
    [rows],
  );

  const addRow = () => {
    setRows((prev) => [...prev, { id: nextId, text: '' }]);
    setNextId((prev) => prev + 1);
  };

  const updateRow = (id: number, value: string) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, text: value } : row)));
  };

  const removeRow = (id: number) => {
    setRows((prev) => {
      const next = prev.filter((row) => row.id !== id);
      return next.length > 0 ? next : [{ id: nextId, text: '' }];
    });
    if (rows.length <= 1) {
      setNextId((prev) => prev + 1);
    }
  };

  const moveRow = (index: number, direction: 'up' | 'down') => {
    setRows((prev) => {
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const currentRow = next[index];
      next[index] = next[target];
      next[target] = currentRow;
      return next;
    });
  };

  const save = () => {
    setError('');
    setSuccess('');

    startTransition(() => {
      updateGlobalNotes({ notes: normalizedNotes })
        .then(() => {
          setSuccess('운영 메모를 저장했습니다.');
          router.refresh();
        })
        .catch((saveError) => {
          if (saveError instanceof Error) {
            setError(saveError.message);
          } else {
            setError('운영 메모 저장 중 문제가 발생했습니다.');
          }
        });
    });
  };

  return (
    <article className="rounded-2xl border border-borderColor bg-white p-4">
      <h3 className="text-sm font-black text-textBase">관리자: 운영 메모 관리</h3>
      <p className="mt-1 text-xs text-textMuted">문장 단위로 추가/삭제/순서 변경 후 저장하세요.</p>

      <div className="mt-3 space-y-2">
        {rows.map((row, index) => (
          <div key={row.id} className="rounded-xl border border-borderColor bg-surface p-2">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-[11px] font-bold text-textMuted">문장 {index + 1}</p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => moveRow(index, 'up')}
                  disabled={index === 0 || isPending}
                  className="rounded-md border border-borderColor bg-white px-2 py-1 text-[11px] font-semibold text-textBase disabled:opacity-40"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveRow(index, 'down')}
                  disabled={index === rows.length - 1 || isPending}
                  className="rounded-md border border-borderColor bg-white px-2 py-1 text-[11px] font-semibold text-textBase disabled:opacity-40"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => removeRow(row.id)}
                  disabled={isPending}
                  className="rounded-md border border-error/40 bg-error/10 px-2 py-1 text-[11px] font-semibold text-error disabled:opacity-40"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <textarea
              value={row.text}
              onChange={(event) => updateRow(row.id, event.target.value)}
              rows={2}
              className="w-full rounded-lg border border-borderColor bg-white px-2 py-1.5 text-sm text-textBase outline-none focus:border-primary"
              placeholder="운영 메모 문장을 입력하세요."
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addRow}
        disabled={isPending}
        className="mt-3 inline-flex items-center gap-1 rounded-lg border border-borderColor bg-white px-3 py-2 text-xs font-bold text-textBase disabled:opacity-60"
      >
        <Plus className="h-3.5 w-3.5" /> 문장 추가
      </button>

      <div className="mt-4 rounded-xl border border-borderColor bg-surface p-3">
        <p className="text-xs font-bold text-textBase">미리보기</p>
        {normalizedNotes.length === 0 ? (
          <p className="mt-1 text-xs text-textMuted">표시될 문장이 없습니다.</p>
        ) : (
          <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-textMuted">
            {normalizedNotes.map((note, index) => (
              <li key={`${index}-${note}`}>{note}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-3">
        <button
          type="button"
          onClick={save}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          운영 메모 저장
        </button>
      </div>

      {error ? <p className="mt-2 rounded-lg bg-error/10 px-3 py-2 text-xs font-semibold text-error">{error}</p> : null}
      {success ? <p className="mt-2 rounded-lg bg-success/10 px-3 py-2 text-xs font-semibold text-success">{success}</p> : null}
    </article>
  );
}
