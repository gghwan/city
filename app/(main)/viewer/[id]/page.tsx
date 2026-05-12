import { Download, ExternalLink, FileText } from 'lucide-react';
import { getFileById, getSignedUrl } from '@/actions/file.actions';
import { NavigationLink } from '@/components/common/NavigationLink';
import { PdfViewerClient } from '@/components/service/PdfViewerClient';

const OFFICE_EMBED_EXTENSIONS = new Set(['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx']);
const TEXT_EMBED_EXTENSIONS = new Set(['txt', 'csv', 'xml']);
const FILE_LIKE_EXTERNAL_EXTENSIONS = new Set([
  'pdf',
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'svg',
  'bmp',
  'tif',
  'tiff',
  'txt',
  'csv',
  'xml',
  'doc',
  'docx',
  'ppt',
  'pptx',
  'xls',
  'xlsx',
]);

function getExtension(name: string) {
  const index = name.lastIndexOf('.');
  if (index < 0 || index === name.length - 1) return '';
  return name.slice(index + 1).toLowerCase();
}

function isImageMime(mime: string) {
  return mime.toLowerCase().startsWith('image/');
}

function isPdfMime(mime: string, ext: string) {
  return mime.toLowerCase().includes('pdf') || ext === 'pdf';
}

function isTextMime(mime: string, ext: string) {
  return mime.toLowerCase().startsWith('text/') || TEXT_EMBED_EXTENSIONS.has(ext);
}

function isOfficeMime(mime: string) {
  const normalized = mime.toLowerCase();
  return (
    normalized.includes('msword') ||
    normalized.includes('officedocument') ||
    normalized.includes('vnd.ms-excel') ||
    normalized.includes('vnd.ms-powerpoint')
  );
}

function getSafeBackPath(value: string | undefined) {
  if (!value) return '/service';
  if (!value.startsWith('/')) return '/service';
  return value;
}

function getUrlPathExtension(url: string) {
  try {
    const parsed = new URL(url);
    return getExtension(parsed.pathname);
  } catch {
    return '';
  }
}

