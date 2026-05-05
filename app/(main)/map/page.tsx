import Image from 'next/image';
import { ExternalLink, Navigation } from 'lucide-react';
import { getLinks, updateLinkAction } from '@/actions/link.actions';
import { getCachedServerSession } from '@/lib/session';

export default async function MapPage() {
  const session = await getCachedServerSession();
  const isAdmin = session?.user.role === 'ADMIN';
  const links = await getLinks();

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-black">구역 지도</h2>
        <p className="text-xs text-textMuted">한강공원, 올림픽공원, 아산병원 구역</p>
      </div>

      <article className="rounded-3xl border border-borderColor bg-white p-6 text-center">
        <h3 className="text-base font-bold">Google 지도</h3>
        <p className="mt-2 text-xs text-textMuted">지도 앱에서 캠페인 구역을 확인하세요.</p>
        <a
          href={links.map}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#964219] px-4 py-3 text-sm font-bold text-white"
        >
          <Navigation className="h-4 w-4" />
          지도 열기
          <ExternalLink className="h-4 w-4" />
        </a>
      </article>

      <article className="rounded-3xl border border-borderColor bg-white p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-textBase">링크 미리보기</h3>
          <a
            href={links.map}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-primary underline underline-offset-2"
          >
            원본 링크 열기
          </a>
        </div>
        <a href={links.map} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-2xl border border-borderColor">
          <Image
            src="/images/map-preview.jpg"
            alt="구역 지도 링크 미리보기"
            width={1200}
            height={675}
            className="h-auto w-full"
            priority
          />
        </a>
      </article>

      {isAdmin && (
        <form action={updateLinkAction} className="rounded-2xl border border-borderColor bg-white p-4">
          <input type="hidden" name="type" value="map" />
          <label className="mb-2 block text-xs font-semibold text-textMuted">지도 URL 수정</label>
          <div className="flex gap-2">
            <input
              name="url"
              defaultValue={links.map}
              className="w-full rounded-lg border border-borderColor px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <button type="submit" className="rounded-lg bg-primary px-3 py-2 text-sm font-bold text-white">
              저장
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
