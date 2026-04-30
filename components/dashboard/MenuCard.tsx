import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

export function MenuCard({
  href,
  title,
  description,
  icon: Icon,
  color,
}: {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
}) {
  return (
    <Link
      href={href}
      className="group relative rounded-2xl border border-borderColor bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98]"
    >
      <div className="mb-3 inline-flex rounded-xl p-2" style={{ background: `${color}1A`, color }}>
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-base font-black text-textBase">{title}</h3>
      <p className="mt-1 text-xs text-textMuted">{description}</p>
    </Link>
  );
}
