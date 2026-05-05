'use client';

import { ExternalLink, PencilLine, Trash2 } from 'lucide-react';
import type { FileItem } from '@/types';
import { EmptyState } from '@/components/common/EmptyState';
import { formatBytes, formatDate } from '@/lib/format';

export function FileList({
  files,
  isAdmin,
  updateAction,
  deleteAction,
}: {
  files: FileItem[];
  isAdmin: boolean;
  updateAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
}) {
  if (files.length === 0) {
    return <EmptyState message="아직 업로드된 파일이 없습니다" />;
  }

  return (
    <div className="space-y-3">
      {files.map((file) => (
        <article key={file.id} className="rounded-2xl border border-borderColor bg-white p-4">
          {isAdmin ? (
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-bold text-textBase">{file.name}</h3>
                <p className="mt-1 text-xs text-textMuted">
                  {formatBytes(file.sizeBytes)} · {formatDate(file.createdAt)}
                </p>
                {file.description && <p className="mt-2 text-xs text-textMuted">{file.description}</p>}
              </div>

              <a
                href={file.signedUrl || '#'}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-lg bg-surface px-2 py-1 text-xs font-semibold text-textBase"
              >
                열기 <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          ) : (
            <>
              <a
                href={`/api/files/${file.id}?mode=open`}
                target="_blank"
                rel="noreferrer"
                className="block rounded-lg border border-transparent p-1 hover:border-borderColor"
              >
                <h3 className="truncate text-sm font-bold text-textBase">{file.name}</h3>
                <p className="mt-1 text-xs text-textMuted">
                  {formatBytes(file.sizeBytes)} · {formatDate(file.createdAt)}
                </p>
                {file.description && <p className="mt-2 text-xs text-textMuted">{file.description}</p>}
              </a>

              <div className="mt-3 grid gap-2 border-t border-borderColor pt-3 sm:grid-cols-2">
                <a
                  href={`/api/files/${file.id}?mode=open`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg bg-primary px-3 py-2 text-center text-xs font-semibold text-white"
                >
                  바로 열기
                </a>
                <a
                  href={`/api/files/${file.id}?mode=download`}
                  className="rounded-lg bg-surface px-3 py-2 text-center text-xs font-semibold text-textBase"
                >
                  다운로드
                </a>
              </div>
            </>
          )}

          {isAdmin && (
            <details className="mt-3 rounded-xl border border-borderColor bg-surface">
              <summary className="flex cursor-pointer list-none items-center gap-1 px-3 py-2 text-xs font-bold text-textMuted">
                <PencilLine className="h-3.5 w-3.5" />
                관리 옵션 열기
              </summary>

              <div className="space-y-2 border-t border-borderColor px-3 py-3">
                <form action={updateAction} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                  <input type="hidden" name="id" value={file.id} />
                  <input
                    name="name"
                    defaultValue={file.name}
                    className="rounded-lg border border-borderColor px-2 py-1.5 text-xs outline-none focus:border-primary"
                    required
                  />
                  <input
                    name="description"
                    defaultValue={file.description ?? ''}
                    className="rounded-lg border border-borderColor px-2 py-1.5 text-xs outline-none focus:border-primary"
                    placeholder="설명"
                  />
                  <button type="submit" className="rounded-lg bg-white px-2 py-1.5 text-xs font-semibold">
                    저장
                  </button>
                </form>

                <form
                  action={deleteAction}
                  onSubmit={(event) => {
                    if (!window.confirm('이 파일을 삭제할까요?')) {
                      event.preventDefault();
                    }
                  }}
                >
                  <input type="hidden" name="id" value={file.id} />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1 rounded-lg bg-error/10 px-2 py-1.5 text-xs font-semibold text-error"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> 삭제
                  </button>
                </form>
              </div>
            </details>
          )}
        </article>
      ))}
    </div>
  );
}
