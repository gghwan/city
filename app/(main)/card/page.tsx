import { ExternalLink, Smartphone } from 'lucide-react';
import { getLinks, updateLinkAction } from '@/actions/link.actions';
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

      <article className="rounded-3xl border border-borderColor bg-white p-6 text-center">
        <h3 className="text-base font-bold">전자 카드 시스템</h3>
        <p className="mt-2 text-xs text-textMuted">구역 카드와 기록 관리를 위해 외부 시스템으로 이동합니다.</p>
        <a
          href={links.card}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-success px-4 py-3 text-sm font-bold text-white"
        >
          <Smartphone className="h-4 w-4" />
          카드 시스템 열기
          <ExternalLink className="h-4 w-4" />
        </a>
      </article>

      {isAdmin && (
        <form action={updateLinkAction} className="rounded-2xl border border-borderColor bg-white p-4">
          <input type="hidden" name="type" value="card" />
          <label className="mb-2 block text-xs font-semibold text-textMuted">호별 카드 URL 수정</label>
          <div className="flex gap-2">
            <input
              name="url"
              defaultValue={links.card}
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