export default async function FileViewerPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { from?: string };
}) {
  const backPath = getSafeBackPath(searchParams?.from);
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return (
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-black text-textBase">문서 보기</h2>
          <p className="mt-1 text-xs text-textMuted">잘못된 문서 경로입니다.</p>
        </div>
        <article className="rounded-2xl border border-borderColor bg-white p-4">
          <p className="text-sm font-semibold text-textBase">문서를 열 수 없습니다. 목록에서 다시 선택해 주세요.</p>
          <NavigationLink
            href={backPath}
            className="mt-3 inline-flex rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white"
          >
            목록으로 돌아가기
          </NavigationLink>
        </article>
      </section>
    );
  }

  const file = await getFileById(id);
  if (!file) {
    return (
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-black text-textBase">문서 보기</h2>
          <p className="mt-1 text-xs text-textMuted">문서를 찾을 수 없습니다.</p>
        </div>
        <article className="rounded-2xl border border-borderColor bg-white p-4">
          <p className="text-sm font-semibold text-textBase">삭제되었거나 권한이 없는 문서입니다.</p>
          <NavigationLink
            href={backPath}
            className="mt-3 inline-flex rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white"
          >
            목록으로 돌아가기
          </NavigationLink>
        </article>
      </section>
    );
  }

  const ext = getExtension(file.name);
  const signedUrl = await getSignedUrl(file.storagePath);
  const hasRemoteSignedUrl = signedUrl !== '#';
  const isExternalSource = file.storagePath.startsWith('http://') || file.storagePath.startsWith('https://');
  const externalPathExtension = isExternalSource ? getUrlPathExtension(file.storagePath) : '';
  const isFileLikeExternalSource =
    !isExternalSource ||
    FILE_LIKE_EXTERNAL_EXTENSIONS.has(externalPathExtension) ||
    isPdfMime(file.mimeType, ext) ||
    isImageMime(file.mimeType) ||
    isTextMime(file.mimeType, ext) ||
    isOfficeMime(file.mimeType);
  const openUrl = `/api/files/${file.id}?mode=open`;
  const downloadUrl = `/api/files/${file.id}?mode=download`;
  const officeViewerUrl =
    hasRemoteSignedUrl && OFFICE_EMBED_EXTENSIONS.has(ext)
      ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(signedUrl)}`
      : null;

  const isPdf = isPdfMime(file.mimeType, ext);
  const canEmbedInBrowser =
    isFileLikeExternalSource && (isImageMime(file.mimeType) || isPdf || isTextMime(file.mimeType, ext));
  const needsOpenButton = !canEmbedInBrowser && !officeViewerUrl;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-black text-textBase">문서 보기</h2>
          <p className="mt-1 text-xs text-textMuted break-all">{file.name}</p>
        </div>
        <NavigationLink
          href={backPath}
          className="rounded-lg bg-surface px-3 py-2 text-xs font-semibold text-textBase"
        >
          목록으로 돌아가기
        </NavigationLink>
      </div>

      <article className="rounded-2xl border border-borderColor bg-white p-3">
        {officeViewerUrl ? (
          <iframe
            src={officeViewerUrl}
            title={file.name}
            className="h-[72vh] w-full rounded-xl border border-borderColor"
            allow="clipboard-read; clipboard-write"
          />
        ) : isPdf && isFileLikeExternalSource ? (
          <PdfViewerClient fileUrl={openUrl} />
        ) : canEmbedInBrowser ? (
          isImageMime(file.mimeType) ? (
            <div className="overflow-auto rounded-xl border border-borderColor bg-surface">
              <img src={openUrl} alt={file.name} className="mx-auto h-auto max-w-full" />
            </div>
          ) : (
            <iframe
              src={openUrl}
              title={file.name}
              className="h-[72vh] w-full rounded-xl border border-borderColor"
            />
          )
        ) : (
          <div className="flex min-h-[44vh] flex-col items-center justify-center rounded-xl border border-dashed border-borderColor bg-surface px-4 text-center">
            <FileText className="h-8 w-8 text-textMuted" />
            <p className="mt-3 text-sm font-semibold text-textBase">이 형식은 웹 미리보기가 제한됩니다.</p>
            <p className="mt-1 text-xs text-textMuted">열기 또는 다운로드 버튼으로 확인해주세요.</p>
          </div>
        )}
      </article>

      {needsOpenButton ? (
        <div className="grid grid-cols-2 gap-2">
          <a
            href={openUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white"
          >
            원본 열기 <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <a
            href={downloadUrl}
            className="inline-flex items-center justify-center gap-1 rounded-lg bg-white px-3 py-2 text-xs font-bold text-textBase"
          >
            다운로드 <Download className="h-3.5 w-3.5" />
          </a>
        </div>
      ) : (
        <div>
          <a
            href={downloadUrl}
            className="inline-flex w-full items-center justify-center gap-1 rounded-lg bg-white px-3 py-2 text-xs font-bold text-textBase"
          >
            다운로드 <Download className="h-3.5 w-3.5" />
          </a>
        </div>
      )}

      {OFFICE_EMBED_EXTENSIONS.has(ext) && !hasRemoteSignedUrl ? (
        <p className="rounded-lg bg-warning/10 px-3 py-2 text-xs font-semibold text-warning">
          현재 저장소 서명 URL을 만들 수 없어 문서 임베드 미리보기가 제한됩니다. 그래도 열기/다운로드는 가능합니다.
        </p>
      ) : null}
      {!isFileLikeExternalSource ? (
        <p className="rounded-lg bg-warning/10 px-3 py-2 text-xs font-semibold text-warning">
          이 항목은 파일 링크가 아니라 외부 페이지 링크입니다. 앱 내 미리보기 대신 바로 열기 버튼을 이용해 주세요.
        </p>
      ) : null}
    </section>
  );
}
