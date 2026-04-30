import { FileText } from 'lucide-react';

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-borderColor bg-white p-8 text-center">
      <FileText className="mx-auto mb-3 h-10 w-10 text-textMuted/50" />
      <p className="text-sm font-semibold text-textMuted">{message}</p>
    </div>
  );
}
