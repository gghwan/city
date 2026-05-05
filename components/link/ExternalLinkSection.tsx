import Image from 'next/image';
import type { LucideIcon } from 'lucide-react';
import { ExternalLink } from 'lucide-react';
import { formatDate } from '@/lib/format';

type ExternalLinkSectionProps = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  ctaLabel: string;
  ctaClassName: string;
  updatedAt?: string | null;
  previewImageSrc?: string;
  previewImageAlt?: string;
  previewWidth?: number;
  previewHeight?: number;
};

function getDomainLabel(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function ExternalLinkSection({
  title,
  description,
  href,
  icon: Icon,
  ctaLabel,
  ctaClassName,
  updatedAt,
  previewImageSrc,
  previewImageAlt,
  previewWidth = 1200,
  previewHeight = 675,
}: ExternalLinkSectionProps) {
  const normalizedHref = href.trim();
  const hasLink = normalizedHref.length > 0;

  return (
    <>
      <article className="rounded-3xl border border-borderColor bg-white p-6 text-center">
        <h3 className="text-base font-bold">{title}</h3>
        <p className="mt-2 text-xs text-textMuted">{description}</p>
        {updatedAt ? <p className="mt-2 text-[11px] font-semibold text-textMuted">최근 갱신: {formatDate(updatedAt)}</p> : null}

        {hasLink ? (
          <a
            href={normalizedHref}
            target="_blank"
            rel="noreferrer"
            className={`mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white ${ctaClassName}`}
          >
            <Icon className="h-4 w-4" />
            {ctaLabel}
            <ExternalLink className="h-4 w-4" />
          </a>
        ) : (
          <p className="mt-4 text-xs font-semibold text-textMuted">등록된 링크가 없습니다.</p>
        )}
      </article>

      <article className="rounded-3xl border border-borderColor bg-white p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-textBase">링크 미리보기</h3>
          {hasLink ? (
            <a
              href={normalizedHref}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-primary underline underline-offset-2"
            >
              원본 링크 열기
            </a>
          ) : null}
        </div>

        {hasLink ? (
          <a
            href={normalizedHref}
            target="_blank"
            rel="noreferrer"
            className="block overflow-hidden rounded-2xl border border-borderColor"
          >
            {previewImageSrc ? (
              <Image
                src={previewImageSrc}
                alt={previewImageAlt ?? `${title} 링크 미리보기`}
                width={previewWidth}
                height={previewHeight}
                className="h-auto w-full"
                priority
              />
            ) : (
              <div className="flex min-h-44 items-center justify-center bg-surface px-4 text-center">
                <p className="text-sm font-semibold text-textMuted">{getDomainLabel(normalizedHref)}</p>
              </div>
            )}
          </a>
        ) : (
          <div className="flex min-h-44 items-center justify-center rounded-2xl border border-borderColor bg-surface px-4 text-center">
            <p className="text-sm font-semibold text-textMuted">링크가 등록되면 이 영역에 미리보기가 표시됩니다.</p>
          </div>
        )}
      </article>
    </>
  );
}
