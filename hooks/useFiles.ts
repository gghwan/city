'use client';

import { useEffect } from 'react';
import type { FileItem } from '@/types';
import { useFileStore } from '@/stores/file.store';

export function useFiles(initialFiles: FileItem[]) {
  const files = useFileStore((state) => state.files);
  const setFiles = useFileStore((state) => state.setFiles);

  useEffect(() => {
    setFiles(initialFiles);
  }, [initialFiles, setFiles]);

  return { files, setFiles };
}
