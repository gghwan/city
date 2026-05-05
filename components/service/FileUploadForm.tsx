'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CloudUpload, Loader2, Paperclip, X } from 'lucide-react';
import { FILE_ACCEPT_HINT } from '@/lib/constants';

function formatBytes(bytes: number) {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)}MB`;
}

export function FileUploadForm({ type }: { type: 'SERVICE' | 'EMERGENCY' | 'TALK' }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const pickFile = (file: File | null) => {
    if (!file) return;
    setSelectedFile(file);
    setName(file.name);
    setError('');
    setSuccess('');
  };

  const handleDrop: React.DragEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    if (isUploading) return;
    const file = event.dataTransfer.files?.[0] ?? null;
    pickFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || isUploading) return;

    setIsUploading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('type', type);
      formData.append('name', name.trim() || selectedFile.name);
      formData.append('description', description.trim());
      formData.append('file', selectedFile);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.message || '업로드에 실패했습니다. 다시 시도해주세요.');
      }

      setSuccess('업로드가 완료되었습니다.');
      setSelectedFile(null);
      setName('');
      setDescription('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      router.refresh();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : '업로드에 실패했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-3 rounded-2xl border border-borderColor bg-white p-4">
      <input
        ref={fileInputRef}
        type="file"
        accept={FILE_ACCEPT_HINT}
        className="hidden"
        onChange={(event) => pickFile(event.target.files?.[0] ?? null)}
        disabled={isUploading}
      />

      <div
        role="button"
        tabIndex={0}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            if (!isUploading) fileInputRef.current?.click();
          }
        }}
        onDragEnter={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (!isUploading) setIsDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (!isUploading) setIsDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setIsDragging(false);
        }}
        onDrop={handleDrop}
        className={`rounded-xl border-2 border-dashed p-5 text-center transition ${
          isDragging ? 'border-primary bg-primary/5' : 'border-borderColor bg-surface'
        }`}
      >
        <CloudUpload className="mx-auto mb-2 h-6 w-6 text-primary" />
        <p className="text-sm font-semibold text-textBase">파일을 드래그해서 놓거나 클릭해서 선택하세요</p>
        <p className="mt-1 text-xs text-textMuted">이미지, PDF, XML, DOCX, HWPX, PPTX 등 업로드 가능 (최대 4MB)</p>
      </div>

      {selectedFile && (
        <div className="rounded-xl border border-borderColor bg-surface p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="flex items-center gap-1 truncate text-xs font-semibold text-textBase">
                <Paperclip className="h-3.5 w-3.5" />
                {selectedFile.name}
              </p>
              <p className="text-[11px] text-textMuted">{formatBytes(selectedFile.size)}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedFile(null);
                setName('');
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="rounded-lg p-1 text-textMuted hover:bg-white"
              aria-label="선택 파일 제거"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="rounded-lg border border-borderColor px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="파일명"
            />
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="rounded-lg border border-borderColor px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="설명(선택)"
            />
          </div>

          <button
            type="button"
            onClick={handleUpload}
            disabled={isUploading || !selectedFile}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white hover:bg-primaryHover disabled:opacity-60"
          >
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isUploading ? '업로드 중...' : '파일 업로드'}
          </button>
        </div>
      )}

      {error && <p className="rounded-lg bg-error/10 px-3 py-2 text-xs font-semibold text-error">{error}</p>}
      {success && <p className="rounded-lg bg-success/10 px-3 py-2 text-xs font-semibold text-success">{success}</p>}
    </div>
  );
}
