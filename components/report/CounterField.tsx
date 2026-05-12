'use client';

import { Minus, Plus } from 'lucide-react';

type CounterFieldProps = {
  label: string;
  value: number;
  onChange: (next: number) => void;
  unit?: string;
};

export function CounterField({ label, value, onChange, unit = '건' }: CounterFieldProps) {
  const safeValue = Number.isFinite(value) ? value : 0;

  return (
    <div className="rounded-xl border border-borderColor bg-white p-3">
      <p className="mb-2 text-sm font-semibold text-textBase">{label}</p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, safeValue - 1))}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-surface text-textBase"
          aria-label={`${label} 감소`}
        >
          <Minus className="h-4 w-4" />
        </button>

        <div className="flex h-9 min-w-[72px] items-center justify-center rounded-lg border border-borderColor px-2 text-base font-black text-textBase">
          {safeValue}
          <span className="ml-1 text-xs font-semibold text-textMuted">{unit}</span>
        </div>

        <button
          type="button"
          onClick={() => onChange(Math.min(9999, safeValue + 1))}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-surface text-textBase"
          aria-label={`${label} 증가`}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
