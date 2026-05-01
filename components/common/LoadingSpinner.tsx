type LoadingSpinnerProps = {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
};

const sizeMap = {
  sm: 'h-4 w-4 border-2',
  md: 'h-7 w-7 border-[3px]',
  lg: 'h-10 w-10 border-4',
} as const;

export function LoadingSpinner({ size = 'md', label = '로딩 중...', className = '' }: LoadingSpinnerProps) {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`} role="status" aria-live="polite">
      <span className={`${sizeMap[size]} animate-spin rounded-full border-primary/20 border-t-primary`} />
      <span className="text-xs font-semibold text-textMuted">{label}</span>
    </div>
  );
}
