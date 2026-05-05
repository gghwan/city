import { Smartphone } from 'lucide-react';
import { getLinks, updateLinkAction } from '@/actions/link.actions';
import { ExternalLinkSection } from '@/components/link/ExternalLinkSection';
import { getCachedServerSession } from '@/lib/session';

export default async function CardPage() {
  const session = await getCachedServerSession();
  const isAdmin = session?.user.role === 'ADMIN';
  const links = await getLinks();

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-black">호별 카드</h2>
        <p className="text-xs text-textMuted">서울풍납 회중 전자 구역 카드 시스템</p>
      </div>

      <ExternalLinkSection
        title="전자 카드 시스템"
        description="구역 카드와 기록 관리를 위해 외부 시스템으로 이동합니다."
        href={links.card.url}
        icon={Smartphone}
        ctaLabel="카드 시스템 열기"
        ctaClassName="bg-success"
        updatedAt={links.card.updatedAt}
        previewImageSrc="/images/card-preview.jpg"
        previewImageAlt="전자 구역 카드 로그인 화면 미리보기"
        previewWidth={780}
        previewHeight={1328}
      />

      {isAdmin && (
        <form action={updateLinkAction} className="rounded-2xl border border-borderColor bg-white p-4">
          <input type="hidden" name="type" value="card" />
          <label className="mb-2 block text-xs font-semibold text-textMuted">호별 카드 URL 수정</label>
          <div className="flex gap-2">
            <input
              name="url"
              defaultValue={links.card.url}
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
