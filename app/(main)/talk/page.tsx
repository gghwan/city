import { ExternalLink, Link2 } from 'lucide-react';
import { deleteFileAction, getFiles, getSignedUrls, updateFileAction } from '@/actions/file.actions';
import { getLinks, updateLinkAction } from '@/actions/link.actions';
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

  const hasTalkLink = Boolean(links.talk?.trim());

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-lg font-black">대화 방법</h2>
        <p className="text-xs text-textMuted">구역별 대화 방법 제안</p>
      </div>

      <article className="rounded-3xl border border-borderColor bg-white p-6 text-center">
        <h3 className="text-base font-bold">공유 링크</h3>
        <p className="mt-2 text-xs text-textMuted">외부 자료 링크가 있으면 바로 열 수 있습니다.</p>
        {hasTalkLink ? (
          <a
            href={links.talk}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#6b4ce6] px-4 py-3 text-sm font-bold text-white"
          >
            <Link2 className="h-4 w-4" />
            링크 열기
            <ExternalLink className="h-4 w-4" />
          </a>
        ) : (
          <p className="mt-4 text-xs font-semibold text-textMuted">등록된 링크가 없습니다.</p>
        )}
      </article>

      {isAdmin && (
        <form action={updateLinkAction} className="rounded-2xl border border-borderColor bg-white p-4">
          <input type="hidden" name="type" value="talk" />
          <label className="mb-2 block text-xs font-semibold text-textMuted">대화 방법 URL 수정</label>
          <div className="flex gap-2">
            <input
              name="url"
              defaultValue={links.talk}
              className="w-full rounded-lg border border-borderColor px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <button type="submit" className="rounded-lg bg-primary px-3 py-2 text-sm font-bold text-white">
              저장
            </button>
          </div>
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
