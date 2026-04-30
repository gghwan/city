'use client';

import { useFormStatus } from 'react-dom';

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white hover:bg-primaryHover disabled:opacity-60"
    >
      {pending ? '처리 중...' : label}
    </button>
  );
}

export function FileUploadForm({
  action,
  type,
}: {
  action: (formData: FormData) => Promise<void>;
  type: 'SERVICE' | 'EMERGENCY';
}) {
  return (
    <form action={action} className="space-y-2 rounded-2xl border border-borderColor bg-white p-4">
      <input type="hidden" name="type" value={type} />
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          name="name"
          placeholder="파일명"
          className="rounded-lg border border-borderColor px-3 py-2 text-sm outline-none focus:border-primary"
          required
        />
        <input
          name="description"
          placeholder="설명(선택)"
          className="rounded-lg border border-borderColor px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>
      <input
        type="file"
        name="file"
        accept="application/pdf"
        className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-surface file:px-3 file:py-2"
        required
      />
      <SubmitButton label="PDF 업로드" />
    </form>
  );
}
