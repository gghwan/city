import { Link2 } from 'lucide-react';
import { deleteFileAction, getFiles, getSignedUrls, updateFileAction } from '@/actions/file.actions';
import { getLinks, updateLinkAction } from '@/actions/link.actions';
import { ExternalLinkSection } from '@/components/link/ExternalLinkSection';
import { FileList } from '@/components/service/FileList';
import { FileUploadForm } from '@/components/service/FileUploadForm';
import { getCachedServerSession } from '@/lib/session';

export default async function TalkPage() {
  const [session, links, rawFiles] = await Promise.all([getCachedServerSession(), getLinks(), getFiles('talk')]);
  const isAdmin = session?.user.role === 'ADMIN';

  const files = isAdmin
    ? await (async () => {
        const signedUrls = await getSignedUrls(rawFiles.map((file) => file.storagePath));
        return rawFiles.map((file) => ({
          ...file,
          signedUrl: signedUrls[file.storagePath] ?? '#',
        }));
      })()
    : rawFiles;

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-lg font-black">대화 방법</h2>
        <p className="text-xs text-textMuted">구역별 대화 방법 제안</p>
      </div>

      <ExternalLinkSection
        title="공유 링크"
        description="외부 자료 링크가 있으면 바로 열 수 있습니다."
        href={links.talk.url}
        icon={Link2}
        ctaLabel="링크 열기"
        ctaClassName="bg-[#6b4ce6]"
        updatedAt={links.talk.updatedAt}
      />

      {isAdmin && (
        <form action={updateLinkAction} className="rounded-2xl border border-borderColor bg-white p-4">
          <input type="hidden" name="type" value="talk" />
          <label className="mb-2 block text-xs font-semibold text-textMuted">대화 방법 URL 수정</label>
          <div className="flex gap-2">
            <input
              name="url"
              defaultValue={links.talk.url}
              className="w-full rounded-lg border border-borderColor px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <button type="submit" className="rounded-lg bg-primary px-3 py-2 text-sm font-bold text-white">
              저장
            </button>
          </div>
          <p className="mt-2 text-[11px] font-semibold text-textMuted">
            링크를 바꾼 경우 안내 문구/첨부 파일도 함께 최신화해 주세요.
          </p>
        </form>
      )}

      <div className="space-y-2">
        <h3 className="text-sm font-bold text-textBase">관련 파일</h3>
        {isAdmin && <FileUploadForm type="TALK" />}
        <FileList files={files} isAdmin={isAdmin} updateAction={updateFileAction} deleteAction={deleteFileAction} />
      </div>
    </section>
  );
}
