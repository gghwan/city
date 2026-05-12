'use client';

type PdfViewerClientProps = {
  fileUrl: string;
};

export function PdfViewerClient({ fileUrl }: PdfViewerClientProps) {
  const viewerSrc = `${fileUrl}#toolbar=1&navpanes=0&view=FitH`;

  return (
    <div className="h-[72vh] overflow-hidden rounded-xl border border-borderColor bg-white">
      <iframe
        src={viewerSrc}
        title="PDF 미리보기"
        className="h-full w-full"
      />
    </div>
  );
}
