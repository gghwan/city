import { Navigation } from 'lucide-react';
import { getLinks, updateLinkAction } from '@/actions/link.actions';
import { ExternalLinkSection } from '@/components/link/ExternalLinkSection';
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

      <ExternalLinkSection
        title="Google 지도"
        description="지도 앱에서 캠페인 구역을 확인하세요."
        href={links.map.url}
        icon={Navigation}
        ctaLabel="지도 열기"
        ctaClassName="bg-[#964219]"
        updatedAt={links.map.updatedAt}
        previewImageSrc="/images/map-preview.jpg"
        previewImageAlt="구역 지도 링크 미리보기"
        previewWidth={1200}
        previewHeight={675}
      />

      {isAdmin && (
        <form action={updateLinkAction} className="rounded-2xl border border-borderColor bg-white p-4">
          <input type="hidden" name="type" value="map" />
          <label className="mb-2 block text-xs font-semibold text-textMuted">지도 URL 수정</label>
          <div className="flex gap-2">
            <input
              name="url"
              defaultValue={links.map.url}
              className="w-full rounded-lg border border-borderColor px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <button type="submit" className="rounded-lg bg-primary px-3 py-2 text-sm font-bold text-white">
              저장
            </button>
          </div>
          <p className="mt-2 text-[11px] font-semibold text-textMuted">
            링크를 변경한 뒤 미리보기 이미지도 함께 갱신하면 사용자 혼선이 줄어듭니다.
          </p>
        </form>
      )}
    </section>
  );
}
